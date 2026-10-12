import { GoogleGenAI } from '@google/genai';
import { evaluateClinicalInteractions, InteractionReport } from './clinicalInteractions';
import { MedicineItem, Prescription } from '../types';

// Language specifications for Gemini Prompts
const LANGUAGE_PROMPT_MAP: Record<string, string> = {
  hi: 'Hindi (शुद्ध और सरल हिन्दी भाषा - केवल देवनागरी लिपि)',
  en: 'English (Pure, standard English only - strictly DO NOT use Hindi or mixed Indian words)',
  mwr: 'Marwari / Rajasthani (शुद्ध मारवाड़ी भाषा - देवनागरी लिपि में)',
  gu: 'Gujarati (શુદ્ધ અને સરળ ગુજરાતી ભાષા - સંપૂર્ણપણે ગુજરાતી લિપિ)',
  ta: 'Tamil (தெளிவான எளிய தமிழ் மொழி - தமிழ் எழுத்துக்கள்)',
  pa: 'Punjabi (ਸ਼ੁੱਧ ਅਤੇ ਸਪੱਸ਼ਟ ਪੰਜਾਬੀ ਬੋਲੀ - ਗੁਰਮੁਖੀ ਲਿਪੀ)',
};

// Client-side Gemini instance helper
function getClientKey(): string | null {
  const env = (import.meta as any).env || {};
  return (
    env.VITE_GEMINI_API_KEY ||
    env.GEMINI_API_KEY ||
    (typeof window !== 'undefined' && ((window as any).__GEMINI_API_KEY__ || (window as any).GEMINI_API_KEY)) ||
    null
  );
}

function getClientGemini(): GoogleGenAI | null {
  const clientKey = getClientKey();
  if (!clientKey) return null;
  return new GoogleGenAI({
    apiKey: clientKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-client',
      },
    },
  });
}

/**
 * Scan prescription image with server API first, and automatically fall back
 * to client-side Gemini if deployed as a static site (e.g. Vercel/Netlify) with VITE_GEMINI_API_KEY.
 */
export async function scanPrescriptionImage(
  imageBase64: string,
  lang: string = 'hi'
): Promise<{ success: boolean; data?: any; error?: string }> {
  const clientKey = getClientKey();
  let endpointStatus: number | null = null;

  // 1. Try server endpoint first
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (clientKey) {
      headers['x-gemini-key'] = clientKey;
    }

    const response = await fetch('/api/scan-prescription', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageBase64,
        lang,
      }),
    });

    if (response.ok) {
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        if (result && result.success && result.data) {
          return result;
        }
        if (result && result.error) {
          return { success: false, error: result.error };
        }
      } catch (jsonErr) {
        console.warn('Could not parse server JSON response:', jsonErr);
      }
    } else {
      endpointStatus = response.status;
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        if (typeof result?.error === 'string') {
          return { success: false, error: result.error };
        }
      } catch (jsonErr) {
        console.warn('Could not parse server error response:', jsonErr);
      }
      console.warn(`Server responded with status ${response.status}`);
    }
  } catch (netErr) {
    console.warn('Network call to /api/scan-prescription failed:', netErr);
  }

  // 2. Client-side Fallback using VITE_GEMINI_API_KEY (for Netlify/Vercel static deployments)
  const clientAi = getClientGemini();
  if (clientAi) {
    console.log('[Prescription OCR] Running client-side Gemini fallback with VITE_GEMINI_API_KEY...');
    try {
      const languageInstruction = LANGUAGE_PROMPT_MAP[lang] || LANGUAGE_PROMPT_MAP.hi;
      let cleanBase64 = imageBase64;
      let detectedMimeType = 'image/jpeg';
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        detectedMimeType = parts[0].replace('data:', '') || 'image/jpeg';
        cleanBase64 = parts[1];
      }

      const promptText = `You are an expert clinical pharmacist and prescription reader assistant in India.
Carefully examine this prescription or medical note photo and extract ONLY genuine medical information visible in it.
Language instruction: All explanations, medication purposes, instructions, warnings, and precautions MUST be 100% in ${languageInstruction}.
Extract:
1. Doctor name and clinic/hospital
2. Date of prescription
3. Patient name
4. Clear 1-sentence summary of diagnosis/prescription
5. List of ALL medicines prescribed with:
   - name: Medicine trade/generic name with dosage (e.g., Paracetamol 650mg)
   - purpose: Why it is prescribed in ${languageInstruction}
   - dosage: Quantity per dose (e.g. 1 गोली, 1 चम्मच, 1 कैप्सूल)
   - times: Array of daily timing tags from ["morning", "afternoon", "evening", "night"]
   - withFood: Instruction on food intake ("before_food", "after_food", or "with_food")
   - days: Duration in number of days
   - sideEffects: Common side effects in ${languageInstruction}
   - precautions: Food and lifestyle precautions in ${languageInstruction}
   - interactions: Known drug/food interactions in ${languageInstruction}
6. Warnings & precautions in ${languageInstruction}
7. Follow-up instruction in ${languageInstruction}

Return ONLY strict valid JSON matching this schema:
{
  "doctor": "Doctor name",
  "date": "YYYY-MM-DD",
  "patientName": "Patient name",
  "summary": "1-sentence summary in ${languageInstruction}",
  "meds": [
    {
      "name": "Medicine Name with dosage",
      "purpose": "Purpose in ${languageInstruction}",
      "dosage": "1 गोली",
      "times": ["morning", "night"],
      "withFood": "after_food",
      "days": 5,
      "sideEffects": "Side effects in ${languageInstruction}",
      "precautions": "Precautions in ${languageInstruction}",
      "interactions": "Interactions in ${languageInstruction}"
    }
  ],
  "warnings": ["Warning 1 in ${languageInstruction}"],
  "followUp": "Follow-up advice in ${languageInstruction}"
}
Do NOT wrap with markdown. Return pure JSON.`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
      for (const m of candidateModels) {
        try {
          const res = await clientAi.models.generateContent({
            model: m,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: detectedMimeType,
                    data: cleanBase64,
                  },
                },
                { text: promptText },
              ],
            },
          });

          if (res && res.text) {
            let clean = res.text.trim();
            const match = clean.match(/\{[\s\S]*\}/);
            if (match) clean = match[0];
            const parsed = JSON.parse(clean);
            if (parsed && Array.isArray(parsed.meds) && parsed.meds.length > 0) {
              return { success: true, data: parsed };
            }
          }
        } catch (mErr) {
          console.warn(`Client model ${m} error:`, mErr);
        }
      }
    } catch (clientErr: any) {
      console.error('Client Gemini OCR failed:', clientErr);
    }
  }

  // 3. Fallback error guidance
  return {
    success: false,
    error: endpointStatus === 404
      ? lang === 'en'
        ? 'Prescription scan API returned 404. Redeploy the latest Vercel project and ensure the root api/ folder is included. Adding GEMINI_API_KEY alone will not fix a missing API route.'
        : 'पर्ची स्कैन API पर 404 मिला। Vercel पर latest deployment करें और सुनिश्चित करें कि root api/ folder deploy हुआ है। सिर्फ GEMINI_API_KEY जोड़ने से missing API route ठीक नहीं होगा।'
      : endpointStatus !== null
        ? lang === 'en'
          ? `Prescription scan service returned status ${endpointStatus}. Please check the deployment logs and try again.`
          : `पर्ची स्कैन सेवा से संपर्क में समस्या आई (Status ${endpointStatus})। Deployment logs जाँचें और फिर कोशिश करें।`
        : lang === 'en'
          ? 'Could not connect to the prescription scan service. Please check your connection and try again.'
          : 'पर्ची स्कैन सेवा से संपर्क नहीं हो सका। अपना इंटरनेट कनेक्शन जाँचें और फिर कोशिश करें।',
  };
}

