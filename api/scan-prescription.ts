import { GoogleGenAI } from '@google/genai';
import type { Request, Response } from 'express';

const LANGUAGE_PROMPT_MAP: Record<string, string> = {
  hi: 'Hindi (शुद्ध और सरल हिन्दी भाषा - केवल देवनागरी लिपि)',
  en: 'English (Pure, standard English only - strictly DO NOT use Hindi or mixed Indian words)',
  mwr: 'Marwari / Rajasthani (शुद्ध मारवाड़ी भाषा - देवनागरी लिपि में)',
  gu: 'Gujarati (શુદ્ધ અને સરળ ગુજરાતી ભાષા - સંપૂર્ણપણે ગુજરાતી લિપિ)',
  ta: 'Tamil (தெளிவான எளிய தமிழ் மொழி - தமிழ் எழுத்துக்கள்)',
  pa: 'Punjabi (ਸ਼ੁੱਧ ਅਤੇ ਸਪੱਸ਼ਟ ਪੰਜਾਬੀ ਬੋਲੀ - ਗੁਰਮੁਖੀ ਲਿਪੀ)',
};

function getScanError(lang: string): string {
  return lang === 'en'
    ? 'The prescription scan service encountered an error. Please check the Vercel function logs and try again.'
    : 'पर्ची स्कैन सेवा में त्रुटि आई। कृपया Vercel function logs जाँचें और फिर कोशिश करें।';
}

function getProviderError(error: unknown): { message: string; status: string } {
  if (!error || typeof error !== 'object') {
    return { message: String(error ?? ''), status: '' };
  }

  const providerError = error as Record<string, unknown>;
  const nested = providerError.error && typeof providerError.error === 'object'
    ? providerError.error as Record<string, unknown>
    : {};
  return {
    message: [
      providerError.message,
      nested.message,
      providerError.statusText,
      nested.status,
    ].filter((part): part is string => typeof part === 'string').join(' '),
    status: String(providerError.status ?? providerError.code ?? nested.code ?? nested.status ?? ''),
  };
}

