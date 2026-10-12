import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { LanguageCode, Prescription, MedicineItem } from '../types';
import { TRANSLATIONS } from '../translations';
import { speakText, stopSpeech } from '../utils/speech';
import { scanPrescriptionImage } from '../utils/geminiClient';
import {
  Camera,
  Upload,
  Volume2,
  BookmarkCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Pill,
  FileText,
  X,
  RefreshCw,
  Info,
  AlertCircle,
} from 'lucide-react';

interface PrescriptionReaderProps {
  currentLang: LanguageCode;
  onSavePrescription: (rx: Prescription) => void;
  onAddReminderFromMed: (med: MedicineItem, rxId: string) => void;
}

function compressScanImage(image: CanvasImageSource, width: number, height: number): string {
  let scale = Math.min(1, 1600 / Math.max(width, height));
  const qualities = [0.82, 0.7, 0.58];

  for (let attempt = 0; attempt < 9; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not prepare prescription image for scanning.');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL(
      'image/jpeg',
      qualities[attempt % qualities.length]
    );
    if (dataUrl.length <= 2_800_000) {
      return dataUrl;
    }

    if ((attempt + 1) % qualities.length === 0) {
      scale *= 0.75;
    }
  }

  throw new Error('Photo is too large to upload. Please choose a smaller image.');
}

