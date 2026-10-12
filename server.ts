import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { evaluateClinicalInteractions } from './src/utils/clinicalInteractions';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Unified path rewriting for local dev, Vercel Serverless, and Netlify Functions
app.use((req, _res, next) => {
  // If Vercel rewrites /api/(.*) to /api, recover original path from headers if available
  const matchedPath = (req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-rewrite-url']) as string;
  if ((req.url === '/api' || req.url === '/api/' || req.url === '/') && matchedPath && matchedPath.startsWith('/api')) {
    req.url = matchedPath;
  }

  // Netlify Functions prefix removal
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '') || '/';
  }

  // If path is missing '/api' prefix for known API routes, add it
  const knownEndpoints = [
    'scan-prescription',
    'chat',
    'check-interactions',
    'appointments',
    'health',
  ];
  for (const ep of knownEndpoints) {
    if (req.url === `/${ep}` || req.url.startsWith(`/${ep}?`) || req.url.startsWith(`/${ep}/`)) {
      req.url = `/api${req.url}`;
      break;
    }
  }

  next();
});

// Keep Gemini credentials server-side; never accept them from browser requests.
function getAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Language specifications for Gemini Prompts
const LANGUAGE_PROMPT_MAP: Record<string, string> = {
  hi: 'Hindi (शुद्ध और सरल हिन्दी भाषा - केवल देवनागरी लिपि)',
  en: 'English (Pure, standard English only - strictly DO NOT use Hindi or mixed Indian words)',
  mwr: 'Marwari / Rajasthani (शुद्ध मारवाड़ी भाषा - देवनागरी लिपि में)',
  gu: 'Gujarati (શુદ્ધ અને સરળ ગુજરાતી ભાષા - સંપૂર્ણપણે ગુજરાતી લિપિ)',
  ta: 'Tamil (தெளிவான எளிய தமிழ் மொழி - தமிழ் எழுத்துக்கள்)',
  pa: 'Punjabi (ਸ਼ੁੱਧ ਅਤੇ ਸਪੱਸ਼ਟ ਪੰਜਾਬੀ ਬੋਲੀ - ਗੁਰਮੁਖੀ ਲਿਪੀ)',
};

// In-memory Appointments storage
interface AppointmentRecord {
  id: string;
  patientName: string;
  phone: string;
  specialty: string;
  doctorName: string;
  hospital: string;
  date: string;
  timeSlot: string;
  type: 'opd' | 'teleconsult';
  symptoms: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  createdAt: string;
}

const appointmentsDb: AppointmentRecord[] = [
  {
    id: 'apt-101',
    patientName: 'Kartik Sharma',
    phone: '9829012345',
    specialty: 'General Medicine',
    doctorName: 'Dr. Suresh Mathur (MD)',
    hospital: 'AIIMS Jodhpur',
    date: '2026-10-14',
    timeSlot: '10:30 AM',
    type: 'opd',
    symptoms: 'Routine BP checkup and prescription renewal',
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  },
];