function getUserScanError(errors: Array<{ message: string; status: string }>, lang: string): string {
  const details = errors.map((error) => `${error.status} ${error.message}`.toLowerCase()).join(' ');

  if (/api.?key|unauthorized|permission_denied|permission denied|\b401\b|\b403\b/.test(details)) {
    return lang === 'en'
      ? 'Gemini rejected the API key or its permissions. In Google AI Studio, verify the key is active, Gemini API is enabled, and the key restrictions allow Gemini API requests.'
      : 'Gemini API key या उसकी permission स्वीकार नहीं हुई। Google AI Studio में जाँचें कि key सक्रिय है, Gemini API चालू है और key restrictions Gemini API requests की अनुमति देती हैं।';
  }
  if (/resource_exhausted|quota|rate.?limit|\b429\b/.test(details)) {
    return lang === 'en'
      ? 'Gemini API quota or rate limit was reached. Check the quota for the Google Cloud project linked to this key, then try again.'
      : 'Gemini API quota या rate limit पूरी हो गई। इस key से जुड़े Google Cloud project की quota जाँचकर फिर कोशिश करें।';
  }
  if (/not_found|not found|unsupported model|model.*not available|\b404\b/.test(details)) {
    return lang === 'en'
      ? 'The Gemini API key cannot access the configured vision model. Check model availability for this key and redeploy.'
      : 'यह Gemini API key चुने गए vision model का उपयोग नहीं कर पा रही। इस key के लिए model availability जाँचें और फिर deploy करें।';
  }
  if (/invalid_argument|invalid image|unsupported mime|bad request|\b400\b/.test(details)) {
    return lang === 'en'
      ? 'Gemini rejected the image request. Choose a JPG, PNG, or WEBP image and try again.'
      : 'Gemini ने फोटो request स्वीकार नहीं की। JPG, PNG या WEBP फोटो चुनकर फिर कोशिश करें।';
  }
  if (/timeout|timed out/.test(details)) {
    return lang === 'en'
      ? 'Gemini did not respond in time. Please retry with a smaller, clear image; if this continues, check the Vercel function logs.'
      : 'Gemini ने समय पर जवाब नहीं दिया। छोटी और साफ फोटो से फिर कोशिश करें; समस्या बनी रहे तो Vercel function logs जाँचें।';
  }

  return lang === 'en'
    ? 'Gemini could not complete the prescription scan. Check the Vercel function logs for the provider error, then try again.'
    : 'Gemini पर्ची स्कैन पूरा नहीं कर पाया। Provider error के लिए Vercel function logs जाँचें और फिर कोशिश करें।';
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const lang = typeof body.lang === 'string' ? body.lang : 'hi';
  const imageBase64 = body.imageBase64;

  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return res.status(400).json({
      success: false,
      error: lang === 'en' ? 'Image data is required.' : 'पर्ची की फोटो ज़रूरी है।',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      error:
        lang === 'en'
          ? 'Gemini API key is not configured. Add GEMINI_API_KEY in Vercel Project Settings → Environment Variables.'
          : 'Gemini API key कॉन्फ़िगर नहीं है। Vercel Project Settings → Environment Variables में GEMINI_API_KEY जोड़ें।',
    });
  }

  const languageInstruction = LANGUAGE_PROMPT_MAP[lang] || LANGUAGE_PROMPT_MAP.hi;
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
  const mimeType =
    mimeMatch?.[1] ||
    (typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')
      ? body.mimeType
      : 'image/jpeg');
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return res.status(400).json({
      success: false,
      error:
        lang === 'en'
          ? 'Use a JPG, PNG, or WEBP prescription image.'
          : 'पर्ची की फोटो JPG, PNG या WEBP में अपलोड करें।',
    });
  }

  if (
    cleanBase64.length > 3_000_000 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)
  ) {
    return res.status(413).json({
      success: false,
      error:
        lang === 'en'
          ? 'The image is too large or invalid. Choose a smaller, clear photo and try again.'
          : 'फोटो बहुत बड़ी या अमान्य है। छोटी और साफ़ फोटो चुनकर फिर कोशिश करें।',
    });
  }

  const promptText = `You are an expert clinical pharmacist and AI medical prescription reader.
The image may contain a printed or handwritten medical prescription. Carefully read both printed text and handwriting, including medicine names, strengths, abbreviations, dose schedules, duration, and food instructions. Preserve the exact medicine names and strengths that are legible. Do not invent or substitute medicines. If any handwriting is uncertain, mark it as unclear in the summary or warning instead of guessing. If the image is blank, not a medical document, or illegible, return {"error":"unreadable","meds":[]}.

Write all explanations, purposes, dosages, meal instructions, side effects, warnings, and follow-up strictly in ${languageInstruction}. Write medicine names and strengths in standard Latin script.
Only include a dose schedule or duration when it can be read from the prescription. Use an empty times array and days: 0 when these details are not specified. Do not provide diagnosis or medicine advice beyond the visible prescription.

Return only a strict JSON object with this schema:
{
  "doctor": "Doctor or clinic name if visible",
  "date": "Prescription date",
  "patientName": "Patient name if visible",
  "summary": "Brief diagnosis or treatment summary in ${languageInstruction}",
  "meds": [
    {
      "name": "Exact medicine name and strength",
      "purpose": "Purpose in ${languageInstruction}",
      "dose": "Dose in ${languageInstruction}",
      "times": [],
      "meal": "Meal instructions in ${languageInstruction}",
      "days": 0,
      "side_effects": "Known mild side effects in ${languageInstruction}",
      "avoid_food": "Dietary cautions in ${languageInstruction}",
      "avoid_drugs": "Contraindicated medicines in ${languageInstruction}"
    }
  ],
  "warnings": ["Safety alerts in ${languageInstruction}"],
  "followUp": "Doctor follow-up schedule in ${languageInstruction}"
}`;

  let ai: GoogleGenAI;
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('[Prescription OCR] Failed to initialize Gemini client:', error);
    return res.status(500).json({ success: false, error: getScanError(lang) });
  }
  const providerErrors: Array<{ model: string; message: string; status: string }> = [];

  const models = [
    { name: 'gemini-2.5-flash', timeoutMs: 35_000 },
    { name: 'gemini-2.5-flash-lite', timeoutMs: 15_000 },
  ];
  for (const { name: model, timeoutMs } of models) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: {
            parts: [
              { inlineData: { mimeType, data: cleanBase64 } },
              { text: promptText },
            ],
          },
        }),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`Timeout with model ${model}`)), timeoutMs);
        }),
      ]);

      if (!response.text) {
        throw new Error(`Model ${model} returned an empty response`);
      }

      const jsonMatch = response.text.trim().match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Model ${model} returned invalid JSON`);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validTimes = ['morning', 'afternoon', 'evening', 'night'];
      const medicines = Array.isArray(parsed.meds)
        ? parsed.meds
            .filter((med: unknown) => med !== null && typeof med === 'object')
            .map((med: Record<string, unknown>) => ({
              name: typeof med.name === 'string' ? med.name.trim() : '',
              purpose: typeof med.purpose === 'string' ? med.purpose : '',
              dose: typeof med.dose === 'string' ? med.dose : '',
              times: Array.isArray(med.times)
                ? med.times.filter(
                    (time: unknown): time is string =>
                      typeof time === 'string' && validTimes.includes(time)
                  )
                : [],
              meal: typeof med.meal === 'string' ? med.meal : '',
              days:
                typeof med.days === 'number' && Number.isFinite(med.days) && med.days > 0
                  ? Math.floor(med.days)
                  : 0,
              side_effects: typeof med.side_effects === 'string' ? med.side_effects : '',
              avoid_food: typeof med.avoid_food === 'string' ? med.avoid_food : '',
              avoid_drugs: typeof med.avoid_drugs === 'string' ? med.avoid_drugs : '',
            }))
            .filter((med) => med.name.length > 0)
        : [];

      if (parsed.error === 'unreadable' || medicines.length === 0) {
        return res.status(200).json({
          success: false,
          error:
            lang === 'en'
              ? 'No medicines could be clearly recognized. Please upload a clearer, well-lit photo.'
              : 'इस फोटो में दवाइयों के नाम स्पष्ट नहीं दिख रहे हैं। कृपया साफ़ और अच्छी रोशनी वाली फोटो अपलोड करें।',
        });
      }

      parsed.meds = medicines;
      parsed.warnings = Array.isArray(parsed.warnings)
        ? parsed.warnings.filter((warning: unknown): warning is string => typeof warning === 'string')
        : [];
      parsed.doctor = typeof parsed.doctor === 'string' ? parsed.doctor : '';
      parsed.date = typeof parsed.date === 'string' ? parsed.date : '';
      parsed.patientName = typeof parsed.patientName === 'string' ? parsed.patientName : '';
      parsed.summary = typeof parsed.summary === 'string' ? parsed.summary : '';
      parsed.followUp = typeof parsed.followUp === 'string' ? parsed.followUp : '';

      return res.status(200).json({ success: true, data: parsed, isRealScan: true });
    } catch (error) {
      const details = getProviderError(error);
      providerErrors.push({ model, ...details });
      console.error(`[Prescription OCR] Model ${model} failed (status ${details.status || 'unknown'}): ${details.message || String(error)}`);
      if (
        /\b401\b|\b403\b|\b429\b|api.?key|unauthorized|permission_denied|resource_exhausted|quota/i.test(
          `${details.status} ${details.message}`
        )
      ) {
        break;
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  console.error('[Prescription OCR] All vision models failed:', providerErrors);

  return res.status(200).json({
    success: false,
    error: getUserScanError(providerErrors, lang),
  });
}