/**
 * Check drug interactions via server endpoint, or client-side fallback.
 */
export async function checkInteractionsService(
  medicines: string[],
  lang: string = 'hi'
): Promise<InteractionReport> {
  const clientKey = getClientKey();

  // 1. Try server endpoint
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (clientKey) {
      headers['x-gemini-key'] = clientKey;
    }

    const res = await fetch('/api/check-interactions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ medicines, lang }),
    });

    if (res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json && json.success && json.data) {
          return json.data;
        }
      } catch (e) {
        console.warn('Failed to parse interaction JSON:', e);
      }
    }
  } catch (err) {
    console.warn('Interaction API call failed, falling back to clinical engine:', err);
  }

  // 2. Client-side Clinical Knowledge Engine Fallback (Instant, 100% reliable)
  return evaluateClinicalInteractions(medicines, lang);
}

/**
 * Chat assistant via server endpoint, or client-side fallback.
 */
export async function chatAssistantService(
  message: string,
  lang: string = 'hi',
  history: any[] = [],
  activeMedicines: string[] = []
): Promise<string> {
  const clientKey = getClientKey();

  // 1. Try server endpoint
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (clientKey) {
      headers['x-gemini-key'] = clientKey;
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        lang,
        history,
        activeMedicines,
      }),
    });

    if (res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json && json.reply) {
          return json.reply;
        }
      } catch (e) {
        console.warn('Failed to parse chat response:', e);
      }
    }
  } catch (err) {
    console.warn('Chat API failed, using client-side response:', err);
  }

  // 2. Client-side Gemini fallback if VITE_GEMINI_API_KEY is available
  const clientAi = getClientGemini();
  if (clientAi) {
    try {
      const languageInstruction = LANGUAGE_PROMPT_MAP[lang] || LANGUAGE_PROMPT_MAP.hi;
      const prompt = `You are DawaiMitra, an empathetic, certified AI medical companion in India.
User query: "${message}"
Active patient medicines: ${activeMedicines.join(', ') || 'None'}
Language instruction: All advice MUST be 100% in ${languageInstruction}.
Keep response concise, medically sound, and caring. Include disclaimer to consult doctor.`;

      const response = await clientAi.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (e) {
      console.warn('Client Gemini chat failed:', e);
    }
  }

  // 3. Fallback generic guidance
  return lang === 'en'
    ? 'For your health query: Please take medicines on time as prescribed by your doctor. Drink plenty of water and rest. If symptoms worsen, consult your doctor immediately.'
    : 'आपकी सेहत के लिए सलाह: दवाइयों को हमेशा डॉक्टर के बताए अनुसार समय पर लें। पर्याप्त पानी पिएं और आराम करें। किसी भी समस्या पर तुरंत डॉक्टर से संपर्क करें।';
}
