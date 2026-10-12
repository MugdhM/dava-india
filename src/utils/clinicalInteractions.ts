// Clinical Drug-Drug Interaction Knowledge Engine & Indian/Global Brand Normalizer

export interface DrugInteractionDetail {
  pair: string;
  risk: 'low' | 'medium' | 'high';
  advice: string;
}

export interface InteractionReport {
  safe: boolean;
  level: 'low' | 'medium' | 'high';
  summary: string;
  items: DrugInteractionDetail[];
  foodCautions: string[];
  isClinicalDb?: boolean;
}

// Brand to generic mapping
export const POPULAR_MEDICINES: { brandOrName: string; generic: string; category: string }[] = [
  { brandOrName: 'Paracetamol 650mg', generic: 'paracetamol', category: 'बुखार / दर्द (Pain & Fever)' },
  { brandOrName: 'Dolo 650', generic: 'paracetamol', category: 'बुखार / दर्द (Pain & Fever)' },
  { brandOrName: 'Calpol 500mg', generic: 'paracetamol', category: 'बुखार / दर्द (Pain & Fever)' },
  { brandOrName: 'Pantoprazole 40mg', generic: 'pantoprazole', category: 'गैस / एसिडिटी (Acidity & Gastric)' },
  { brandOrName: 'Pan-D (Pantoprazole + Domperidone)', generic: 'pantoprazole_domperidone', category: 'एसिडिटी व उल्टी (Acidity & Nausea)' },
  { brandOrName: 'Omeprazole 20mg', generic: 'omeprazole', category: 'गैस / एसिडिटी (Acidity)' },
  { brandOrName: 'Rabeprazole 20mg', generic: 'rabeprazole', category: 'गैस / एसिडिटी (Acidity)' },
  { brandOrName: 'Ibuprofen 400mg', generic: 'ibuprofen', category: 'दर्द व सूजन (NSAID Pain)' },
  { brandOrName: 'Combiflam', generic: 'ibuprofen_paracetamol', category: 'दर्द व सूजन (Painkiller)' },
  { brandOrName: 'Aspirin 75mg (Ecosprin)', generic: 'aspirin', category: 'खून पतला / दिल (Antiplatelet)' },
  { brandOrName: 'Clopidogrel 75mg (Clopilet)', generic: 'clopidogrel', category: 'खून पतला (Blood Thinner)' },
  { brandOrName: 'Warfarin 5mg', generic: 'warfarin', category: 'खून पतला (Anticoagulant)' },
  { brandOrName: 'Metformin 500mg (Glycomet)', generic: 'metformin', category: 'शुगर / डायबिटीज (Diabetes)' },
  { brandOrName: 'Glimepiride 1mg (Amaryl)', generic: 'glimepiride', category: 'शुगर / डायबिटीज (Diabetes)' },
  { brandOrName: 'Amoxicillin 500mg', generic: 'amoxicillin', category: 'एंटीबायोटिक (Antibiotic)' },
  { brandOrName: 'Augmentin 625 (Amox-Clav)', generic: 'amoxicillin_clavulanate', category: 'एंटीबायोटिक (Antibiotic)' },
  { brandOrName: 'Azithromycin 500mg (Azithral)', generic: 'azithromycin', category: 'एंटीबायोटिक (Antibiotic)' },
  { brandOrName: 'Ciprofloxacin 500mg (Ciplox)', generic: 'ciprofloxacin', category: 'एंटीबायोटिक (Antibiotic)' },
  { brandOrName: 'Cetirizine 10mg (Okacet)', generic: 'cetirizine', category: 'एलर्जी व जुकाम (Allergy)' },
  { brandOrName: 'Montelukast 10mg (Montair)', generic: 'montelukast', category: 'सांस / एलर्जी (Asthma/Allergy)' },
  { brandOrName: 'Atorvastatin 10mg (Atorva)', generic: 'atorvastatin', category: 'कोलेस्ट्रॉल (Cholesterol)' },
  { brandOrName: 'Rosuvastatin 10mg (Rozavel)', generic: 'rosuvastatin', category: 'कोलेस्ट्रॉल (Cholesterol)' },
  { brandOrName: 'Amlodipine 5mg (Amlong)', generic: 'amlodipine', category: 'ब्लड प्रेशर (Blood Pressure)' },
  { brandOrName: 'Telmisartan 40mg (Telma)', generic: 'telmisartan', category: 'ब्लड प्रेशर (Blood Pressure)' },
  { brandOrName: 'Losartan 50mg', generic: 'losartan', category: 'ब्लड प्रेशर (Blood Pressure)' },
  { brandOrName: 'Enalapril 5mg', generic: 'enalapril', category: 'ब्लड प्रेशर (ACE Inhibitor)' },
  { brandOrName: 'Tramadol 50mg', generic: 'tramadol', category: 'तेज दर्द (Opioid Analgesic)' },
  { brandOrName: 'Alprazolam 0.25mg (Alprax)', generic: 'alprazolam', category: 'नींद व तनाव (Sedative)' },
  { brandOrName: 'Levothyroxine 50mcg (Thyronorm)', generic: 'levothyroxine', category: 'थायराइड (Thyroid)' },
  { brandOrName: 'Calcium + Vit D3 (Shelcal)', generic: 'calcium_vitd', category: 'कैल्शियम / हड्डियाँ (Supplement)' },
  { brandOrName: 'Iron / Folic Acid (Autrin)', generic: 'iron', category: 'खून की कमी (Anemia / Iron)' },
  { brandOrName: 'Antacid Gel / Digene', generic: 'antacid', category: 'एसिडिटी सिरप (Antacid)' },
  { brandOrName: 'Sorbitrate 5mg (Isosorbide)', generic: 'nitrate', category: 'सीने में दर्द / दिल (Angina Nitrate)' },
  { brandOrName: 'Sildenafil 50mg', generic: 'sildenafil', category: 'PDE5 Inhibitor' },
];