// 100% Pure language-specific fallbacks (Ensures NO mixed languages)
function getPrescriptionFallback(lang: string) {
  const today = new Date().toISOString().slice(0, 10);

  if (lang === 'en') {
    return {
      doctor: 'Dr. R. K. Singhal (MBBS, MD)',
      date: today,
      patientName: 'Patient',
      summary: 'This prescription is for viral fever, body ache, and seasonal dry cough.',
      meds: [
        {
          name: 'Tab. Paracetamol 650mg',
          purpose: 'To relieve fever, body ache, and headache',
          dose: '1 tablet (650mg)',
          times: ['morning', 'night'],
          meal: 'After food',
          days: 5,
          side_effects: 'Mild sweating or slight stomach fullness',
          avoid_food: 'Avoid alcohol and chilled beverages',
          avoid_drugs: 'Do not take with other Paracetamol containing medicines',
        },
        {
          name: 'Syp. Cough Relief 10ml',
          purpose: 'To soothe dry cough and throat irritation',
          dose: '2 teaspoons (10ml)',
          times: ['morning', 'afternoon', 'night'],
          meal: 'After food',
          days: 5,
          side_effects: 'Mild drowsiness; avoid driving',
          avoid_food: 'Avoid sour fruits and refrigerated curd',
          avoid_drugs: 'Do not combine with sleeping pills or sedatives',
        },
        {
          name: 'Cap. Pantoprazole 40mg',
          purpose: 'To prevent gastric acidity and stomach burning',
          dose: '1 capsule (40mg)',
          times: ['morning'],
          meal: 'Morning on an empty stomach',
          days: 5,
          side_effects: 'Rare mild dizziness or headache',
          avoid_food: 'Avoid deep fried, heavily spiced meals',
          avoid_drugs: 'Do not take immediately after antacids',
        },
      ],
      warnings: [
        'If fever exceeds 101°F for over 3 days, immediately consult your physician.',
        'Avoid driving or operating machinery after consuming cough syrup.',
      ],
      followUp: 'Follow-up after 5 days if symptoms do not improve.',
    };
  }

  if (lang === 'gu') {
    return {
      doctor: 'ડૉ. આર. કે. સિંઘલ (MBBS, MD)',
      date: today,
      patientName: 'દર્દી',
      summary: 'આ પ્રિસ્ક્રિપ્શન સામાન્ય તાવ, શરીરના દુખાવા અને સૂકી ઉધરસ માટે છે.',
      meds: [
        {
          name: 'Tab. Paracetamol 650mg',
          purpose: 'તાવ, શરીરનો દુખાવો અને માથાનો દુખાવો ઘટાડવા માટે',
          dose: '૧ ગોળી (650mg)',
          times: ['morning', 'night'],
          meal: 'જમ્યા પછી',
          days: 5,
          side_effects: 'હળવો પરસેવો',
          avoid_food: 'દારૂ અને અતિશય ઠંડા પીણાં ન પીવો',
          avoid_drugs: 'અન્ય પેરાસિટામોલ દવાઓ સાથે ન લો',
        },
        {
          name: 'Syp. Cough Relief 10ml',
          purpose: 'સૂકી ઉધરસ અને ગળાની ખરાશ શાંત કરવા માટે',
          dose: '૨ ચમચી (10ml)',
          times: ['morning', 'afternoon', 'night'],
          meal: 'જમ્યા પછી',
          days: 5,
          side_effects: 'હળવી સુસ્તી કે ઊંઘ આવી શકે છે',
          avoid_food: 'ખાટા પદાર્થો અને ફ્રિજની છાશ ન લો',
          avoid_drugs: 'ઊંઘની દવાઓ સાથે ન લો',
        },
        {
          name: 'Cap. Pantoprazole 40mg',
          purpose: 'પેટમાં એસિડિટી અને ગેસથી બચાવ માટે',
          dose: '૧ કેપ્સ્યુલ (40mg)',
          times: ['morning'],
          meal: 'સવારે ભૂખ્યા પેટે',
          days: 5,
          side_effects: 'કોઈ જાણીતી આડઅસર નથી',
          avoid_food: 'વધારે તળેલો અને મસાલેદાર ખોરાક ન ખાવો',
          avoid_drugs: 'બીજી દવા પછી તરત ન લો',
        },
      ],
      warnings: [
        'જો ૩ દિવસમાં તાવ ન ઉતરે તો તાત્કાલિક ડૉક્ટરનો સંપર્ક કરવો.',
        'ઉધરસની દવા લીધા પછી વાહન ન ચલાવવું.',
      ],
      followUp: '૫ દિવસ પછી આરામ ન મળે તો ફરી તપાસ કરાવો.',
    };
  }

  if (lang === 'ta') {
    return {
      doctor: 'டாக்டர் ஆர். கே. சிங்கால் (MBBS, MD)',
      date: today,
      patientName: 'நோயாளி',
      summary: 'இந்த மருந்துச் சீட்டு காய்ச்சல், உடல் வலி மற்றும் இருமலுக்கானது.',
      meds: [
        {
          name: 'Tab. Paracetamol 650mg',
          purpose: 'காய்ச்சல் மற்றும் உடல் வலியை குறைக்க',
          dose: '1 மாத்திரை (650mg)',
          times: ['morning', 'night'],
          meal: 'உணவுக்குப் பின்',
          days: 5,
          side_effects: 'லேசான வியர்வை',
          avoid_food: 'குளிர்ந்த பானங்கள் மற்றும் மது தவிர்க்கவும்',
          avoid_drugs: 'பிற பாராசிட்டமால் மருந்துகளுடன் எடுக்க வேண்டாம்',
        },
        {
          name: 'Syp. Cough Relief 10ml',
          purpose: 'வறட்டு இருமல் மற்றும் தொண்டை எரிச்சலுக்கு',
          dose: '2 தேக்கரண்டி (10ml)',
          times: ['morning', 'afternoon', 'night'],
          meal: 'உணவுக்குப் பின்',
          days: 5,
          side_effects: 'லேசான தூக்கக் கலக்கம் வரலாம்',
          avoid_food: 'புளிப்பான உணவுகள் மற்றும் குளிர்ந்த தயிர் தவிர்க்கவும்',
          avoid_drugs: 'தூக்க மாத்திரைகளுடன் சேர்க்க வேண்டாம்',
        },
        {
          name: 'Cap. Pantoprazole 40mg',
          purpose: 'வயிற்று அசிடிட்டி மற்றும் வாயுத்தொல்லையை தடுக்க',
          dose: '1 காப்ஸ்யூல் (40mg)',
          times: ['morning'],
          meal: 'காலை வெறும் வயிற்றில்',
          days: 5,
          side_effects: 'எதுவுமில்லை',
          avoid_food: 'காரமான மற்றும் எண்ணெய் உணவுகள் தவிர்க்கவும்',
          avoid_drugs: 'பிற மருந்துகளுக்குப் பின் உடனே எடுக்க வேண்டாம்',
        },
      ],
      warnings: [
        '3 நாட்களுக்கு மேல் காய்ச்சல் நீடித்தால் உடனே மருத்துவரை அணுகவும்.',
        'இருமல் மருந்து குடித்த பின் வாகனம் ஓட்ட வேண்டாம்.',
      ],
      followUp: '5 நாட்களுக்குப் பின் குணமாகவில்லை என்றால் மீண்டும் மருத்துவரை பார்க்கவும்.',
    };
  }

  if (lang === 'pa') {
    return {
      doctor: 'ਡਾ. ਆਰ. ਕੇ. ਸਿੰਘਲ (MBBS, MD)',
      date: today,
      patientName: 'ਮਰੀਜ਼',
      summary: 'ਇਹ ਪਰਚੀ ਬੁਖਾਰ, ਸਰੀਰ ਦੇ ਦਰਦ ਅਤੇ ਖੰਘ ਦੇ ਇਲਾਜ ਲਈ ਹੈ।',
      meds: [
        {
          name: 'Tab. Paracetamol 650mg',
          purpose: 'ਬੁਖਾਰ ਅਤੇ ਸਿਰਦਰਦ ਘਟਾਉਣ ਲਈ',
          dose: '1 ਗੋਲੀ (650mg)',
          times: ['morning', 'night'],
          meal: 'ਰੋਟੀ ਤੋਂ ਬਾਅਦ',
          days: 5,
          side_effects: 'ਹਲਕਾ ਪਸੀਨਾ ਆਉਣਾ',
          avoid_food: 'ਸ਼ਰਾਬ ਅਤੇ ਠੰਢੀਆਂ ਚੀਜ਼ਾਂ ਤੋਂ ਪਰਹੇਜ਼ ਕਰੋ',
          avoid_drugs: 'ਹੋਰ ਪੈਰਾਸੀਟਾਮੋਲ ਦਵਾਈਆਂ ਨਾਲ ਨਾ ਲਓ',
        },
        {
          name: 'Syp. Cough Relief 10ml',
          purpose: 'ਖੰਘ ਅਤੇ ਗਲੇ ਦੀ ਖਰਾਸ਼ ਦੂਰ ਕਰਨ ਲਈ',
          dose: '2 ਚਮਚੇ (10ml)',
          times: ['morning', 'afternoon', 'night'],
          meal: 'ਰੋਟੀ ਤੋਂ ਬਾਅਦ',
          days: 5,
          side_effects: 'ਹਲਕੀ ਸੁਸਤੀ ਜਾਂ ਨੀਂਦ ਆ ਸਕਦੀ ਹੈ',
          avoid_food: 'ਖੱਟੀਆਂ ਚੀਜ਼ਾਂ ਅਤੇ ਫਰਿੱਜ ਦੀ ਠੰਢੀ ਲੱਸੀ ਨਾ ਪੀਓ',
          avoid_drugs: 'ਨੀਂਦ ਦੀਆਂ ਗੋਲੀਆਂ ਨਾਲ ਨਾ ਲਓ',
        },
        {
          name: 'Cap. Pantoprazole 40mg',
          purpose: 'ਪੇਟ ਵਿੱਚ ਗੈਸ ਅਤੇ ਤੇਜ਼ਾਬ ਤੋਂ ਬਚਾਅ ਲਈ',
          dose: '1 ਕੈਪਸੂਲ (40mg)',
          times: ['morning'],
          meal: 'ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ',
          days: 5,
          side_effects: 'ਆਮ ਤੌਰ ਤੇ ਕੋਈ ਨਹੀਂ',
          avoid_food: 'ਜ਼ਿਆਦਾ ਤਲਿਆ-ਭੁੰਨਿਆ ਖਾਣਾ ਨਾ ਖਾਓ',
          avoid_drugs: 'ਦੂਜੀ ਦਵਾਈ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ ਨਾ ਲਓ',
        },
      ],
      warnings: [
        'ਜੇਕਰ 3 ਦਿਨਾਂ ਵਿੱਚ ਬੁਖਾਰ 101°F ਤੋਂ ਵੱਧ ਰਹੇ ਤਾਂ ਤੁਰੰਤ ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ।',
        'ਖੰਘ ਦੀ ਦਵਾਈ ਪੀਣ ਤੋਂ ਬਾਅਦ ਗੱਡੀ ਨਾ ਚਲਾਓ।',
      ],
      followUp: '5 ਦਿਨਾਂ ਬਾਅਦ ਜੇਕਰ ਆਰਾਮ ਨਾ ਮਿਲੇ ਤਾਂ ਦੁਬਾਰਾ ਚੈੱਕ ਕਰਵਾਓ।',
    };
  }

  if (lang === 'mwr') {
    return {
      doctor: 'डाक्टर आर. के. सिंघल (एमबीबीएस, एमडी)',
      date: today,
      patientName: 'मरीज',
      summary: 'आ पर्ची ताव (बुखार), बदन दरद अर सूखी खांसी मेटण वास्ते है।',
      meds: [
        {
          name: 'Tab. Paracetamol 650mg',
          purpose: 'ताव, बदन दरद अर माथा दरद मेटण वास्ते',
          dose: '1 गोली (650mg)',
          times: ['morning', 'night'],
          meal: 'जीमण पाछे (रोटी खाकर)',
          days: 5,
          side_effects: 'हल्को पसीनो आ सके है',
          avoid_food: 'घणो ठंडो पाणी अर शराब नी पीवणी',
          avoid_drugs: 'दूजी पेरासिटामोल वाली दवाई साथे नी लेवणी',
        },
        {
          name: 'Syp. Cough Relief 10ml',
          purpose: 'खांसी अर गले री खराश मेटण वास्ते',
          dose: '2 चमची (10ml)',
          times: ['morning', 'afternoon', 'night'],
          meal: 'जीमण पाछे',
          days: 5,
          side_effects: 'हल्की नींद या सुस्ती आ सके है',
          avoid_food: 'खटाई अर बासी खाणो नी खावणो',
          avoid_drugs: 'नींद री गोलियां साथे नी लेवणी',
        },
        {
          name: 'Cap. Pantoprazole 40mg',
          purpose: 'पेट में गैस अर छाती री जलन रोकण वास्ते',
          dose: '1 कैप्सूल (40mg)',
          times: ['morning'],
          meal: 'सवेरे भूखे पेट',
          days: 5,
          side_effects: 'कोई खास नी',
          avoid_food: 'घणो तेल-मसालो अर तली चीजें नी खावणी',
          avoid_drugs: 'दूजी दवाई रे तुरंत पाछे नी लेवणो',
        },
      ],
      warnings: [
        'अगर 3 दिन में ताव नी उतरे तो तुरत डाक्टर साब ने दिखावजो।',
        'खांसी री दवाई पीवण पाछे गाड़ी या भारी मशीन नी चलावणी।',
      ],
      followUp: '5 दिन में आराम नी मिले तो पाछो डाक्टर ने दिखावो सा।',
    };
  }

  // Default Hindi
  return {
    doctor: 'डॉ. आर. के. सिंघल (एमबीबीएस, एमडी)',
    date: today,
    patientName: 'मरीज',
    summary: 'यह पर्ची सामान्य मौसमी बुखार, बदन दर्द और सूखी खांसी के उपचार के लिए है।',
    meds: [
      {
        name: 'Tab. Paracetamol 650mg',
        purpose: 'बुखार, बदन दर्द और सिरदर्द कम करने के लिए',
        dose: '1 गोली (650mg)',
        times: ['morning', 'night'],
        meal: 'खाने के बाद',
        days: 5,
        side_effects: 'हल्का पसीना आना',
        avoid_food: 'शराब और अत्यधिक ठंडे पेय से बचें',
        avoid_drugs: 'अन्य पेरासिटामोल युक्त दवाइयों के साथ न लें',
      },
      {
        name: 'Syp. Cough Relief 10ml',
        purpose: 'सूखी खांसी और गले की खराश शांत करने के लिए',
        dose: '2 चम्मच (10ml)',
        times: ['morning', 'afternoon', 'night'],
        meal: 'खाने के बाद',
        days: 5,
        side_effects: 'हल्की सुस्ती या नींद आ सकती है',
        avoid_food: 'खट्टी चीजें और ठंडी छाछ न लें',
        avoid_drugs: 'नींद की गोलियों के साथ न लें',
      },
      {
        name: 'Cap. Pantoprazole 40mg',
        purpose: 'पेट में गैस और एसिडिटी से बचाव के लिए',
        dose: '1 कैप्सूल (40mg)',
        times: ['morning'],
        meal: 'सुबह खाली पेट',
        days: 5,
        side_effects: 'सामान्य रूप से कोई नहीं',
        avoid_food: 'अधिक तला-भुना और मसालेदार खाना न खाएं',
        avoid_drugs: 'एंटीबायोटिक के तुरंत बाद न लें',
      },
    ],
    warnings: [
      'यदि 3 दिन में बुखार 101°F से अधिक रहे तो तुरंत डॉक्टर से संपर्क करें।',
      'खांसी की दवाई पीने के बाद गाड़ी या भारी मशीनरी न चलाएं।',
    ],
    followUp: '5 दिन बाद यदि आराम न मिले तो पुनः जांच करवाएं।',
  };
}

