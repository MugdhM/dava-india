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
  let lastError: unknown;

  for (const model of ['gemini-2.5-flash', 'gemini-2.5-flash-lite']) {
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
          timeoutId = setTimeout(() => reject(new Error(`Timeout with model ${model}`)), 22000);
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
      lastError = error;
      console.error(`[Prescription OCR] Model ${model} failed:`, error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  const providerError =
    lastError instanceof Error ? lastError.message.toLowerCase() : '';
  console.error('[Prescription OCR] All vision models failed:', lastError);

  const userError = providerError.includes('api key') || providerError.includes('unauthorized')
    ? lang === 'en'
      ? 'Gemini rejected the API key. Replace GEMINI_API_KEY in Vercel with a valid, active key and redeploy.'
      : 'Gemini API key अस्वीकार हुई। Vercel में GEMINI_API_KEY को नई वैध key से बदलकर redeploy करें।'
    : providerError.includes('quota') || providerError.includes('resource_exhausted') || providerError.includes('429')
      ? lang === 'en'
        ? 'Gemini API quota or rate limit was reached. Check the API project quota and try again later.'
        : 'Gemini API की quota या rate limit पूरी हो गई है। API project quota जाँचें और बाद में फिर कोशिश करें।'
      : lang === 'en'
        ? 'Gemini could not read this prescription. Check that the API key has access to Gemini 2.5 Flash, then try a sharp, well-lit photo.'
        : 'Gemini इस पर्ची को पढ़ नहीं पाया। जाँचें कि API key को Gemini 2.5 Flash का access है, फिर साफ़ और अच्छी रोशनी वाली फोटो से कोशिश करें।';

  return res.status(200).json({
    success: false,
    error: userError,
  });
}