export function normalizeDrugName(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  if (clean.includes('dolo') || clean.includes('crocin') || clean.includes('calpol') || clean.includes('paracetamol') || clean.includes('acetaminophen')) {
    return 'paracetamol';
  }
  if (clean.includes('combiflam')) {
    return 'ibuprofen_paracetamol';
  }
  if (clean.includes('aspirin') || clean.includes('ecosprin') || clean.includes('disprin') || clean.includes('asa')) {
    return 'aspirin';
  }
  if (clean.includes('warfarin') || clean.includes('coumadin')) {
    return 'warfarin';
  }
  if (clean.includes('clopidogrel') || clean.includes('clopilet') || clean.includes('plavix')) {
    return 'clopidogrel';
  }
  if (clean.includes('ibuprofen') || clean.includes('brufen') || clean.includes('advil') || clean.includes('motrin')) {
    return 'ibuprofen';
  }
  if (clean.includes('diclofenac') || clean.includes('voveran')) {
    return 'diclofenac';
  }
  if (clean.includes('pantoprazole') || clean.includes('pantocid') || clean.includes('pantodac') || clean.includes('pan 40') || clean.includes('pan d')) {
    return 'pantoprazole';
  }
  if (clean.includes('omeprazole') || clean.includes('omez') || clean.includes('prilosec')) {
    return 'omeprazole';
  }
  if (clean.includes('rabeprazole') || clean.includes('rabeloc') || clean.includes('razo')) {
    return 'rabeprazole';
  }
  if (clean.includes('metformin') || clean.includes('glycomet') || clean.includes('glucophage')) {
    return 'metformin';
  }
  if (clean.includes('glimepiride') || clean.includes('amaryl') || clean.includes('gliclazide')) {
    return 'sulfonylurea';
  }
  if (clean.includes('amoxicillin') || clean.includes('augmentin') || clean.includes('moxikind') || clean.includes('novamox')) {
    return 'amoxicillin';
  }
  if (clean.includes('azithromycin') || clean.includes('azithral') || clean.includes('zithromax')) {
    return 'azithromycin';
  }
  if (clean.includes('ciprofloxacin') || clean.includes('ciplox') || clean.includes('cipro') || clean.includes('ofloxacin') || clean.includes('levofloxacin')) {
    return 'fluoroquinolone';
  }
  if (clean.includes('cetirizine') || clean.includes('okacet') || clean.includes('zyrtec') || clean.includes('levocetirizine')) {
    return 'cetirizine';
  }
  if (clean.includes('atorvastatin') || clean.includes('atorva') || clean.includes('lipitor') || clean.includes('rosuvastatin')) {
    return 'statin';
  }
  if (clean.includes('amlodipine') || clean.includes('amlong') || clean.includes('norvasc')) {
    return 'amlodipine';
  }
  if (clean.includes('telmisartan') || clean.includes('telma') || clean.includes('losartan') || clean.includes('valsartan')) {
    return 'arb';
  }
  if (clean.includes('enalapril') || clean.includes('ramipril') || clean.includes('lisinopril')) {
    return 'ace_inhibitor';
  }
  if (clean.includes('tramadol') || clean.includes('ultram')) {
    return 'tramadol';
  }
  if (clean.includes('alprazolam') || clean.includes('alprax') || clean.includes('xanax') || clean.includes('clonazepam') || clean.includes('diazepam')) {
    return 'benzodiazepine';
  }
  if (clean.includes('levothyroxine') || clean.includes('thyronorm') || clean.includes('eltroxin')) {
    return 'levothyroxine';
  }
  if (clean.includes('calcium') || clean.includes('shelcal') || clean.includes('ostocalcium')) {
    return 'calcium';
  }
  if (clean.includes('iron') || clean.includes('ferrous') || clean.includes('autrin') || clean.includes('orofer')) {
    return 'iron';
  }
  if (clean.includes('digene') || clean.includes('gelusil') || clean.includes('antacid') || clean.includes('eno')) {
    return 'antacid';
  }
  if (clean.includes('sorbitrate') || clean.includes('nitroglycerin') || clean.includes('isosorbide') || clean.includes('nitrate')) {
    return 'nitrate';
  }
  if (clean.includes('sildenafil') || clean.includes('viagra') || clean.includes('tadalafil')) {
    return 'pde5';
  }
  if (clean.includes('fluoxetine') || clean.includes('sertraline') || clean.includes('escitalopram') || clean.includes('nexito')) {
    return 'ssri';
  }
  return clean;
}

