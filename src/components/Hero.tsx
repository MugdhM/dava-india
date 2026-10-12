import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../translations';
import { speakText, stopSpeech } from '../utils/speech';
import {
  Camera,
  Volume2,
  Calendar,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  HeartPulse,
} from 'lucide-react';

interface HeroProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onNavigate: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  currentLang,
  onLanguageChange,
  onNavigate,
}) => {
  const t = TRANSLATIONS[currentLang];
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const sampleVoiceText =
    currentLang === 'hi'
      ? 'पैरासिटामोल 650 मिलीग्राम। यह बुखार और बदन दर्द की दवाई है। सुबह और रात खाने के बाद एक गोली 5 दिन तक लें। ठंडी चीजों और खटाई से परहेज करें।'
      : currentLang === 'mwr'
      ? 'पैरासिटामोल 650 एमजी। आ ताव अर बदन दरद मेटण री दवाई है। सवेरे अर रात ने जीमण पाछे एक गोली 5 दिन लेवणी। खटाई नी खावणी।'
      : currentLang === 'gu'
      ? 'પેરાસિટામોલ 650 એમજી. આ તાવ અને શરીરના દુખાવા માટે છે. સવારે અને રાત્રે જમ્યા પછી એક ગોળી 5 દિવસ લો.'
      : currentLang === 'ta'
      ? 'பாராசிட்டமால் 650 மி.கி. காய்ச்சல் மற்றும் உடல் வலிக்கான மருந்து. காலை மற்றும் இரவு உணவுக்குப் பின் 5 நாட்கள் உட்கொள்ளவும்.'
      : currentLang === 'pa'
      ? 'ਪੈਰਾਸੀਟਾਮੋਲ 650 ਐਮਜੀ। ਇਹ ਬੁਖਾਰ ਅਤੇ ਦਰਦ ਲਈ ਹੈ। ਸਵੇਰੇ ਅਤੇ ਰਾਤ ਰੋਟੀ ਤੋਂ ਬਾਅਦ 5 ਦਿਨ ਲਓ।'
      : 'Paracetamol 650mg. This medicine is for fever and body ache. Take 1 tablet morning and night after food for 5 days.';

  const handleToggleSampleSpeech = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakText(sampleVoiceText, currentLang);
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 7000);
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-20 bg-linear-to-b from-teal-50/60 via-emerald-50/20 to-white border-b border-teal-100/60"
    >
      {/* Background radial glow accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-linear-to-br from-amber-200/40 to-teal-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 -ml-20 w-80 h-80 rounded-full bg-linear-to-tr from-teal-200/40 to-emerald-200/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Subtitle & Interactive CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 text-left"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-xs sm:text-sm font-bold shadow-xs mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{t.badgeText}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none mb-4">
              {t.heroTitlePrefix}{' '}
              <span className="bg-linear-to-r from-teal-600 via-emerald-600 to-amber-600 bg-clip-text text-transparent">
                {t.heroTitleHighlight}
              </span>
            </h1>

            {/* Detailed Description */}
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl mb-6">
              {t.heroDesc}
            </p>

            {/* Language Quick Switcher Pills */}
            <div className="mb-6 p-3 rounded-2xl bg-white/80 border border-teal-100 shadow-xs inline-block w-full sm:w-auto">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t.langsAvailable}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentLang === lang.code
                        ? 'bg-teal-700 text-white shadow-xs scale-105'
                        : 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200/70'
                    }`}
                  >
                    {lang.native}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4 items-center mb-8">
              <button
                onClick={() => onNavigate('reader')}
                className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-teal-600/30 hover:shadow-xl hover:scale-102 transition-all cursor-pointer flex items-center gap-2.5"
              >
                <Camera className="w-5 h-5 text-amber-200 animate-bounce" />
                <span>{t.heroUploadCta}</span>
              </button>

              <button
                onClick={() => onNavigate('appointments')}
                className="px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl bg-white border-2 border-teal-600 text-teal-800 hover:bg-teal-50 font-bold text-sm sm:text-base shadow-xs hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
              >
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>{t.heroAptCta}</span>
              </button>

              <button
                onClick={() => onNavigate('schemes')}
                className="px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 font-bold text-sm sm:text-base transition-all cursor-pointer flex items-center gap-2"
              >
                <Building2 className="w-5 h-5 text-amber-600" />
                <span>{t.heroSchemesCta}</span>
              </button>
            </div>

            {/* Trust highlights */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-teal-100 max-w-xl text-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  100% प्राइवेसी
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  सटीक AI दृष्टि
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  कस्टम अलार्म
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Animated Live Prescription Mockup with Voice Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative mx-auto max-w-md">
              {/* Decorative background cards */}
              <div className="absolute inset-0 bg-linear-to-tr from-teal-500/20 to-amber-500/20 rounded-3xl transform rotate-2 scale-102 filter blur-sm" />

              <div className="relative bg-white rounded-3xl p-5 sm:p-6 border border-teal-100 shadow-2xl">
                {/* Header ribbon */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🩺</span>
                    <div>
                      <div className="text-xs font-extrabold text-slate-800">
                        Dr. R. K. Singhal, MD
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Senior Physician • OPD No: 4092
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                    Rx Original
                  </span>
                </div>

                {/* Handwritten look-alike prescription slip */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed shadow-inner relative overflow-hidden">
                  <div className="text-amber-800/80 font-bold mb-1 text-[11px] tracking-wider uppercase">
                    Prescription Slip (पर्ची)
                  </div>
                  <div className="font-serif italic text-slate-700 text-sm sm:text-base space-y-1">
                    <p className="font-bold text-slate-900">
                      Rx — Tab. Paracetamol 650mg
                    </p>
                    <p className="text-xs text-slate-600">
                      1 - 0 - 1 × 5 Days (khane ke baad)
                    </p>
                    <p className="font-bold text-slate-900 mt-2">
                      Syp. Cough Relief 10ml
                    </p>
                    <p className="text-xs text-slate-600">
                      2 tsf TDS × 5 Days
                    </p>
                  </div>
                </div>

                {/* AI Audio Output Box with Pulse */}
                <div className="mt-4 p-4 rounded-2xl bg-linear-to-r from-teal-50 to-emerald-50 border border-teal-200 flex items-start gap-3.5">
                  <button
                    onClick={handleToggleSampleSpeech}
                    className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-all ${
                      isPlayingAudio
                        ? 'bg-amber-500 scale-110 shadow-amber-500/50 animate-pulse'
                        : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
                    }`}
                    title="आवाज़ में सुनें / Listen to Audio"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-teal-950 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        AI ऑडियो अनुवाद ({SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.native})
                      </span>
                      <span className="text-[10px] text-teal-700 font-bold">
                        {isPlayingAudio ? 'बोल रहा है...' : 'क्लिक करें'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 line-clamp-3 italic">
                      "{sampleVoiceText}"
                    </p>
                  </div>
                </div>

                {/* Quick Action Footer inside Card */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate('reader')}
                    className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>अपनी पर्ची डालें</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-400">
                    6 भाषाओं में उपलब्ध
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