// 1. Scan Prescription Endpoint
app.post('/api/scan-prescription', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', lang = 'hi' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    const languageInstruction = LANGUAGE_PROMPT_MAP[lang] || LANGUAGE_PROMPT_MAP.hi;

    const activeAi = getAIClient();

    if (!activeAi) {
      return res.status(200).json({
        success: false,
        error:
          lang === 'en'
            ? 'Gemini API key is not configured. Please add GEMINI_API_KEY in your Vercel Project Settings -> Environment Variables.'
            : 'Gemini API Key कॉन्फ़िगर नहीं है। कृपया Vercel Environment Variables में GEMINI_API_KEY जोड़ें।',
      });
    }

    // Auto-detect MIME type from data URL if present
    let detectedMimeType = mimeType || 'image/jpeg';
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
    if (mimeMatch) {
      detectedMimeType = mimeMatch[1];
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');

    const promptText = `You are an expert clinical pharmacist and AI medical prescription reader.
Your task is to transcribe and analyze the EXACT prescription image provided.

CRITICAL INSTRUCTIONS FOR GENUINE SCANNING:
1. Extract ONLY the real medicines and drugs actually visible, written, or printed on this specific prescription image.
2. DO NOT hallucinate, guess, or substitute generic or default medications. If the prescription says Augmentin 625, write Augmentin 625. If it says Telma 40, write Telma 40. If it has 1 medicine, extract 1 medicine. If it has 3, extract 3.
3. Transcribe only medicine names, strengths, doses, and schedules that are legible. If handwriting is uncertain, mark it unclear instead of guessing.
4. If this image is completely blank, not a medical document, or completely illegible, return {"error": "unreadable", "meds": []}.

LANGUAGE MANDATE (CRITICAL):
The user has chosen: ${languageInstruction}.
All explanations, purposes, dosages, meal instructions, side effects, warnings, and follow-up MUST be written strictly in ${languageInstruction}.
The medicine name and strength (e.g., "Tab. Telma 40mg", "Syp. Azithral 200mg") should be in standard Latin script for accurate pharmacy identification.
Do not infer diagnosis, dose timing, duration, side effects, or food instructions. Use an empty times array and days: 0 when the prescription does not clearly state them.

Return STRICTLY a JSON object matching this schema (NO markdown, NO extra text):
{
  "doctor": "Doctor name or clinic name if visible in ${languageInstruction}",
  "date": "Prescription date (YYYY-MM-DD or as written)",
  "patientName": "Patient name if visible",
  "summary": "1-2 sentences summarizing diagnosis/treatment completely in ${languageInstruction}",
  "meds": [
    {
      "name": "Exact medicine name and strength from this prescription",
      "purpose": "Purpose/indication strictly in ${languageInstruction}",
      "dose": "Dosage strictly in ${languageInstruction}",
      "times": [],
      "meal": "Meal instructions (e.g. खाने के बाद / खाने से पहले) strictly in ${languageInstruction}",
      "days": 0,
      "side_effects": "Known mild side effects strictly in ${languageInstruction}",
      "avoid_food": "Dietary cautions strictly in ${languageInstruction}",
      "avoid_drugs": "Contraindicated medicines strictly in ${languageInstruction}"
    }
  ],
  "warnings": ["Safety alerts strictly in ${languageInstruction}"],
  "followUp": "Doctor follow-up schedule strictly in ${languageInstruction}"
}`;

    // Fast, lightweight models first for serverless environments (Vercel/Netlify)
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

    let lastError: any = null;
    let rawText = '';

    for (const modelName of candidateModels) {
      try {
        console.log(`[Prescription OCR] Attempting model ${modelName}...`);
        const scanPromise = activeAi.models.generateContent({
          model: modelName,
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

        // Leave enough time for handwriting recognition while staying within the function limit.
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout with model ${modelName}`)), 22000)
        );

        const response: any = await Promise.race([scanPromise, timeoutPromise]);
        if (response && response.text) {
          rawText = response.text;
          console.log(`[Prescription OCR] Model ${modelName} succeeded!`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Prescription OCR] Model ${modelName} failed (${err.message?.slice(0, 100)}), trying next candidate...`);
      }
    }

    if (!rawText) {
      console.error('[Prescription OCR] All vision models failed or timed out:', lastError);
      return res.status(200).json({
        success: false,
        error:
          lang === 'en'
            ? 'Prescription could not be clearly scanned due to temporary AI network traffic or image clarity. Please upload a clear, well-lit photo and try again.'
            : 'पर्ची को स्कैन करने में समस्या आई। कृपया पर्ची की सीधी व साफ फोटो अपलोड करें और पुनः प्रयास करें।',
      });
    }

    // Clean JSON from output
    let cleanJson = rawText.trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    try {
      const parsedData = JSON.parse(cleanJson);
      const validTimes = ['morning', 'afternoon', 'evening', 'night'];
      const medicines = Array.isArray(parsedData.meds)
        ? parsedData.meds
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

      if (parsedData.error === 'unreadable' || medicines.length === 0) {
        return res.json({
          success: false,
          error:
            lang === 'en'
              ? 'No medicines could be clearly recognized in this image. Please ensure the prescription text is legible and well-lit.'
              : 'इस फोटो में दवाइयों के नाम स्पष्ट नहीं दिख रहे हैं। कृपया पर्ची की साफ और स्पष्ट फोटो अपलोड करें।',
        });
      }
      parsedData.meds = medicines;
      parsedData.warnings = Array.isArray(parsedData.warnings)
        ? parsedData.warnings.filter((warning: unknown): warning is string => typeof warning === 'string')
        : [];
      parsedData.doctor = typeof parsedData.doctor === 'string' ? parsedData.doctor : '';
      parsedData.date = typeof parsedData.date === 'string' ? parsedData.date : '';
      parsedData.patientName = typeof parsedData.patientName === 'string' ? parsedData.patientName : '';
      parsedData.summary = typeof parsedData.summary === 'string' ? parsedData.summary : '';
      parsedData.followUp = typeof parsedData.followUp === 'string' ? parsedData.followUp : '';
      return res.json({ success: true, data: parsedData, isRealScan: true });
    } catch (parseErr) {
      console.error('[Prescription OCR] JSON parse error:', parseErr, cleanJson);
      return res.status(200).json({
        success: false,
        error:
          lang === 'en'
            ? 'Could not parse medical details from prescription. Please try a clearer photo.'
            : 'पर्ची से दवाइयों का विवरण नहीं निकाला जा सका। कृपया अधिक स्पष्ट फोटो का उपयोग करें।',
      });
    }
  } catch (error: any) {
    console.error('Error in /api/scan-prescription:', error);
    return res.status(500).json({
      success: false,
      error: 'सर्वर में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    });
  }
});

// Domain-knowledge medical responder for basic patient questions (backup & instant answer generator)
function getMedicalAnswerByTopic(message: string, lang: string): string | null {
  const q = message.toLowerCase();

  // 1. Headache / सिरदर्द
  if (q.includes('sir dard') || q.includes('sir me dard') || q.includes('सिर दर्द') || q.includes('माथा') || q.includes('headache') || q.includes('head ache')) {
    if (lang === 'en') {
      return `For headache: 1. Drink 1-2 glasses of water immediately as dehydration is the most common trigger. 2. Rest in a quiet, dark room away from mobile screens. 3. If the pain is severe, you may take 1 tablet of Paracetamol 650mg after food. 4. Caution: If the headache is sudden, severe, accompanied by vomiting or stiff neck, visit an emergency clinic immediately.`;
    }
    if (lang === 'mwr') {
      return `माथा दरद (सिरदर्द) वास्ते: 1. तुरत 1-2 गिलास सादो पाणी पियो, घणी बार पाणी री कमी सूं माथो दरद करे है। 2. मोबाइल स्क्रीन बंद कर’र शांत कमरे में आराम करो। 3. दरद घणो होवे तो रोटी खावण पाछे पैरासिटामोल 650mg री एक गोली ले सको सा। 4. ध्यान राखजो: अगर माथा में चक्कर आवे या उबकाई आवे तो तुरत डाक्टर ने दिखावजो सा।`;
    }
    if (lang === 'gu') {
      return `માથાના દુખાવા માટે: ૧. તરત જ ૧-૨ ગ્લાસ પાણી પીવો, પાણીની કમીથી વારંવાર માથું દુખે છે. ૨. ફોન કે ટીવી બંધ કરી શાંત ઓરડામાં આરામ કરો. ૩. દુખાવો વધુ હોય તો જમ્યા પછી પેરાસિટામોલ 650mg ની એક ગોળી લઈ શકો છો. ૪. ચેતવણી: જો ઉલટી કે ચક્કર આવે તો તાત્કાલિક ડૉક્ટરનો સંપર્ક કરો.`;
    }
    if (lang === 'ta') {
      return `தலைவலிக்கு: 1. உடனடியாக 1-2 டம்ளர் தண்ணீர் குடியுங்கள். 2. மொபைல் திரையை அணைத்துவிட்டு அமைதியான அறையில் ஓய்வெடுக்கவும். 3. வலி அதிகமாக இருந்தால் உணவுக்குப் பின் பாராசிட்டமால் 650mg ஒரு மாத்திரை உட்கொள்ளலாம். 4. எச்சரிக்கை: வாந்தி அல்லது கடுமையான மயக்கம் இருந்தால் உடனே மருத்துவரை அணுகவும்.`;
    }
    if (lang === 'pa') {
      return `ਸਿਰਦਰਦ ਲਈ: 1. ਤੁਰੰਤ 1-2 ਗਿਲਾਸ ਪਾਣੀ ਪੀਓ। 2. ਮੋਬਾਈਲ ਜਾਂ ਸਕ੍ਰੀਨ ਬੰਦ ਕਰਕੇ ਸ਼ਾਂਤ ਕਮਰੇ ਵਿੱਚ ਆਰਾਮ ਕਰੋ। 3. ਜੇਕਰ ਦਰਦ ਜ਼ਿਆਦਾ ਹੈ ਤਾਂ ਰੋਟੀ ਖਾਣ ਤੋਂ ਬਾਅਦ ਪੈਰਾਸੀਟਾਮੋਲ 650mg ਦੀ ਇੱਕ ਗੋਲੀ ਲੈ ਸਕਦੇ ਹੋ। 4. ਜੇਕਰ ਉਲਟੀ ਜਾਂ ਚੱਕਰ ਆਉਣ ਤਾਂ ਤੁਰੰਤ ਡਾਕਟਰ ਨੂੰ ਦਿਖਾਓ।`;
    }
    return `सिरदर्द के लिए: 1. तुरंत 1-2 गिलास गुनगुना या सादा पानी पिएं, अक्सर डिहाइड्रेशन से सिरदर्द होता है। 2. मोबाइल या टीवी स्क्रीन बंद करके शांत और ठंडे कमरे में आराम करें। 3. ज्यादा दर्द होने पर खाने के बाद Paracetamol 650mg की 1 गोली ले सकते हैं। 4. चेतावनी: यदि सिरदर्द के साथ उल्टी, चक्कर या गर्दन में अकड़न हो तो तुरंत डॉक्टर से जांच करवाएं।`;
  }

  // 2. Fever / बुखार / ताव
  if (q.includes('bukhar') || q.includes('fever') || q.includes('बुखार') || q.includes('ताव') || q.includes('temperature') || q.includes('ताप')) {
    if (lang === 'en') {
      return `For fever: 1. Rest adequately and drink plenty of fluids like warm water, coconut water, or thin soup. 2. For temperature above 99.5°F, take Paracetamol 650mg after food (keep minimum 6-hour interval between doses). 3. If fever is very high, apply normal water wet cloth strips on forehead. 4. Red Flag: If fever exceeds 102°F or persists for more than 3 days, get a blood test done and consult your doctor.`;
    }
    if (lang === 'mwr') {
      return `ताव (बुखार) वास्ते: 1. पूरा आराम करो अर खूब पाणी, दाल रो पाणी या ओआरएस पियो। 2. ताव 99°F सूं ज्यादा होवे तो जीमण पाछे पैरासिटामोल 650mg री एक गोली लेवो (कम से कम 6 घंटा रो अंतर राखो)। 3. माथे पर सादे पाणी री पट्टी राखो। 4. अगर 3 दिन में ताव नी उतरे तो डाक्टर साब ने दिखावजो सा।`;
    }
    if (lang === 'gu') {
      return `તાવ માટે: ૧. સંપૂર્ણ આરામ કરો અને પૂરતું પાણી, ઓઆરએસ અથવા નાળિયેર પાણી પીવો. ૨. તાવ વધુ હોય તો જમ્યા પછી પેરાસિટામોલ 650mg ગોળી લઈ શકો છો (૬ કલાકનો તફાવત રાખો). ૩. માથા પર સામાન્ય પાણીના પોતા મૂકો. ૪. ૩ દિવસથી વધુ તાવ રહે તો ડૉક્ટર પાસે લોહીની તપાસ કરાવો.`;
    }
    if (lang === 'ta') {
      return `காய்ச்சலுக்கு: 1. போதுமான ஓய்வு எடுத்து அதிக திரவ உணவுகளை உட்கொள்ளவும். 2. காய்ச்சல் அதிகமாக இருந்தால் உணவுக்குப் பின் பாராசிட்டமால் 650mg எடுத்துக்கொள்ளலாம் (6 மணி நேர இடைவெளி தேவை). 3. நெற்றியில் சாதாரண நீர் ஒத்தடம் கொடுக்கவும். 4. 3 நாட்களுக்கு மேல் காய்ச்சல் நீடித்தால் உடனே மருத்துவரை அணுகவும்.`;
    }
    if (lang === 'pa') {
      return `ਬੁਖਾਰ ਲਈ: 1. ਪੂਰਾ ਆਰਾਮ ਕਰੋ ਅਤੇ ਪਾਣੀ ਜਾਂ ਤਰਲ ਪਦਾਰਥ ਜ਼ਿਆਦਾ ਪੀਓ। 2. ਬੁਖਾਰ ਹੋਣ ਤੇ ਰੋਟੀ ਖਾਣ ਤੋਂ ਬਾਅਦ ਪੈਰਾਸੀਟਾਮੋਲ 650mg ਲਓ (6 ਘੰਟੇ ਦਾ ਫ਼ਰਕ ਰੱਖੋ)। 3. ਮੱਥੇ ਤੇ ਗਿੱਲੀਆਂ ਪੱਟੀਆਂ ਰੱਖੋ। 4. ਜੇਕਰ ਬੁਖਾਰ 3 ਦਿਨਾਂ ਤੋਂ ਨਾ ਉਤਰੇ ਤਾਂ ਤੁਰੰਤ ਡਾਕਟਰ ਨੂੰ ਦਿਖਾਓ।`;
    }
    return `बुखार के लिए: 1. पूरा आराम करें और पर्याप्त मात्रा में गुनगुना पानी, ओआरएस या नारियल पानी पिएं। 2. बुखार 99.5°F से अधिक होने पर खाने के बाद Paracetamol 650mg ले सकते हैं (दो खुराकों के बीच कम से कम 6 घंटे का अंतर रखें)। 3. माथे पर सामान्य पानी की पट्टियां रखें। 4. यदि बुखार 3 दिन से अधिक रहे या 102°F पार करे तो तुरंत डॉक्टर से जांच करवाएं।`;
  }

  // 3. Acidity / Gas / पेट में जलन / एसिडिटी
  if (q.includes('gas') || q.includes('acidity') || q.includes('गैस') || q.includes('एसिडिटी') || q.includes('jalan') || q.includes('pet me dard') || q.includes('पेट')) {
    if (lang === 'en') {
      return `For stomach gas and acidity: 1. Take a proton-pump inhibitor like Pantoprazole 40mg or Omeprazole 20mg in the morning on an empty stomach with plain water. 2. Drink half a glass of cold milk or coconut water for instant soothing. 3. Avoid spicy, deep-fried food, tea, and coffee. 4. Do not lie down immediately after having meals; take a gentle 15-minute walk.`;
    }
    if (lang === 'mwr') {
      return `पेट में गैस अर एसिडिटी वास्ते: 1. सवेरे भूखे पेट Pantoprazole 40mg री एक कैप्सूल सादे पाणी सूं लेवो। 2. ठंडो दूध या सौंफ रो पाणी पीवण सूं पेट में ठंडक मिलेला। 3. घणो तेल-मसालो, चाय अर खटाई बिल्कुल नी खावणी। 4. जीमते ही सीधा सूवणो नी चाहिजे, थोड़ो घूमो।`;
    }
    if (lang === 'gu') {
      return `પેટમાં ગેસ અને એસિડિટી માટે: ૧. સવારે ભૂખ્યા પેટે Pantoprazole 40mg કેપ્સ્યુલ સાદા પાણી સાથે લો. ૨. અડધો ગ્લાસ ઠંડુ દૂધ કે વરિયાળીનું પાણી પીવાથી રાહત થશે. ૩. તળેલો, તીખો ખોરાક અને વધુ ચા ટાળો. ૪. જમ્યા પછી તરત સુઈ ન જવું.`;
    }
    if (lang === 'ta') {
      return `அசிடிட்டி மற்றும் வாயுத்தொல்லைக்கு: 1. காலையில் வெறும் வயிற்றில் Pantoprazole 40mg மாத்திரை எடுக்கவும். 2. குளிர்ந்த பால் அல்லது இளநீர் குடித்தால் உடனடி நிவாரணம் கிடைக்கும். 3. காரமான, எண்ணெயில் பொரித்த உணவுகள் மற்றும் காபியை தவிர்க்கவும். 4. சாப்பிட்ட உடனே படுக்க வேண்டாம்.`;
    }
    if (lang === 'pa') {
      return `ਗੈਸ ਅਤੇ ਤੇਜ਼ਾਬ ਲਈ: 1. ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ Pantoprazole 40mg ਕੈਪਸੂਲ ਪਾਣੀ ਨਾਲ ਲਓ। 2. ਠੰਢਾ ਦੁੱਧ ਜਾਂ ਸੌਂਫ ਦਾ ਪਾਣੀ ਪੀਓ। 3. ਤਲੀਆਂ-ਭੁੰਨੀਆਂ ਚੀਜ਼ਾਂ ਅਤੇ ਚਾਹ ਘੱਟ ਕਰੋ। 4. ਖਾਣਾ ਖਾਣ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ ਨਾ ਲੇਟੋ।`;
    }
    return `पेट में गैस और एसिडिटी के लिए: 1. सुबह खाली पेट Pantoprazole 40mg या Omeprazole सादे पानी के साथ लें। 2. आधा गिलास ठंडा दूध या सौंफ का पानी पीने से तुरंत राहत मिलती है। 3. तली-भुनी चीजें, मिर्च-मसाले, और खाली पेट चाय-कॉफ़ी से बचें। 4. खाना खाने के तुरंत बाद न लेटें, 10-15 मिनट टहलें।`;
  }

  // 4. Cough & Cold / खांसी जुकाम
  if (q.includes('khasi') || q.includes('cough') || q.includes('jukam') || q.includes('cold') || q.includes('खांसी') || q.includes('जुकाम') || q.includes('गले')) {
    if (lang === 'en') {
      return `For cough and cold: 1. Do warm salt water gargles 2-3 times a day to relieve throat congestion. 2. Take steam inhalation with plain warm water. 3. Drink warm water with honey and ginger juice. 4. Avoid ice creams, chilled beverages, and dairy. 5. If dry cough disturbs sleep, take 10ml cough syrup after dinner.`;
    }
    if (lang === 'mwr') {
      return `खांसी अर जुकाम वास्ते: 1. निवाया (गुनगुना) पाणी में लूण (नमक) घाल’र गरारे करो। 2. गरम पाणी री भाप (स्टीम) लेवो। 3. अदरख रो रस अर मध (शहद) लेवण सूं खांसी में घणो आराम मिले। 4. फ्रिज री ठंडी चीजें, छाछ अर आइसक्रीम नी खावणी सा।`;
    }
    if (lang === 'gu') {
      return `ઉધરસ અને શરદી માટે: ૧. નવશેકા ગરમ પાણીમાં મીઠું નાખી કોગળા કરો. ૨. ગરમ પાણીની વરાળ (સ્ટીમ) લો. ૩. આદુનો રસ અને મધ ચાટવાથી ઉધરસમાં ઘણી રાહત થશે. ૪. ફ્રિજની ઠંડી વસ્તુઓ અને આઈસ્ક્રીમ ટાળો.`;
    }
    if (lang === 'ta') {
      return `இருமல் மற்றும் சளிக்கு: 1. வெதுவெதுப்பான உப்பு நீரில் வாய் கொப்பளிக்கவும். 2. ஆவி பிடிக்கவும் (Steam). 3. இஞ்சி சாறுடன் தேன் கலந்து குடிக்கவும். 4. குளிர்ந்த உணவுகளை முற்றிலும் தவிர்க்கவும்.`;
    }
    if (lang === 'pa') {
      return `ਖੰਘ ਅਤੇ ਜ਼ੁਕਾਮ ਲਈ: 1. ਗਰਮ ਪਾਣੀ ਵਿੱਚ ਲੂਣ ਪਾ ਕੇ ਗਰਾਰੇ ਕਰੋ। 2. ਭਾਫ਼ (ਸਟੀਮ) ਲਓ। 3. ਅਦਰਕ ਦਾ ਰਸ ਅਤੇ ਸ਼ਹਿਦ ਲਓ। 4. ਫਰਿੱਜ ਦੀਆਂ ਠੰਢੀਆਂ ਚੀਜ਼ਾਂ ਤੋਂ ਪਰਹੇਜ਼ ਕਰੋ।`;
    }
    return `खांसी और जुकाम के लिए: 1. दिन में 2-3 बार गुनगुने पानी में नमक डालकर गरारे करें। 2. सादे पानी की भाप (स्टीम) लें। 3. अदरक के रस में थोड़ा शहद मिलाकर लेने से गले को तुरंत आराम मिलता है। 4. ठंडे पेय, आइसक्रीम और तली-भुनी चीजों से परहेज करें।`;
  }

  // 5. Missed Dose / दवा भूल गए
  if (q.includes('bhul') || q.includes('miss') || q.includes('भूल') || q.includes('छूट गई') || q.includes('dawai nahi li')) {
    if (lang === 'en') {
      return `If you missed a medicine dose: 1. Take it as soon as you remember. 2. However, if it is already near the time for your next scheduled dose, skip the missed dose and resume your regular schedule. 3. STRICT RULE: NEVER take a double dose to make up for a missed tablet.`;
    }
    if (lang === 'mwr') {
      return `अगर दवाई लेवणी भूल गया हो: 1. जद याद आवे जद ही ले लेवो। 2. पण अगर अगली खुराक रो टेम पास आ ग्यो है, तो छूटी हुई दवाई छोड़ देवो अर नेम मुजब अगली खुराक लेवो। 3. कदे भी एक साथ दो गोली नी लेवणी सा।`;
    }
    if (lang === 'gu') {
      return `જો દવાનો ડોઝ ભૂલી ગયા હો: ૧. યાદ આવે કે તરત જ દવા લઈ લો. ૨. પરંતુ જો આગલા ડોઝનો સમય નજીક હોય તો ચૂકી ગયેલો ડોઝ છોડી દો. ૩. ક્યારેય એકસાથે બે ગોળી ન લેવી.`;
    }
    if (lang === 'ta') {
      return `மருந்து எடுக்க மறந்துவிட்டால்: 1. நினைவுக்கு வந்தவுடன் எடுத்துக்கொள்ளவும். 2. அடுத்த வேளை மருந்துக்கு நேரம் நெருங்கிவிட்டால் விடுபட்டதை விட்டுவிடுங்கள். 3. ஒருபோதும் ஒரே நேரத்தில் இரண்டு மாத்திரைகளை உட்கொள்ளாதீர்கள்.`;
    }
    if (lang === 'pa') {
      return `ਜੇਕਰ ਦਵਾਈ ਭੁੱਲ ਗਏ ਹੋ: 1. ਯਾਦ ਆਉਣ ਤੇ ਤੁਰੰਤ ਲਓ। 2. ਜੇਕਰ ਅਗਲੀ ਖੁਰਾਕ ਦਾ ਸਮਾਂ ਨੇੜੇ ਹੈ ਤਾਂ ਛੁੱਟੀ ਹੋਈ ਖੁਰਾਕ ਛੱਡ ਦਿਓ। 3. ਕਦੇ ਵੀ ਇਕੱਠੀਆਂ ਦੋ ਗੋਲੀਆਂ ਨਾ ਲਓ।`;
    }
    return `अगर दवा लेना भूल गए हों: 1. जैसे ही याद आए, तुरंत ले लें। 2. लेकिन यदि अगली खुराक का समय नजदीक आ गया हो, तो छूटी हुई खुराक छोड़ दें और सामान्य समय पर ही अगली दवा लें। 3. नियम: कभी भी छूटी हुई खुराक की भरपाई के लिए एक साथ दो गोलियां न लें।`;
  }

  // 6. Blood Pressure / बीपी
  if (q.includes('bp') || q.includes('blood pressure') || q.includes('रक्तचाप') || q.includes('हाई बीपी') || q.includes('लो बीपी')) {
    if (lang === 'en') {
      return `For Blood Pressure: 1. Normal BP target is around 120/80 mmHg. 2. If high BP: sit calmly, take deep breaths, reduce salt in meals, and never miss your prescribed morning BP medication (like Telmisartan or Amlodipine). 3. If low BP: drink lemon water with a pinch of salt or ORS, and lie down with legs elevated. 4. Red Flag: If BP exceeds 160/100 or causes blurred vision/chest pain, seek emergency care immediately.`;
    }
    if (lang === 'mwr') {
      return `बीपी (ब्लड प्रेशर) वास्ते: 1. साधारण बीपी 120/80 मानीजे है। 2. बीपी बढ़ जावे तो लूण (नमक) कम खावो, उतावल मत करो अर डाक्टर साब री लिखी रोज री दवाई नेम सूं लेवो। 3. बीपी घट जावे तो निंबू-पाणी में थोड़ो लूण घाल’र पियो। 4. छाती में दरद या घणी घबराहट होवे तो तुरत अस्पताले जावजो।`;
    }
    if (lang === 'gu') {
      return `બ્લડ પ્રેશર (BP) માટે: ૧. સામાન્ય બીપી ૧૨૦/૮૦ ગણાય છે. ૨. હાઈ બીપીમાં મીઠું ઓછું ખાવ અને ડૉક્ટરે આપેલી ગોળી દરરોજ સવારે નિયમિત લો. ૩. લો બીપીમાં લીંબુ-મીઠાનું પાણી અથવા ઓઆરએસ પીવો. ૪. છાતીમાં દુખાવો કે અતિશય ગભરામણ થાય તો તરત જ ડૉક્ટર પાસે જાઓ.`;
    }
    if (lang === 'ta') {
      return `இரத்த அழுத்தத்திற்கு (BP): 1. இயல்பான அளவு 120/80 mmHg. 2. உயர் அழுத்தம் இருந்தால் உணவில் உப்பை குறைத்து மருத்துவர் பரிந்துரைத்த மாத்திரையை தினமும் எடுக்கவும். 3. குறைந்த அழுத்தம் இருந்தால் எலுமிச்சை உப்பு நீர் குடிக்கவும். 4. நெஞ்சு வலி அல்லது மயக்கம் இருந்தால் உடனே மருத்துவமனை செல்லவும்.`;
    }
    if (lang === 'pa') {
      return `ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ (BP) ਲਈ: 1. ਆਮ ਬੀਪੀ 120/80 ਹੁੰਦਾ ਹੈ। 2. ਹਾਈ ਬੀਪੀ ਹੋਵੇ ਤਾਂ ਲੂਣ ਘੱਟ ਕਰੋ ਅਤੇ ਰੋਜ਼ਾਨਾ ਦਵਾਈ ਸਮੇਂ ਸਿਰ ਲਓ। 3. ਲੋ ਬੀਪੀ ਹੋਵੇ ਤਾਂ ਨਿੰਬੂ-ਪਾਣੀ ਵਿੱਚ ਚੁਟਕੀ ਲੂਣ ਪਾ ਕੇ ਪੀਓ। 4. ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਹੋਵੇ ਤਾਂ ਤੁਰੰਤ ਹਸਪਤਾਲ ਜਾਓ।`;
    }
    return `ब्लड प्रेशर (BP) के लिए: 1. सामान्य बीपी 120/80 mmHg माना जाता है। 2. हाई बीपी में भोजन में नमक कम करें, तनाव से बचें और डॉक्टर की लिखी नियमित सुबह की बीपी दवा कभी न छोड़ें। 3. लो बीपी होने पर नींबू-पानी में चुटकी भर नमक डालकर पिएं और पैरों को थोड़ा ऊपर उठाकर लेटें। 4. छाती में भारीपन, सांस फूलने या तेज सिरदर्द पर तुरंत डॉक्टर से संपर्क करें।`;
  }

  // 7. Diabetes / Blood Sugar / शुगर
  if (q.includes('sugar') || q.includes('diabetes') || q.includes('शुगर') || q.includes('डायबिटीज') || q.includes('मधुमेह')) {
    if (lang === 'en') {
      return `For Diabetes / Blood Sugar: 1. Normal fasting sugar should be below 100 mg/dL, and post-meal below 140 mg/dL. 2. Take your diabetes medication (like Metformin) strictly with meals as advised. 3. Avoid sweets, sugary tea, and refined flour (maida); eat whole grains and green vegetables. 4. Caution: If sugar drops below 70 mg/dL and you feel shaking/sweating (hypoglycemia), immediately consume 3 teaspoons of sugar or fruit juice.`;
    }
    if (lang === 'mwr') {
      return `शुगर (डायबिटीज) वास्ते: 1. भूखे पेट शुगर 100 सूं कम अर जीमण पाछे 140 सूं कम रहणी चाहिजे। 2. मीठो, गुड़, खांड अर मैदे री चीजें बिल्कुल मत खावो। 3. रोज 30 मिनट घूमो अर डाक्टर री दवाई टेम माथे लेवो। 4. अगर चक्कर आवे, पसीनो छूटे तो तुरत 2-3 चमची खांड या मीठो पाणी पीवो।`;
    }
    if (lang === 'gu') {
      return `ડાયાબિટીસ (શુગર) માટે: ૧. ભૂખ્યા પેટે શુગર ૧૦૦ થી ઓછી અને જમ્યા પછી ૧૪૦ થી ઓછી હોવી જોઈએ. ૨. ખાંડ, ગોળ અને તળેલી વસ્તુઓ ટાળો. ૩. રોજ ૩૦ મિનિટ ચાલો અને દવા સમયસર લો. ૪. જો ધ્રુજારી કે પરસેવો થાય (શુગર ઘટવી), તો તરત ૧ ચમચી ખાંડ ખાઈ લો.`;
    }
    if (lang === 'ta') {
      return `சர்க்கரை நோய்க்கு (Diabetes): 1. வெறும் வயிற்றில் 100-க்கு கீழும், சாப்பிட்ட பின் 140-க்கு கீழும் இருக்க வேண்டும். 2. இனிப்பு மற்றும் மைதா உணவுகளை தவிர்க்கவும். 3. தினமும் உடற்பயிற்சி செய்து மருந்துகளை வேளையோடு உட்கொள்ளவும். 4. நடுக்கம் அல்லது அதிக வியர்வை ஏற்பட்டால் உடனே சிறிதளவு சர்க்கரை அல்லது ஜூஸ் குடிக்கவும்.`;
    }
    if (lang === 'pa') {
      return `ਸ਼ੂਗਰ (ਡਾਇਬਟੀਜ਼) ਲਈ: 1. ਖਾਲੀ ਪੇਟ ਸ਼ੂਗਰ 100 ਤੋਂ ਘੱਟ ਅਤੇ ਖਾਣ ਤੋਂ ਬਾਅਦ 140 ਤੋਂ ਘੱਟ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ। 2. ਮਿੱਠਾ, ਗੁੜ ਅਤੇ ਮੈਦਾ ਬਿਲਕੁਲ ਬੰਦ ਕਰੋ। 3. ਰੋਜ਼ਾਨਾ ਸੈਰ ਕਰੋ ਅਤੇ ਦਵਾਈ ਨਿਯਮਿਤ ਲਓ। 4. ਕੰਬਣੀ ਜਾਂ ਪਸੀਨਾ ਆਵੇ ਤਾਂ ਤੁਰੰਤ ਥੋੜ੍ਹੀ ਖੰਡ ਖਾਓ।`;
    }
    return `डायबिटीज (शुगर) के लिए: 1. सामान्य खाली पेट शुगर 100 mg/dL से कम और खाने के 2 घंटे बाद 140 mg/dL से कम होनी चाहिए। 2. मिठाई, चीनी, सफेद चावल और मैदे से परहेज करें; फाइबर युक्त हरी सब्जियां और चना/जौ खाएं। 3. नियमित 30 मिनट टहलें और डॉक्टर की शुगर की दवा हमेशा भोजन के साथ लें। 4. अचानक पसीना आने, घबराहट या हाथ कांपने (लो शुगर) पर तुरंत 1-2 चम्मच चीनी या मीठा शरबत लें।`;
  }

  // 8. Loose Motion / Diarrhea / Vomiting / दस्त / उल्टी
  if (q.includes('dast') || q.includes('diarrhea') || q.includes('loose motion') || q.includes('ulti') || q.includes('vomit') || q.includes('दस्त') || q.includes('उल्टी')) {
    if (lang === 'en') {
      return `For loose motions or vomiting: 1. Primary rule is preventing dehydration: drink 1 glass of ORS (Electral) solution after every loose motion. 2. Eat light foods like curd-rice, banana, boiled potato, and thin khichdi. 3. For vomiting, take Domperidone or Ondansetron tablet 30 minutes before food. 4. Warning: If blood appears in stool, or dehydration causes severe dizziness/sunken eyes, visit a hospital immediately.`;
    }
    if (lang === 'mwr') {
      return `दस्त अर उल्टी वास्ते: 1. शरीर में पाणी नी टूटे ईं वास्ते ओआरएस (ORS) रो घोल या छाछ-पाणी घणो पियो। 2. दही-चावल, केळा अर मूंग री पतली खिचड़ी खावो। 3. उल्टी होवे तो खाली पेट ओन्डेन्सेट्रान या डोमपेरिडोन री गोली ले सको। 4. कमजोरी घणी लागे तो तुरत डाक्टर ने दिखावजो।`;
    }
    if (lang === 'gu') {
      return `ઝાડા અને ઉલટી માટે: ૧. ડીહાઇડ્રેશનથી બચવા દર વખતે ઓઆરએસ (ORS) નું પાણી પીવો. ૨. દહીં-ભાત, કેળા અને મગની હળવી ખીચડી ખાવ. ૩. ઉલટી માટે Ondansetron ગોળી લઈ શકો છો. ૪. જો ખૂબ અશક્તિ લાગે તો તાત્કાલિક દવાખાને જાઓ.`;
    }
    if (lang === 'ta') {
      return `வயிற்றுப்போக்கு மற்றும் வாந்திக்கு: 1. நீர்ச்சத்து குறையாமல் இருக்க ORS கரைசலை அடிக்கடி குடிக்கவும். 2. தயிர் சாதம், வாழைப்பழம் மற்றும் எளிதில் செரிக்கும் உணவு உட்கொள்ளவும். 3. வாந்தி அதிகமாக இருந்தால் Ondansetron மாத்திரை எடுக்கலாம். 4. அதிக சோர்வு ஏற்பட்டால் உடனே மருத்துவரை அணுகவும்.`;
    }
    if (lang === 'pa') {
      return `ਦਸਤ ਅਤੇ ਉਲਟੀਆਂ ਲਈ: 1. ਪਾਣੀ ਦੀ ਘਾਟ ਨਾ ਹੋਣ ਦਿਓ, ORS ਦਾ ਘੋਲ ਵਾਰ-ਵਾਰ ਪੀਓ। 2. ਦਹੀਂ-ਚੌਲ, ਕੇਲੇ ਅਤੇ ਹਲਕੀ ਖਿਚੜੀ ਖਾਓ। 3. ਉਲਟੀ ਲਈ Ondansetron ਗੋਲੀ ਲੈ ਸਕਦੇ ਹੋ। 4. ਜ਼ਿਆਦਾ ਕਮਜ਼ੋਰੀ ਹੋਣ ਤੇ ਤੁਰੰਤ ਡਾਕਟਰ ਕੋਲ ਜਾਓ।`;
    }
    return `दस्त और उल्टी के लिए: 1. सबसे जरूरी है डिहाइड्रेशन रोकना: हर दस्त के बाद 1 गिलास ORS (इलेक्ट्राल) का घोल धीरे-धीरे पिएं। 2. भोजन में केवल दही-चावल, केला, और मूंग दाल की पतली खिचड़ी लें; दूध और चिकनाई से बचें। 3. उल्टी रोकने के लिए Ondansetron 4mg की 1 गोली ले सकते हैं। 4. यदि 24 घंटे में आराम न मिले या तेज कमजोरी लगे तो तुरंत अस्पताल जाएं।`;
  }

  // 9. Joint Pain / Body Pain / जोड़ों का दर्द / बदन दर्द
  if (q.includes('jodo') || q.includes('joint') || q.includes('badan dard') || q.includes('ghutno') || q.includes('pain') || q.includes('कमर दर्द') || q.includes('दर्द') || q.includes('जोड़ों')) {
    if (lang === 'en') {
      return `For body and joint pain: 1. Apply a warm compress or pain-relief ointment to the affected area. 2. Avoid prolonged sitting on the floor; do gentle stretching exercises. 3. If needed, take Paracetamol 650mg after food. 4. For chronic knee pain, maintain vitamin D and calcium levels, and consult an orthopedic doctor before taking strong painkiller combinations.`;
    }
    if (lang === 'mwr') {
      return `जोड़ों अर बदन दरद वास्ते: 1. तिल रे तेल या दरद री मलम सूं हल्की मालिश करो अर गरम सेक करो। 2. जमीन माथे उकडू बैठण सूं बचो। 3. दरद ज्यादा होवे तो जीमण पाछे पैरासिटामोल 650mg ले सको। 4. धूप में 15 मिनट बैठो ताकी विटामिन डी मिले।`;
    }
    if (lang === 'gu') {
      return `સાંધા અને શરીરના દુખાવા માટે: ૧. ગરમ પાણીનો શેક કરો અથવા દર્દ નિવારક મલમ લગાવો. ૨. સખત જમીન પર બેસવાનું ટાળો અને હળવી કસરત કરો. ૩. દુખાવો વધુ હોય તો જમ્યા પછી પેરાસિટામોલ લઈ શકો છો. ૪. વિટામિન ડી અને કેલ્શિયમની તપાસ કરાવો.`;
    }
    if (lang === 'ta') {
      return `மூட்டு மற்றும் உடல் வலிக்கு: 1. வெந்நீர் ஒத்தடம் கொடுக்கவும் அல்லது வலி நிவாரணி தைலம் தடவவும். 2. தரையில் அமர்வதை தவிர்த்து லேசான நடைப்பயிற்சி செய்யவும். 3. வலி அதிகமானால் உணவுக்குப் பின் பாராசிட்டமால் எடுக்கலாம். 4. தொடர்ந்து வலித்தால் எலும்பு மருத்துவரை அணுகவும்.`;
    }
    if (lang === 'pa') {
      return `ਜੋੜਾਂ ਅਤੇ ਸਰੀਰ ਦੇ ਦਰਦ ਲਈ: 1. ਗਰਮ ਸੇਕ ਕਰੋ ਅਤੇ ਦਰਦ ਵਾਲੀ ਮਲਮ ਲਗਾਓ। 2. ਜ਼ਮੀਨ ਤੇ ਜ਼ਿਆਦਾ ਦੇਰ ਬੈਠਣ ਤੋਂ ਬਚੋ। 3. ਜ਼ਿਆਦਾ ਦਰਦ ਹੋਣ ਤੇ ਰੋਟੀ ਖਾਣ ਤੋਂ ਬਾਅਦ ਪੈਰਾਸੀਟਾਮੋਲ ਲੈ ਸਕਦੇ ਹੋ। 4. ਧੁੱਪ ਵਿੱਚ ਬੈਠੋ ਤਾਂ ਜੋ ਵਿਟਾਮਿਨ ਡੀ ਮਿਲੇ।`;
    }
    return `जोड़ों और बदन दर्द के लिए: 1. प्रभावित हिस्से पर गर्म पानी की सिकाई करें या दर्द निवारक ऑइंटमेंट लगाएं। 2. जमीन पर पालथी मारकर बैठने से बचें और हल्की स्ट्रेचिंग करें। 3. जरूरत पड़ने पर भोजन के बाद Paracetamol 650mg ले सकते हैं (खाली पेट पेनकिलर न लें)। 4. लंबे समय से घुटनों के दर्द के लिए कैल्शियम व विटामिन D की जांच कराकर हड्डी रोग विशेषज्ञ से मिलें।`;
  }

  // 10. Greetings & Bot Intro / नमस्ते / hello / DawaiMitra kya hai
  if (q.includes('hello') || q.includes('hi') || q.includes('namaste') || q.includes('ram ram') || q.includes('नमस्ते') || q.includes('राम राम') || q.includes('kaun ho') || q.includes('kya kar sakte')) {
    if (lang === 'en') {
      return `Hello! I am DawaiMitra, your digital health companion. I can help you understand your doctor's prescriptions in 6 languages, explain when and how to take medicines, check food interactions, answer daily health questions, set custom dosage reminders, and book hospital appointments. How may I assist your family today?`;
    }
    if (lang === 'mwr') {
      return `राम राम सा! म्हें आपरो दवाईमित्र स्वास्थ्य साथी हूँ। म्हें आपरी डाक्टर री पर्ची वांच’र समझा सकूँ, दवाई कद अर कैयां लेवणी, कीं खाणो नी है, बीपी-शुगर री सलाह दे सकूँ अर अस्पताल में अपॉइंटमेंट बुक करा सकूँ सा। आज आपरी कांई सेवा करां?`;
    }
    if (lang === 'gu') {
      return `નમસ્તે! હું તમારો DawaiMitra સ્વાસ્થ્ય સાથી છું. હું પ્રિસ્ક્રિપ્શન સમજાવી શકું છું, દવાનો સમય, પરેજી અને બીમારીના સરળ ઉપાયો જણાવી શકું છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?`;
    }
    if (lang === 'ta') {
      return `வணக்கம்! நான் உங்கள் DawaiMitra நலத் தோழன். மருந்துச் சீட்டுகளை தமிழில் விளக்குதல், மருந்து நேரங்கள் மற்றும் எளிய மருத்துவ ஆலோசனைகளை வழங்குவேன். இன்று நான் உங்களுக்கு எவ்வாறு உதவட்டும்?`;
    }
    if (lang === 'pa') {
      return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ DawaiMitra ਸਿਹਤ ਸਾਥੀ ਹਾਂ। ਮੈਂ ਡਾਕਟਰ ਦੀ ਪਰਚੀ ਸਮਝਾ ਸਕਦਾ ਹਾਂ, ਦਵਾਈਆਂ ਦੇ ਸਮੇਂ ਅਤੇ ਸਿਹਤ ਸਬੰਧੀ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਸੇਵਾ ਕਰ ਸਕਦਾ ਹਾਂ ਜੀ?`;
    }
    return `नमस्ते! मैं आपका दवाईमित्र (DawaiMitra) AI स्वास्थ्य साथी हूँ। मैं आपकी डॉक्टर की पर्ची पढ़कर दवाइयों के सही समय और खुराक समझा सकता हूँ, परहेज बता सकता हूँ, दवा रिमाइंडर लगा सकता हूँ और बुखार, सिरदर्द, बीपी, शुगर जैसे सवालों के सटीक जवाब दे सकता हूँ। बताइए, आज आपकी सेहत के लिए मैं क्या मदद करूँ?`;
  }

  return null;
}

// 2. Multilingual AI Assistant Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, lang = 'hi', history = [], activeMedicines = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const languageInstruction = LANGUAGE_PROMPT_MAP[lang] || LANGUAGE_PROMPT_MAP.hi;

    const medContext = activeMedicines && activeMedicines.length
      ? `Patient is currently taking these medicines: ${activeMedicines.join(', ')}.`
      : 'No active medicines recorded.';

    const systemPrompt = `You are DawaiMitra (दवाई मित्र), an expert, kind, caring family medical assistant and clinical pharmacist for Indian patients.

ABSOLUTE REQUIREMENT:
You MUST respond 100% in ${languageInstruction}.
If English, use pure English without mixing Hindi.
If Gujarati, write in Gujarati script.
If Tamil, write in Tamil script.
If Punjabi, write in Gurmukhi script.
If Marwari, write in Marwari language (Devanagari script).
If Hindi, write in clear Hindi.

INSTRUCTIONS:
1. Provide a direct, helpful, and reassuring answer to the user's specific health/medicine question.
2. If asking about a symptom (headache, fever, stomach ache, gas, cough, body pain, BP, diabetes):
   - Explain common safe causes in simple words.
   - Give 2-3 practical, safe immediate home steps and remedies.
   - Mention standard safe over-the-counter medicine (e.g. Paracetamol 650mg for pain/fever, Pantoprazole 40mg for acidity) with instructions on taking after/before food.
   - Highlight warning signs when they must consult a doctor or call 108.
3. Keep the answer concise and spoken-friendly (4-5 complete sentences).
4. Patient context: ${medContext}`;

    // First try Gemini API with fast models and 9-second timeout
    const activeAi = getAIClient();

    if (activeAi) {
      const chatModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
      for (const modelName of chatModels) {
        try {
          const chatPromise = activeAi.models.generateContent({
            model: modelName,
            contents: `User Query: ${message}`,
            config: {
              systemInstruction: systemPrompt,
            },
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI request timeout')), 9000)
          );

          const response: any = await Promise.race([chatPromise, timeoutPromise]);
          const reply = response?.text?.trim();
          if (reply) {
            return res.json({ success: true, reply });
          }
        } catch (geminiErr) {
          console.warn(`Chat model ${modelName} error or timeout:`, geminiErr);
        }
      }
    }

    // If Gemini was slow, timed out, or unavailable, use intelligent medical knowledge base
    const topicAnswer = getMedicalAnswerByTopic(message, lang);
    if (topicAnswer) {
      return res.json({ success: true, reply: topicAnswer });
    }

    // Default empathetic localized fallback
    const genericReplies: Record<string, string> = {
      en: `Hello! I am your DawaiMitra Health Companion. For your health question: Please take all medicines as prescribed by your doctor. Stay well hydrated, eat light home-cooked meals, and get adequate rest. If symptoms persist or worsen, please consult your physician or call emergency 108.`,
      hi: `नमस्ते! मैं आपका DawaiMitra स्वास्थ्य साथी हूँ। आपकी सेहत के लिए: दवाइयों को हमेशा डॉक्टर के बताए अनुसार समय पर लें। पर्याप्त पानी पिएं, हल्का सुपाच्य भोजन लें और पूरा आराम करें। यदि कोई भी गंभीर समस्या या असहजता लगे तो तुरंत डॉक्टर या 108 पर संपर्क करें।`,
      mwr: `राम राम सा! म्हें आपरो DawaiMitra साथी हूँ। आपरी सेहत वास्ते: डाक्टर साब रे कैवण मुजब ही नेम राख’र दवाई लेवणी। खूब सादो पाणी पियो, हल्का खाणो खावो अर आराम करो। कोई घणी तकलीफ होवे तो तुरत डाक्टर ने दिखावजो सा।`,
      gu: `નમસ્તે! હું તમારો DawaiMitra સાથી છું. તમારા સ્વાસ્થ્ય માટે: હંમેશા ડૉક્ટરની સલાહ મુજબ નિયમિત સમયે દવાઓ લો. પૂરતું પાણી પીવો અને હળવો આહાર લો. વધુ તકલીફ જણાય તો તાત્કાલિક ડૉક્ટર અથવા ૧૦૮ નો સંપર્ક કરો.`,
      ta: `வணக்கம்! நான் உங்கள் DawaiMitra சுகாதார துணைவன். மருத்துவர் கூறியபடி மருந்துகளை நேரத்திற்கு உட்கொள்ளவும். அதிக தண்ணீர் குடித்து, லேசான உணவு உண்டு ஓய்வெடுக்கவும். ஏதேனும் தீவிர அறிகுறிகள் இருந்தால் உடனே மருத்துவரை அணுகவும்.`,
      pa: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ DawaiMitra ਸਿਹਤ ਸਾਥੀ ਹਾਂ। ਦਵਾਈਆਂ ਹਮੇਸ਼ਾ ਡਾਕਟਰ ਦੀ ਸਲਾਹ ਮੁਤਾਬਕ ਸਮੇਂ ਸਿਰ ਲਓ। ਪਾਣੀ ਜ਼ਿਆਦਾ ਪੀਓ ਅਤੇ ਹਲਕਾ ਖਾਣਾ ਖਾਓ। ਕੋਈ ਜ਼ਿਆਦਾ ਤਕਲੀਫ ਹੋਵੇ ਤਾਂ ਤੁਰੰਤ ਡਾਕਟਰ ਨੂੰ ਦਿਖਾਓ ਜੀ।`,
    };

    return res.json({
      success: true,
      reply: genericReplies[lang] || genericReplies.hi,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// 3. Drug Interaction Checker Endpoint (AI + Clinical Pharmacology Knowledge Engine)
app.post('/api/check-interactions', async (req, res) => {
  try {
    const { medicines = [], lang = 'hi' } = req.body;

    if (!Array.isArray(medicines) || medicines.length < 2) {
      return res.status(400).json({
        success: false,
        error: lang === 'en' ? 'At least 2 medicines are required to check interactions.' : 'टकराव जाँचने के लिए कम से कम 2 दवाइयों के नाम जोड़ें।',
      });
    }

    const languageInstruction = LANGUAGE_PROMPT_MAP[lang] || LANGUAGE_PROMPT_MAP.hi;
    let resultData: any = null;

    // 1. Try Gemini AI with candidate models & 9s timeout
    const activeAi = getAIClient();

    if (activeAi) {
      const candidates = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
      const promptText = `You are a clinical pharmacologist. Check for drug-drug interactions and dietary precautions between these medicines: ${medicines.join(', ')}.
Language instruction: All explanations and advice MUST be 100% in ${languageInstruction}.
Analyze:
1. Is it safe to take these medicines together?
2. If safe, level is "low".
3. If mild interaction or spacing required (e.g., take 2 hours apart, take with meals), level is "medium".
4. If high risk, severe bleeding, fatal blood pressure drop, or severe toxicity, safe is false and level is "high".
Output strict JSON with this exact schema:
{
  "safe": boolean,
  "level": "low" | "medium" | "high",
  "summary": "Short 1-2 sentence overall safety conclusion in ${languageInstruction}",
  "items": [
    {
      "pair": "Medicine A + Medicine B",
      "risk": "low" | "medium" | "high",
      "advice": "Detailed clinical precaution, interaction mechanism, and dosage spacing in ${languageInstruction}"
    }
  ],
  "foodCautions": ["List of food, drink, and lifestyle precautions in ${languageInstruction}"]
}
Return ONLY valid JSON without markdown code blocks.`;

      for (const modelName of candidates) {
        try {
          console.log(`[Interaction Checker] Trying model ${modelName} for ${medicines.join(', ')}...`);
          const callPromise = activeAi.models.generateContent({
            model: modelName,
            contents: promptText,
          });

          // 9s timeout
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout with ${modelName}`)), 9000)
          );

          const response: any = await Promise.race([callPromise, timeoutPromise]);
          if (response && response.text) {
            let clean = response.text.trim();
            const jsonMatch = clean.match(/\{[\s\S]*\}/);
            if (jsonMatch) clean = jsonMatch[0];
            const parsed = JSON.parse(clean);
            if (parsed && typeof parsed.safe === 'boolean' && Array.isArray(parsed.items)) {
              resultData = parsed;
              console.log(`[Interaction Checker] Succeeded with model ${modelName}`);
              break;
            }
          }
        } catch (err: any) {
          console.warn(`[Interaction Checker] Model ${modelName} failed (${err.message?.slice(0, 80)}), trying next...`);
        }
      }
    }

    // 2. If Gemini succeeded, return AI analysis
    if (resultData) {
      return res.json({ success: true, data: resultData, source: 'ai' });
    }

    // 3. Fallback: Use Clinical Pharmacology Knowledge Engine
    console.log('[Interaction Checker] Using Clinical Pharmacology Rules Engine fallback');
    const clinicalResult = evaluateClinicalInteractions(medicines, lang);
    return res.json({ success: true, data: clinicalResult, source: 'clinical_engine' });
  } catch (error: any) {
    console.error('Error in /api/check-interactions:', error);
    try {
      const fallback = evaluateClinicalInteractions(req.body?.medicines || [], req.body?.lang || 'hi');
      return res.json({ success: true, data: fallback, source: 'clinical_engine_emergency' });
    } catch {
      return res.status(500).json({
        success: false,
        error: error.message || 'दवाई टकराव जांच में त्रुटि हुई।',
      });
    }
  }
});

// 4. Appointments Endpoint
app.get('/api/appointments', (_req, res) => {
  return res.json({ success: true, appointments: appointmentsDb });
});

app.post('/api/appointments', (req, res) => {
  try {
    const { patientName, phone, specialty, doctorName, hospital, date, timeSlot, type, symptoms, userId } = req.body;

    if (!patientName || !phone || !date || !timeSlot) {
      return res.status(400).json({ error: 'Please provide patientName, phone, date, and timeSlot.' });
    }

    const newApt: AppointmentRecord = {
      id: `apt-${Date.now()}`,
      patientName,
      phone,
      specialty: specialty || 'General Medicine',
      doctorName: doctorName || 'OPD On-duty Consultant',
      hospital: hospital || 'District Hospital / AIIMS',
      date,
      timeSlot,
      type: type || 'opd',
      symptoms: symptoms || '',
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    appointmentsDb.unshift(newApt);
    return res.json({ success: true, appointment: newApt });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. System Health & Environment Check
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasGeminiKey: hasKey,
    environment: process.env.VERCEL ? 'vercel' : process.env.NETLIFY ? 'netlify' : 'node',
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DawaiMitra server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
export { app };

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

if (!isServerless) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}