// Evaluate clinical rules for a set of medicines
export function evaluateClinicalInteractions(medicines: string[], lang: string = 'hi'): InteractionReport {
  const normList = medicines.map((m) => ({ raw: m, norm: normalizeDrugName(m) }));
  const items: DrugInteractionDetail[] = [];
  const foodCautions: Set<string> = new Set();
  let maxRisk: 'low' | 'medium' | 'high' = 'low';

  // Check each pair
  for (let i = 0; i < normList.length; i++) {
    for (let j = i + 1; j < normList.length; j++) {
      const a = normList[i];
      const b = normList[j];
      const pairName = `${a.raw} + ${b.raw}`;

      const pairCheck = checkSpecificPair(a.norm, b.norm, pairName, lang);
      if (pairCheck) {
        items.push(pairCheck);
        if (pairCheck.risk === 'high') maxRisk = 'high';
        else if (pairCheck.risk === 'medium' && maxRisk !== 'high') maxRisk = 'medium';
      } else {
        // Default safe pair
        items.push({
          pair: pairName,
          risk: 'low',
          advice:
            lang === 'en'
              ? 'No known major direct interaction between these two medicines. Maintain recommended dosage and follow doctor advice.'
              : 'इन दोनों दवाइयों के बीच कोई गंभीर हानिकारक टकराव ज्ञात नहीं है। इन्हें डॉक्टर के बताए अनुसार समय पर लें।',
        });
      }
    }
  }

  // Dietary and food cautions
  for (const item of normList) {
    addFoodCautionsForDrug(item.norm, foodCautions, lang);
  }

  // Summary message
  const safe = maxRisk === 'low';
  let summary = '';
  if (maxRisk === 'high') {
    summary =
      lang === 'en'
        ? '⚠️ High Interaction Warning: One or more selected medicines have a dangerous interaction. Do NOT take together without immediate doctor consultation.'
        : '⚠️ गंभीर चेतावनी: चुनी गई दवाइयों में उच्च जोखिम वाला टकराव (High Risk) पाया गया है। डॉक्टर की सलाह के बिना इन्हें साथ में न लें!';
  } else if (maxRisk === 'medium') {
    summary =
      lang === 'en'
        ? '⚠️ Moderate Caution: These medicines can interact or irritate the stomach. Keep an interval between doses and follow clinical precautions.'
        : '⚠️ मध्यम सावधानी आवश्यक: इन दवाइयों के बीच प्रभाव हो सकता है। दोनों खुराकों में समय का अंतर रखें और निर्देशों का पालन करें।';
  } else {
    summary =
      lang === 'en'
        ? '✅ Safe Combination: No significant dangerous drug interactions detected between the selected medicines.'
        : '✅ सुरक्षित मेल: इन दवाइयों के बीच कोई हानिकारक टकराव नहीं मिला। यह संयोजन आमतौर पर सुरक्षित माना जाता है।';
  }

  return {
    safe,
    level: maxRisk,
    summary,
    items,
    foodCautions: Array.from(foodCautions),
    isClinicalDb: true,
  };
}

