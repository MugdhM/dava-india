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

  const apiKey =
    (typeof req.headers['x-gemini-key'] === 'string' ? req.headers['x-gemini-key'] : '') ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

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

  const promptText = `You are an expert clinical pharmacist and AI medical prescription reader.
Transcribe and analyze only the exact prescription image provided. Extract only medicines actually visible; never invent or substitute medicines. If the image is blank, not a medical document, or illegible, return {"error":"unreadable","meds":[]}.

Write all explanations, purposes, dosages, meal instructions, side effects, warnings, and follow-up strictly in ${languageInstruction}. Write medicine names and strengths in standard Latin script.

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
      "times": ["morning", "afternoon", "evening", "night"],
      "meal": "Meal instructions in ${languageInstruction}",
      "days": 5,
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

  for (const model of ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash']) {
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
          timeoutId = setTimeout(() => reject(new Error(`Timeout with model ${model}`)), 9000);
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
      if (parsed.error === 'unreadable' || !Array.isArray(parsed.meds) || parsed.meds.length === 0) {
        return res.status(200).json({
          success: false,
          error:
            lang === 'en'
              ? 'No medicines could be clearly recognized. Please upload a clearer, well-lit photo.'
              : 'इस फोटो में दवाइयों के नाम स्पष्ट नहीं दिख रहे हैं। कृपया साफ़ और अच्छी रोशनी वाली फोटो अपलोड करें।',
        });
      }

      return res.status(200).json({ success: true, data: parsed, isRealScan: true });
    } catch (error) {
      lastError = error;
      console.error(`[Prescription OCR] Model ${model} failed:`, error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  console.error('[Prescription OCR] All vision models failed:', lastError);
  return res.status(200).json({
    success: false,
    error:
      lang === 'en'
        ? 'The prescription could not be scanned. Please try again with a clear, well-lit photo.'
        : 'पर्ची स्कैन नहीं हो सकी। कृपया साफ़ और अच्छी रोशनी वाली फोटो से फिर कोशिश करें।',
  });
}
