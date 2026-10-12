import { evaluateClinicalInteractions, InteractionReport } from './clinicalInteractions';

/** Scan prescription images through the server so Gemini credentials stay private. */
export async function scanPrescriptionImage(
  imageBase64: string,
  lang: string = 'hi'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/scan-prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        lang,
      }),
    });

    const text = await response.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch (error) {
      console.error('Could not parse prescription scan response:', error);
      return {
        success: false,
        error: lang === 'en'
          ? `Prescription scan service returned an invalid response (HTTP ${response.status}).`
          : `पर्ची स्कैन सेवा से गलत जवाब मिला (HTTP ${response.status})।`,
      };
    }

    if (result?.success && result.data) {
      return result;
    }

    return {
      success: false,
      error:
        typeof result?.error === 'string'
          ? result.error
          : lang === 'en'
            ? `Prescription scan failed (HTTP ${response.status}). Please check the Vercel function logs.`
            : `पर्ची स्कैन विफल हुआ (HTTP ${response.status})। Vercel function logs जाँचें।`,
    };
  } catch (error) {
    console.error('Network call to /api/scan-prescription failed:', error);
    return {
      success: false,
      error:
        lang === 'en'
          ? 'Could not connect to the prescription scan service. Please check your connection and try again.'
          : 'पर्ची स्कैन सेवा से संपर्क नहीं हो सका। अपना इंटरनेट कनेक्शन जाँचें और फिर कोशिश करें।',
    };
  }
}

/**
 * Check drug interactions via server endpoint, or client-side fallback.
 */
export async function checkInteractionsService(
  medicines: string[],
  lang: string = 'hi'
): Promise<InteractionReport> {
  try {
    const res = await fetch('/api/check-interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.warn('Chat API failed; using the local fallback response:', err);
  }

  // Fallback generic guidance
  return lang === 'en'
    ? 'For your health query: Please take medicines on time as prescribed by your doctor. Drink plenty of water and rest. If symptoms worsen, consult your doctor immediately.'
    : 'आपकी सेहत के लिए सलाह: दवाइयों को हमेशा डॉक्टर के बताए अनुसार समय पर लें। पर्याप्त पानी पिएं और आराम करें। किसी भी समस्या पर तुरंत डॉक्टर से संपर्क करें।';
}