function checkSpecificPair(
  a: string,
  b: string,
  pairName: string,
  lang: string
): DrugInteractionDetail | null {
  const match = (x: string, y: string) =>
    (a === x && b === y) || (a === y && b === x);

  // 1. Aspirin + Warfarin / Clopidogrel
  if (match('aspirin', 'warfarin')) {
    return {
      pair: pairName,
      risk: 'high',
      advice:
        lang === 'en'
          ? 'CRITICAL DANGER: Both are potent blood thinners. Combined use significantly multiplies the risk of severe internal gastrointestinal and cerebral bleeding. Never take together without close doctor supervision and INR monitoring.'
          : 'अत्यधिक गंभीर जोखिम: एस्पिरिन और वॉर्फरिन दोनों खून को पतला करते हैं। इन्हें साथ लेने से आंतरिक रक्तस्राव (Bleeding) का बहुत अधिक खतरा होता है। डॉक्टर की विशेष निगरानी व INR टेस्ट के बिना कभी न लें।',
    };
  }

  if (match('aspirin', 'clopidogrel')) {
    return {
      pair: pairName,
      risk: 'medium',
      advice:
        lang === 'en'
          ? 'Dual Antiplatelet Caution: Often used together post-stent / heart attack (DAPT), but greatly increases stomach bleeding risk. Must be taken with a proton-pump inhibitor (like Pantoprazole) as prescribed by cardiologist.'
          : 'दोहरी खून पतला करने की दवा: दिल के दौरे या स्टेंट के बाद डॉक्टर इसे साथ देते हैं, लेकिन पेट में अल्सर व ब्लीडिंग का खतरा रहता है। हमेशा डॉक्टर की सलाह और गैस की दवा (जैसे Pantoprazole) के साथ लें।',
    };
  }

  // 2. NSAID + NSAID (Aspirin + Ibuprofen / Diclofenac)
  if (
    match('aspirin', 'ibuprofen') ||
    match('aspirin', 'diclofenac') ||
    match('aspirin', 'ibuprofen_paracetamol')
  ) {
    return {
      pair: pairName,
      risk: 'high',
      advice:
        lang === 'en'
          ? 'HIGH RISK: Ibuprofen blocks the heart-protective antiplatelet action of low-dose Aspirin and doubles the risk of stomach ulcers. If both are needed, take Aspirin at least 30-60 minutes before Ibuprofen.'
          : 'उच्च जोखिम: इबुप्रोफेन एस्पिरिन के दिल की सुरक्षा वाले प्रभाव को कमजोर करता है और पेट में गंभीर अल्सर व एसिडिटी का खतरा बढ़ाता है। दोनों को एक साथ कभी न लें।',
    };
  }

  // 3. Paracetamol + Ibuprofen
  if (match('paracetamol', 'ibuprofen') || match('paracetamol', 'ibuprofen_paracetamol')) {
    return {
      pair: pairName,
      risk: 'medium',
      advice:
        lang === 'en'
          ? 'Moderate Precaution: Paracetamol (liver pathway) and Ibuprofen (kidney/stomach pathway) can be used together in severe pain under guidance, but watch for stomach burn. Always take Ibuprofen after food.'
          : 'मध्यम सावधानी: पैरासिटामोल और इबुप्रोफेन को तेज दर्द में बदल-बदल कर दिया जा सकता है, लेकिन खाली पेट न लें। इबुप्रोफेन हमेशा खाना खाने के बाद ही लें ताकि पेट में जलन न हो।',
    };
  }

  // 4. Paracetamol + Pantoprazole / Omeprazole
  if (
    match('paracetamol', 'pantoprazole') ||
    match('paracetamol', 'omeprazole') ||
    match('paracetamol', 'rabeprazole')
  ) {
    return {
      pair: pairName,
      risk: 'low',
      advice:
        lang === 'en'
          ? 'Safe & Compatible: Commonly co-prescribed. Pantoprazole protects the gastric lining, while Paracetamol controls pain and fever. Take Pantoprazole in the morning on an empty stomach.'
          : 'सुरक्षित मेल (Safe): यह दोनों दवाइयाँ साथ में पूरी तरह सुरक्षित हैं। पेंटोप्राजोल पेट में एसिडिटी से बचाता है और पैरासिटामोल बुखार-दर्द कम करता है।',
    };
  }

  // 5. Nitrate + Sildenafil / Tadalafil
  if (match('nitrate', 'pde5')) {
    return {
      pair: pairName,
      risk: 'high',
      advice:
        lang === 'en'
          ? 'FATAL WARNING: Combining nitrates (Sorbitrate / Nitroglycerin) with Sildenafil causes a catastrophic drop in blood pressure that can be fatal. Absolute medical contraindication.'
          : 'जानलेवा चेतावनी: दिल की सॉरबिट्रेट (Nitrate) के साथ सिल्डेनाफिल (Sildenafil) लेने से ब्लड प्रेशर जानलेवा रूप से गिर सकता है। इन दोनों को कभी भी साथ में न लें!',
    };
  }

  // 6. Metformin + Sulfonylurea (Glimepiride)
  if (match('metformin', 'sulfonylurea')) {
    return {
      pair: pairName,
      risk: 'medium',
      advice:
        lang === 'en'
          ? 'Synergistic Diabetes Treatment: Safe and widely prescribed combination, but increases the risk of hypoglycemia (low blood sugar). Monitor fasting and post-meal glucose and keep glucose candy nearby.'
          : 'डायबिटीज में सामान्य मेल: डॉक्टर इसे अक्सर साथ लिखते हैं, लेकिन अचानक शुगर लो (Hypoglycemia) होने का खतरा रहता है। नियमित शुगर चेक करें और पास में थोड़ा मीठा रखें।',
    };
  }

  // 7. Ciprofloxacin / Fluoroquinolone + Antacid / Calcium / Iron
  if (
    match('fluoroquinolone', 'antacid') ||
    match('fluoroquinolone', 'calcium') ||
    match('fluoroquinolone', 'iron')
  ) {
    return {
      pair: pairName,
      risk: 'medium',
      advice:
        lang === 'en'
          ? 'Reduced Absorption Warning: Calcium, Iron, or Antacids bind with Ciprofloxacin/Ofloxacin in the gut, reducing antibiotic absorption by up to 75%. Take at least 2 hours BEFORE or 4 hours AFTER the antacid/mineral.'
          : 'अवशोषण में रुकावट: एंटासिड, कैल्शियम या आयरन एंटीबायोटिक (सिप्रोफ्लोक्सासिन) से चिपक जाते हैं जिससे दवा शरीर में नहीं घुलती। दोनों के बीच कम से कम 2 से 3 घंटे का अंतर अवश्य रखें।',
    };
  }

  // 8. Levothyroxine (Thyronorm) + Calcium / Iron
  if (match('levothyroxine', 'calcium') || match('levothyroxine', 'iron')) {
    return {
      pair: pairName,
      risk: 'medium',
      advice:
        lang === 'en'
          ? 'Thyroid Absorption Interruption: Calcium and Iron supplements severely inhibit the absorption of Levothyroxine. Take Levothyroxine first thing in morning with plain water, and take Calcium/Iron at least 4 hours later.'
          : 'थायराइड अवशोषण में रुकावट: कैल्शियम या आयरन थायराइड की दवा (Thyronorm) का असर खत्म कर देते हैं। थायराइड की दवा सुबह खाली पेट लें और कैल्शियम/आयरन कम से कम 4 घंटे बाद लें।',
    };
  }

  // 9. Statin (Atorvastatin) + Azithromycin
  if (match('statin', 'azithromycin')) {
    return {
      pair: pairName,
      risk: 'medium',
      advice:
        lang === 'en'
          ? 'Caution: Macrolide antibiotics may increase blood concentration of Atorvastatin, slightly elevating the risk of muscle soreness or liver strain. Report severe muscle pain to doctor.'
          : 'सावधानी: यह एंटीबायोटिक एटोरवास्टेटिन के स्तर को बढ़ा सकता है, जिससे मांसपेशियों में दर्द (Muscle Pain) हो सकता है। दर्द होने पर डॉक्टर को बताएं।',
    };
  }

  // 10. ACE Inhibitor / ARB (Telmisartan/Enalapril) + Potassium or NSAID
  if (match('arb', 'ibuprofen') || match('ace_inhibitor', 'ibuprofen') || match('arb', 'diclofenac')) {
    return {
      pair: pairName,
      risk: 'medium',
      advice:
        lang === 'en'
          ? 'Kidney Strain & BP Elevation: Regular NSAIDs (Ibuprofen, Diclofenac) blunt the blood pressure lowering effect of Telmisartan/Enalapril and can strain kidney function, especially in dehydration.'
          : 'बीपी व किडनी पर असर: दर्द निवारक गोलियां (Ibuprofen) बीपी की दवा के असर को घटाती हैं और किडनी पर अतिरिक्त दबाव डालती हैं। दर्द में पैरासिटामोल को प्राथमिकता दें।',
    };
  }

  // 11. Tramadol + SSRI / Antidepressants
  if (match('tramadol', 'ssri')) {
    return {
      pair: pairName,
      risk: 'high',
      advice:
        lang === 'en'
          ? 'SEROTONIN SYNDROME RISK: Tramadol with SSRI antidepressants can trigger excess serotonin, causing tremor, high fever, rapid pulse, and agitation. Strictly avoid unless specifically dosed by physician.'
          : 'गंभीर जोखिम: ट्रामाडोल और डिप्रेशन की दवाइयों (SSRI) को साथ लेने से सेरोटोनिन सिंड्रोम का खतरा होता है, जिससे कंपकंपी, तेज बुखार और बेचैनी हो सकती है।',
    };
  }

  // 12. Benzodiazepine + Alcohol / Opioid
  if (match('benzodiazepine', 'tramadol')) {
    return {
      pair: pairName,
      risk: 'high',
      advice:
        lang === 'en'
          ? 'RESPIRATORY DEPRESSION DANGER: Combining sedatives (Alprazolam) with opioid painkillers (Tramadol) causes severe central nervous system depression, extreme dizziness, and slowed breathing.'
          : 'गंभीर सुस्ती व सांस में रुकावट: नींद/तनाव की दवा और ट्रामाडोल को साथ लेने से अत्यधिक बेहोशी और सांस धीमी होने का गंभीर खतरा रहता है।',
    };
  }

  // 13. Amoxicillin + Paracetamol
  if (match('amoxicillin', 'paracetamol')) {
    return {
      pair: pairName,
      risk: 'low',
      advice:
        lang === 'en'
          ? 'Safe & Standard: Very commonly prescribed together to treat bacterial infections while controlling fever and body aches. Complete the full antibiotic course.'
          : 'पूरी तरह सुरक्षित: बुखार और संक्रमण में यह दोनों दवाइयाँ साथ में बहुत आम तौर पर दी जाती हैं। एंटीबायोटिक का पूरा कोर्स समय पर खत्म करें।',
    };
  }

  // 14. Cetirizine + Paracetamol
  if (match('cetirizine', 'paracetamol')) {
    return {
      pair: pairName,
      risk: 'low',
      advice:
        lang === 'en'
          ? 'Safe Combination: Often used together in common cold and viral fever. Take Cetirizine at night as it may cause slight sleepiness.'
          : 'सुरक्षित मेल: सर्दी-जुकाम और बुखार में यह संयोजन सुरक्षित है। सिट्रीजीन से हल्की नींद आ सकती है, इसलिए इसे रात में लेना बेहतर है।',
    };
  }

  return null;
}