export const PrescriptionReader: React.FC<PrescriptionReaderProps> = ({
  currentLang,
  onSavePrescription,
  onAddReminderFromMed,
}) => {
  const t = TRANSLATIONS[currentLang];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [parsedRx, setParsedRx] = useState<Prescription | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [speakingMedIdx, setSpeakingMedIdx] = useState<number | null>(null);
  const [isSpeakingAll, setIsSpeakingAll] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Time slot labels dictionary for medicines
  const timeLabels: Record<string, string> = {
    morning: t.timeMorning || 'सुबह',
    afternoon: t.timeAfternoon || 'दोपहर',
    evening: t.timeEvening || 'शाम',
    night: t.timeNight || 'रात',
  };

  const ui = {
    hi: {
      readyBadge: 'पर्ची तैयार है',
      readyTitle: 'दवाईमित्र AI द्वारा पर्ची समझने के लिए तैयार',
      chosenLang: 'चुनी हुई भाषा',
      readingWait: 'AI पर्ची पढ़ रहा है...',
      readingDesc: 'डॉक्टर की लिखावट पहचानकर दवाइयों के नियम और समय निकाले जा रहे हैं...',
      chooseAnother: '🔄 दूसरी फोटो चुनें',
      speakDose: 'खुराक',
      speakMeal: 'कब लेनी है',
      speakDays: 'दिन',
      speakSideEffects: 'साइड इफेक्ट',
      speakWarnings: 'सावधानी',
      daysCourse: 'दिन का कोर्स',
      autoRemindSuccess: 'केवल स्पष्ट समय और अवधि वाली दवाइयों के रिमाइंडर बने हैं। बाकी के लिए मैन्युअल रिमाइंडर सेट करें।',
    },
    en: {
      readyBadge: 'Prescription Ready',
      readyTitle: 'Ready for DawaiMitra AI Analysis',
      chosenLang: 'Selected Language',
      readingWait: 'AI is analyzing prescription...',
      readingDesc: 'Deciphering handwriting, dosage schedule, and food precautions...',
      chooseAnother: '🔄 Choose Another Photo',
      speakDose: 'Dosage',
      speakMeal: 'Meal instruction',
      speakDays: 'days',
      speakSideEffects: 'Side effects',
      speakWarnings: 'Safety alerts',
      daysCourse: 'Days Course',
      autoRemindSuccess: 'Automatic reminders are created only when the prescription clearly specifies timing and duration. Set other reminders manually.',
    },
    mwr: {
      readyBadge: 'पर्ची तैयार है सा',
      readyTitle: 'दवाईमित्र AI सूं पर्ची समझण वास्ते तैयार',
      chosenLang: 'छांटेड़ी बोली',
      readingWait: 'AI पर्ची वांच रह्यो है सा...',
      readingDesc: 'डाक्टर साब री लिखाई पहचान’र दवाई रो नेम अर टेम तय कर्यो जा रह्यो है...',
      chooseAnother: '🔄 दूजी फोटो छांटो',
      speakDose: 'खुराक',
      speakMeal: 'कद लेवणी',
      speakDays: 'दिन',
      speakSideEffects: 'साइड-इफेक्ट',
      speakWarnings: 'चेतावनी',
      daysCourse: 'दिनां रो कोर्स',
      autoRemindSuccess: 'रीत अर अवधि साफ लिखेली होवै, उण दवाइयां रा रिमाइंडर बनै है। बाकी खातर मैन्युअल रिमाइंडर बनावो।',
    },
    gu: {
      readyBadge: 'પ્રિસ્ક્રિપ્શન તૈયાર છે',
      readyTitle: 'DawaiMitra AI દ્વારા સમજવા માટે તૈયાર',
      chosenLang: 'પસંદ કરેલી ભાષા',
      readingWait: 'AI પ્રિસ્ક્રિપ્શન વાંચી રહ્યું છે...',
      readingDesc: 'ડૉક્ટરના અક્ષરો ઓળખીને દવાનો સમય અને માત્રા નક્કી કરવામાં આવી રહી છે...',
      chooseAnother: '🔄 બીજો ફોટો પસંદ કરો',
      speakDose: 'ડોઝ',
      speakMeal: 'ક્યારે લેવી',
      speakDays: 'દિવસ',
      speakSideEffects: 'આડઅસર',
      speakWarnings: 'ચેતવણી',
      daysCourse: 'દિવસનો કોર્સ',
      autoRemindSuccess: 'સ્પષ્ટ સમય અને અવધિ ધરાવતી દવાઓ માટે જ રિમાઇન્ડર બનાવાયા છે. અન્ય માટે મેન્યુઅલ રિમાઇન્ડર સેટ કરો.',
    },
    ta: {
      readyBadge: 'மருந்துச் சீட்டு தயார்',
      readyTitle: 'மருந்துமித்ரா AI ஆய்வுக்கு தயார்',
      chosenLang: 'தேர்ந்தெடுக்கப்பட்ட மொழி',
      readingWait: 'AI மருந்துச் சீட்டை படிக்கிறது...',
      readingDesc: 'மருத்துவர் கையெழுத்தை உணர்ந்து மருந்து நேரங்கள் கணக்கிடப்படுகின்றன...',
      chooseAnother: '🔄 மாற்றுப் படம் தேர்வு செய்க',
      speakDose: 'அளவு',
      speakMeal: 'உணவு முறை',
      speakDays: 'நாட்கள்',
      speakSideEffects: 'பக்க விளைவுகள்',
      speakWarnings: 'எச்சரிக்கை',
      daysCourse: 'நாட்கள் சிகிச்சை',
      autoRemindSuccess: 'தெளிவான நேரம் மற்றும் கால அளவு உள்ள மருந்துகளுக்கு மட்டுமே நினைவூட்டல்கள் உருவாக்கப்பட்டன. மற்றவற்றை கைமுறையாக அமைக்கவும்.',
    },
    pa: {
      readyBadge: 'ਪਰਚੀ ਤਿਆਰ ਹੈ',
      readyTitle: 'DawaiMitra AI ਰਾਹੀਂ ਪਰਚੀ ਸਮਝਣ ਲਈ ਤਿਆਰ',
      chosenLang: 'ਚੁਣੀ ਗਈ ਬੋਲੀ',
      readingWait: 'AI ਪਰਚੀ ਪੜ੍ਹ ਰਿਹਾ ਹੈ...',
      readingDesc: 'ਡਾਕਟਰ ਦੀ ਲਿਖਾਈ ਪਛਾਣ ਕੇ ਦਵਾਈਆਂ ਦਾ ਸਮਾਂ ਅਤੇ ਨਿਯਮ ਕੱਢੇ ਜਾ ਰਹੇ ਹਨ...',
      chooseAnother: '🔄 ਹੋਰ ਫੋਟੋ ਚੁਣੋ',
      speakDose: 'ਖੁਰਾਕ',
      speakMeal: 'ਕਦੋਂ ਲੈਣੀ',
      speakDays: 'ਦਿਨ',
      speakSideEffects: 'ਮਾੜੇ ਪ੍ਰਭਾਵ',
      speakWarnings: 'ਸਾਵਧਾਨੀ',
      daysCourse: 'ਦਿਨਾਂ ਦਾ ਕੋਰਸ',
      autoRemindSuccess: 'ਸਪੱਸ਼ਟ ਸਮੇਂ ਅਤੇ ਮਿਆਦ ਵਾਲੀਆਂ ਦਵਾਈਆਂ ਲਈ ਹੀ ਰਿਮਾਈਂਡਰ ਬਣੇ ਹਨ। ਹੋਰਾਂ ਲਈ ਹੱਥੀਂ ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਕਰੋ।',
    },
  }[currentLang] || {
    readyBadge: 'पर्ची तैयार है',
    readyTitle: 'दवाईमित्र AI द्वारा पर्ची समझने के लिए तैयार',
    chosenLang: 'चुनी हुई भाषा',
    readingWait: 'AI पर्ची पढ़ रहा है...',
    readingDesc: 'डॉक्टर की लिखावट पहचानकर दवाइयों के नियम और समय निकाले जा रहे हैं...',
    chooseAnother: '🔄 दूसरी फोटो चुनें',
    speakDose: 'खुराक',
    speakMeal: 'कब लेनी है',
    speakDays: 'दिन',
    speakSideEffects: 'साइड इफेक्ट',
    speakWarnings: 'सावधानी',
    daysCourse: 'दिन का कोर्स',
    autoRemindSuccess: 'केवल स्पष्ट समय और अवधि वाली दवाइयों के रिमाइंडर बने हैं। बाकी के लिए मैन्युअल रिमाइंडर सेट करें।',
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('आपके ब्राउज़र में कैमरा सपोर्ट उपलब्ध नहीं है।');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'कैमरा अनुमति नहीं मिल सकी। कृपया ब्राउज़र सेटिंग्स में कैमरा चालू करें या फोटो अपलोड का विकल्प चुनें।'
      );
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture Snapshot from Camera
  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      try {
        const dataUrl = compressScanImage(video, width, height);
        setSelectedImage(dataUrl);
        stopCamera();
      } catch (error) {
        console.error('Could not prepare camera image:', error);
        setScanError('फोटो तैयार नहीं हो सकी। कृपया दोबारा तस्वीर लें।');
      }
    }
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeech();
    };
  }, []);

  // Handle Local File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          setSelectedImage(compressScanImage(image, image.naturalWidth, image.naturalHeight));
          setParsedRx(null);
          setScanError(null);
          setSaveSuccessMsg(false);
        } catch (error) {
          console.error('Could not prepare prescription image:', error);
          setScanError('फोटो तैयार नहीं हो सकी। कृपया दूसरी तस्वीर चुनें।');
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setScanError('यह फोटो पढ़ी नहीं जा सकी। कृपया JPG, PNG या WEBP तस्वीर चुनें।');
      };
      image.src = objectUrl;
    }
  };

  // Load a realistic pre-loaded demo prescription
  const loadDemoPrescription = () => {
    // Generate a simple stylized prescription canvas
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fffdf0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#e0d8b0';
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      ctx.fillStyle = '#0f4c4c';
      ctx.font = 'bold 22px serif';
      ctx.fillText('Dr. S. K. Mathur (MD) — AIIMS OPD', 30, 45);

      ctx.fillStyle = '#555';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Date: ${new Date().toISOString().slice(0, 10)}  |  Patient: Ramswaroop (62/M)`, 30, 75);

      ctx.strokeStyle = '#0b8f87';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 90);
      ctx.lineTo(570, 90);
      ctx.stroke();

      ctx.fillStyle = '#112';
      ctx.font = 'bold 20px serif';
      ctx.fillText('Rx', 30, 130);

      ctx.font = '16px cursive, sans-serif';
      ctx.fillText('1. Tab. Paracetamol 650mg — 1-0-1 × 5 Days (after food)', 40, 170);
      ctx.fillText('2. Syp. Cough Relief 10ml — 1-1-1 × 5 Days (after food)', 40, 210);
      ctx.fillText('3. Cap. Pantoprazole 40mg — 1-0-0 × 5 Days (before food)', 40, 250);
      ctx.fillText('4. Tab. Cetirizine 10mg — 0-0-1 × 3 Days (at night)', 40, 290);

      ctx.font = 'italic 14px sans-serif';
      ctx.fillStyle = '#c0392b';
      ctx.fillText('* Avoid cold drinks, avoid heavy oily food.', 40, 340);
      ctx.fillText('* Follow-up after 5 days if fever persists.', 40, 370);

      setSelectedImage(canvas.toDataURL('image/jpeg', 0.9));
      setParsedRx(null);
      setScanError(null);
      setSaveSuccessMsg(false);
    }
  };

  // Perform AI Prescription Scan via server endpoint
  const handleScanPrescription = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setParsedRx(null);
    setScanError(null);
    setSaveSuccessMsg(false);

    try {
      const result = await scanPrescriptionImage(selectedImage, currentLang);
      if (result.success && result.data) {
        const rxData: Prescription = {
          id: `rx-${Date.now()}`,
          doctor: result.data.doctor || 'Senior Consultant',
          date: result.data.date || new Date().toISOString().slice(0, 10),
          patientName: result.data.patientName || 'Patient',
          summary: result.data.summary || 'Prescription overview',
          meds: result.data.meds || [],
          warnings: result.data.warnings || [],
          followUp: result.data.followUp || '',
          imageUrl: selectedImage,
          createdAt: Date.now(),
          language: currentLang,
        };
        setParsedRx(rxData);
        setScanError(null);
      } else {
        setScanError(
          result.error ||
            'पर्ची को स्कैन करने में समस्या आई। कृपया साफ और सीधी फोटो अपलोड करें।'
        );
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(currentLang === 'en'
        ? 'The scan failed. Check your connection and try again.'
        : 'स्कैनिंग के दौरान समस्या आई। कृपया नेटवर्क जांचें और दोबारा प्रयास करें।');
    } finally {
      setIsScanning(false);
    }
  };

  // Save Prescription and Auto-create Reminders
  const handleSaveAndRemind = () => {
    if (!parsedRx) return;
    onSavePrescription(parsedRx);

    // Auto-schedule reminders for all medications in this prescription
    parsedRx.meds.forEach((med) => {
      onAddReminderFromMed(med, parsedRx.id);
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 5000);
  };

  // Speak single medicine
  const handleSpeakMed = (med: MedicineItem, idx: number) => {
    if (speakingMedIdx === idx) {
      stopSpeech();
      setSpeakingMedIdx(null);
      return;
    }
    stopSpeech();
    setSpeakingMedIdx(idx);

    const timingStr = med.times
      .map((t) => timeLabels[t] || t)
      .join(', ');

    const text = `${med.name}। ${med.purpose}। ${ui.speakDose}: ${med.dose}। ${timingStr}। ${med.meal}। ${med.days} ${ui.speakDays}। ${ui.speakSideEffects}: ${med.side_effects || ''}।`;
    speakText(text, currentLang);

    setTimeout(() => {
      setSpeakingMedIdx(null);
    }, 9000);
  };

  // Speak entire prescription
  const handleSpeakAll = () => {
    if (!parsedRx) return;
    if (isSpeakingAll) {
      stopSpeech();
      setIsSpeakingAll(false);
      return;
    }

    setIsSpeakingAll(true);
    let fullText = `${parsedRx.summary}। `;
    parsedRx.meds.forEach((m) => {
      const timingStr = m.times.map((t) => timeLabels[t] || t).join(', ');
      fullText += `${m.name}। ${m.purpose}। ${ui.speakDose}: ${m.dose}। ${timingStr} ${m.meal}। `;
    });
    if (parsedRx.warnings && parsedRx.warnings.length) {
      fullText += `${ui.speakWarnings}: ${parsedRx.warnings.join('। ')}।`;
    }

    speakText(fullText, currentLang);
    setTimeout(() => {
      setIsSpeakingAll(false);
    }, 18000);
  };

  return (
    <section
      id="reader"
      className="py-14 sm:py-20 bg-linear-to-b from-white via-teal-50/20 to-white border-b border-teal-100/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
            AI पर्ची रीडर (Vision)
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2">
            {t.readerTitle}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {t.readerSub}
          </p>
        </div>

        {/* Upload Box Container */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-teal-100 shadow-xl">
          {/* Action Choice Buttons: Camera vs Local Device File vs Demo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => {
                if (isCameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className={`p-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isCameraActive
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100'
              }`}
            >
              <Camera className="w-5 h-5 text-teal-700" />
              <span>{isCameraActive ? t.closeCameraBtn : t.useCameraBtn}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-5 h-5 text-teal-700" />
              <span>{t.uploadLocalBtn}</span>
            </button>

            <button
              onClick={loadDemoPrescription}
              className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>💡 नमूना पर्ची आज़माएँ (Demo Rx)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Live Camera Viewport Modal Area */}
          {isCameraActive && (
            <div className="mb-6 p-4 rounded-3xl bg-slate-900 text-white flex flex-col items-center">
              <div className="relative w-full max-w-lg aspect-4/3 rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-teal-500 shadow-xl">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-4 inset-y-4 border-2 border-dashed border-teal-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="bg-black/60 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-xs">
                    पर्ची को इस फ्रेम के अंदर रखें
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={captureSnapshot}
                  className="px-6 py-3 rounded-full bg-linear-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-teal-500/40 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full bg-white animate-pulse" />
                  <span>{t.capturePhotoBtn}</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-3 rounded-full bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  {t.closeCameraBtn}
                </button>
              </div>
            </div>
          )}

          {/* Selected Prescription Preview Area */}
          {selectedImage && !isCameraActive && (
            <div className="mb-6 p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-full sm:w-64 max-h-64 rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-white shrink-0">
                <img
                  src={selectedImage}
                  alt="Selected Prescription"
                  className="w-full h-full object-contain max-h-60"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setParsedRx(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700"
                  title="हटाएँ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                  <span>{ui.readyBadge}</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                  {ui.readyTitle}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mb-4">
                  {ui.chosenLang}:{' '}
                  <span className="font-bold text-teal-700">
                    {t.langsAvailable}
                  </span>
                </p>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={handleScanPrescription}
                    disabled={isScanning}
                    className="px-6 py-3.5 rounded-2xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-teal-600/30 hover:scale-102 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{ui.readingWait}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <span>{t.scanNowBtn}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-all"
                  >
                    {ui.chooseAnother}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scan Error Feedback Alert */}
          {scanError && !isScanning && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">{scanError}</p>
                <p className="text-xs text-rose-700 mt-1">
                  {currentLang === 'en'
                    ? 'Tip: Keep the prescription straight, shadow-free, and well lit so the handwriting and medicines are easy to read.'
                    : 'सुझाव: पर्ची की फोटो सीधी, बिना परछाई और अच्छी रोशनी में खींचें ताकि डॉक्टर की लिखावट और दवाइयाँ साफ पढ़ी जा सकें।'}
                </p>
              </div>
              <button
                onClick={() => setScanError(null)}
                className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer"
                title="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isScanning && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
              <h4 className="text-lg font-bold text-teal-950 mb-1">
                {ui.readingWait}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500">
                {ui.readingDesc}
              </p>
            </div>
          )}

          {/* Parsed Prescription Output Cards */}
          {parsedRx && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 pt-8 border-t border-slate-200"
            >
              {/* Verified Genuine OCR Badge */}
              <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>AI द्वारा पर्ची से जाँची गई वास्तविक दवाइयाँ (Genuine Extracted Rx)</span>
              </div>

              {/* Doctor and Date Ribbon */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block">
                    {t.rxDoctor}
                  </span>
                  <span className="font-extrabold text-base text-slate-900">
                    👨‍⚕️ {parsedRx.doctor}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block">
                    {t.rxDate}
                  </span>
                  <span className="font-semibold text-sm text-slate-800">
                    📅 {parsedRx.date}
                  </span>
                </div>
              </div>

              {/* Prescription Summary */}
              {parsedRx.summary && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span>{t.rxSummary}</span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed font-medium">
                    {parsedRx.summary}
                  </p>
                </div>
              )}

              {/* Medicine Cards Grid */}
              <div className="space-y-4 mb-6">
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-600" />
                  <span>
                    {currentLang === 'en'
                      ? `Prescribed Medicines (${parsedRx.meds.length})`
                      : currentLang === 'mwr'
                      ? `दवाइयां री सूची (${parsedRx.meds.length} दवाइयां)`
                      : currentLang === 'gu'
                      ? `દવાઓની યાદી (${parsedRx.meds.length})`
                      : currentLang === 'ta'
                      ? `மருந்துகளின் பட்டியல் (${parsedRx.meds.length})`
                      : currentLang === 'pa'
                      ? `ਦਵਾਈਆਂ ਦੀ ਸੂਚੀ (${parsedRx.meds.length})`
                      : `दवाइयों की सूची (${parsedRx.meds.length} दवाइयाँ)`}
                  </span>
                </h4>

                {parsedRx.meds.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-white border-2 border-teal-100 hover:border-teal-300 shadow-sm transition-all text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                          {idx + 1}
                        </span>
                        <h5 className="font-extrabold text-base sm:text-lg text-slate-900">
                          💊 {med.name}
                        </h5>
                      </div>

                      {/* Single Medicine Listen Button */}
                      <button
                        onClick={() => handleSpeakMed(med, idx)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                          speakingMedIdx === idx
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>
                          {speakingMedIdx === idx ? t.stopAudioBtn : t.speakMedBtn}
                        </span>
                      </button>
                    </div>

                    {/* Quick Badges: Dose, Timing, Meal, Days */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {med.dose && (
                        <span className="px-2.5 py-1 rounded-full bg-teal-600 text-white text-xs font-bold shadow-xs">
                          {med.dose}
                        </span>
                      )}

                      {med.times?.map((timeSlot) => (
                        <span
                          key={timeSlot}
                          className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-bold"
                        >
                          🕒 {timeLabels[timeSlot] || timeSlot}
                        </span>
                      ))}

                      {med.meal && (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold">
                          🍽️ {med.meal}
                        </span>
                      )}

                      {med.days && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          🗓️ {med.days}{' '}
                          {currentLang === 'en'
                            ? 'Days course'
                            : currentLang === 'mwr'
                            ? 'दिनां रो कोर्स'
                            : currentLang === 'gu'
                            ? 'દિવસનો કોર્સ'
                            : currentLang === 'ta'
                            ? 'நாட்கள் சிகிச்சை'
                            : currentLang === 'pa'
                            ? 'ਦਿਨਾਂ ਦਾ ਕੋਰਸ'
                            : 'दिन का कोर्स'}
                        </span>
                      )}
                    </div>

                    {/* Purpose */}
                    <div className="text-xs sm:text-sm text-slate-700 mb-2">
                      <b className="text-slate-900">{t.rxPurpose}</b>{' '}
                      {med.purpose}
                    </div>

                    {/* Side effects */}
                    {med.side_effects && (
                      <div className="text-xs text-slate-600 mb-2">
                        <b className="text-slate-800">{t.rxSideEffects}</b>{' '}
                        {med.side_effects}
                      </div>
                    )}

                    {/* Food cautions */}
                    {med.avoid_food && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-1.5">
                        <span className="shrink-0">🚫</span>
                        <div>
                          <b>{t.rxAvoidFood}</b> {med.avoid_food}
                        </div>
                      </div>
                    )}

                    {/* Drug cautions */}
                    {med.avoid_drugs && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-950 flex items-start gap-1.5">
                        <span className="shrink-0">⚠️</span>
                        <div>
                          <b>{t.rxAvoidDrugs}</b> {med.avoid_drugs}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Overall Warnings & Followup */}
              {parsedRx.warnings && parsedRx.warnings.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm">
                  <div className="font-bold flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{t.rxWarnings}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {parsedRx.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedRx.followUp && (
                <div className="mb-6 p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-medium">
                  🩺 <b>{t.rxFollowUp}:</b> {parsedRx.followUp}
                </div>
              )}

              {/* Bottom Actions: Speak Full Prescription & Save to Profile */}
              <div className="flex flex-wrap gap-3 items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={handleSpeakAll}
                  className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
                    isSpeakingAll
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-teal-700 hover:bg-teal-800 text-white shadow-md'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                  <span>
                    {isSpeakingAll ? t.stopAudioBtn : t.speakFullRx}
                  </span>
                </button>

                <button
                  onClick={handleSaveAndRemind}
                  className="px-6 py-3.5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
                >
                  <BookmarkCheck className="w-5 h-5" />
                  <span>{t.saveRxBtn}</span>
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold text-center animate-in fade-in">
                  {t.savedSuccess} ({ui.autoRemindSuccess})
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