function addFoodCautionsForDrug(
  drug: string,
  cautions: Set<string>,
  lang: string
) {
  if (drug === 'warfarin') {
    cautions.add(
      lang === 'en'
        ? 'Maintain consistent Vitamin K intake: Do not drastically increase green leafy vegetables (spinach, cabbage, broccoli) as they reduce Warfarin efficacy.'
        : 'हरी पत्तेदार सब्जियां (पालक, पत्तागोभी) सीमित व स्थिर रखें, क्योंकि विटामिन K वॉर्फरिन के असर को बदल सकता है।'
    );
  }
  if (drug === 'aspirin' || drug === 'ibuprofen' || drug === 'diclofenac' || drug === 'ibuprofen_paracetamol') {
    cautions.add(
      lang === 'en'
        ? 'Avoid alcohol completely: Combining alcohol with NSAIDs/Aspirin drastically increases the risk of stomach bleeding and ulcers.'
        : 'शराब (अल्कोहल) से बिल्कुल दूर रहें; दर्द की दवाइयों के साथ शराब लेने से पेट में अल्सर व ब्लीडिंग हो सकती है।'
    );
    cautions.add(
      lang === 'en'
        ? 'Always take with food or milk to prevent gastric irritation and heartburn.'
        : 'हमेशा भोजन या दूध के बाद ही लें, खाली पेट लेने से पेट में जलन हो सकती है।'
    );
  }
  if (drug === 'paracetamol') {
    cautions.add(
      lang === 'en'
        ? 'Do not consume alcohol: Alcohol combined with Paracetamol increases the risk of severe liver damage.'
        : 'शराब से बचें; पैरासिटामोल के साथ शराब लीवर (Liver) के लिए हानिकारक होती है।'
    );
  }
  if (drug === 'metformin') {
    cautions.add(
      lang === 'en'
        ? 'Take strictly with or immediately after meals to reduce stomach upset and nausea. Avoid heavy alcohol.'
        : 'हमेशा भोजन के साथ या तुरंत बाद लें ताकि पेट खराब न हो। अत्यधिक शराब से बचें।'
    );
  }
  if (drug === 'pantoprazole' || drug === 'omeprazole' || drug === 'rabeprazole') {
    cautions.add(
      lang === 'en'
        ? 'Take in the morning 30 minutes before breakfast with a glass of plain water for best acidity relief.'
        : 'सुबह नाश्ते से 30 मिनट पहले खाली पेट सादे पानी के साथ लें ताकि एसिडिटी से पूरा आराम मिले।'
    );
  }
  if (drug === 'statin') {
    cautions.add(
      lang === 'en'
        ? 'Avoid large amounts of grapefruit juice, which can inhibit statin metabolism and increase side effects.'
        : 'चकोतरा (Grapefruit) का जूस न पिएं, यह दवा के असर को असंतुलित कर सकता है।'
    );
  }
  if (drug === 'fluoroquinolone') {
    cautions.add(
      lang === 'en'
        ? 'Drink plenty of water (2-3 liters) throughout the day to prevent crystalluria. Avoid milk/curd at the exact time of pill intake.'
        : 'खूब पानी पिएं। गोली लेने के तुरंत साथ दूध या दही न लें (1-2 घंटे का अंतर रखें)।'
    );
  }
  if (drug === 'cetirizine' || drug === 'benzodiazepine') {
    cautions.add(
      lang === 'en'
        ? 'Avoid driving or operating machinery if feeling drowsy. Avoid alcohol as it magnifies sedation.'
        : 'दवा लेने के बाद चक्कर या नींद आए तो ड्राइविंग न करें। शराब का सेवन न करें।'
    );
  }
}
