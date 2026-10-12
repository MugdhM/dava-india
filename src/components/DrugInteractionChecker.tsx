import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../translations';
import { speakText, stopSpeech } from '../utils/speech';
import {
  POPULAR_MEDICINES,
  evaluateClinicalInteractions,
  InteractionReport,
} from '../utils/clinicalInteractions';
import { checkInteractionsService } from '../utils/geminiClient';
import {
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  FlaskConical,
  Plus,
  X,
  Sparkles,
  Info,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Utensils,
  Search,
  Check,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

interface DrugInteractionCheckerProps {
  currentLang: LanguageCode;
  savedMedicines: string[];
  onAddReminder?: (med: { name: string; times?: string[]; days?: number }) => void;
}

export const DrugInteractionChecker: React.FC<DrugInteractionCheckerProps> = ({
  currentLang,
  savedMedicines,
  onAddReminder,
}) => {
  const t = TRANSLATIONS[currentLang];

  const [inputMed, setInputMed] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<string[]>([
    'Paracetamol 650mg',
    'Pantoprazole 40mg',
  ]);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<InteractionReport | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<typeof POPULAR_MEDICINES>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addedReminderSuccess, setAddedReminderSuccess] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter autocomplete suggestions based on input
  useEffect(() => {
    const q = inputMed.trim().toLowerCase();
    if (q.length >= 2) {
      const filtered = POPULAR_MEDICINES.filter(
        (m) =>
          (m.brandOrName.toLowerCase().includes(q) ||
            m.generic.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)) &&
          !selectedMeds.includes(m.brandOrName)
      ).slice(0, 6);
      setSearchSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputMed, selectedMeds]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddMed = (name: string) => {
    const clean = name.trim();
    if (!clean) return;

    // Check if input has commas for multiple medicines
    if (clean.includes(',')) {
      const parts = clean
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p && !selectedMeds.includes(p));
      if (parts.length > 0) {
        setSelectedMeds((prev) => [...prev, ...parts]);
        setInputMed('');
        setResult(null);
        setShowSuggestions(false);
        return;
      }
    }

    if (!selectedMeds.includes(clean)) {
      setSelectedMeds((prev) => [...prev, clean]);
      setInputMed('');
      setResult(null);
      setShowSuggestions(false);
    }
  };

  const handleRemoveMed = (index: number) => {
    setSelectedMeds((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleClearAll = () => {
    setSelectedMeds([]);
    setResult(null);
    setInputMed('');
    stopSpeech();
    setIsSpeaking(false);
  };

  const handleLoadTestPair = (medA: string, medB: string) => {
    setSelectedMeds([medA, medB]);
    setResult(null);
    setInputMed('');
    stopSpeech();
    setIsSpeaking(false);
  };

  const handleCheckInteractions = async () => {
    if (selectedMeds.length < 2) return;

    setIsChecking(true);
    setResult(null);
    stopSpeech();
    setIsSpeaking(false);

    try {
      const data = await checkInteractionsService(selectedMeds, currentLang);
      setResult(data);
    } catch (err) {
      console.error('Interaction check failure, using clinical engine:', err);
      const fallback = evaluateClinicalInteractions(selectedMeds, currentLang);
      setResult(fallback);
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    if (!result) return;
    let text = `${result.summary}। `;
    result.items.forEach((item) => {
      text += `${item.pair}। जोखिम स्तर: ${item.risk === 'high' ? 'उच्च जोखिम' : item.risk === 'medium' ? 'मध्यम' : 'कम'}। ${item.advice}। `;
    });
    if (result.foodCautions && result.foodCautions.length) {
      text += `भोजन व पेय सावधानियाँ: ${result.foodCautions.join('। ')}।`;
    }
    speakText(text, currentLang);
    setIsSpeaking(true);
  };

  return (
    <section
      id="checker"
      className="py-14 sm:py-20 bg-linear-to-b from-teal-50/30 via-white to-slate-50/40 border-b border-teal-100/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-300 text-teal-800 text-xs font-extrabold uppercase tracking-wider mb-3">
            <FlaskConical className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
            <span>AI व क्लिनिकल फार्माकोलॉजी सुरक्षा</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t.checkerTitle}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2.5 leading-relaxed">
            {t.checkerSub}
          </p>
        </div>

        {/* Main Checker Container (Matches CSS Selector target) */}
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-9 border border-teal-100 shadow-xl shadow-teal-900/5 transition-all">
          
          {/* Header Row with Active Count and Reset */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
              <span className="text-xs sm:text-sm font-bold text-slate-700">
                दवाइयाँ ({selectedMeds.length}):
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                (कम से कम 2 दवाइयाँ जोड़ें)
              </span>
            </div>

            {selectedMeds.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>सभी हटाएं</span>
              </button>
            )}
          </div>

          {/* Quick-test Preset Scenarios */}
          <div className="mb-5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              ⚡ 1-क्लिक त्वरित परीक्षण (Quick Test Pairs):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleLoadTestPair('Paracetamol 650mg', 'Pantoprazole 40mg')}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
                title="सुरक्षित मेल"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Paracetamol + Pantoprazole</span>
                <span className="text-[10px] text-emerald-600 font-normal">(सुरक्षित)</span>
              </button>

              <button
                onClick={() => handleLoadTestPair('Aspirin 75mg (Ecosprin)', 'Warfarin 5mg')}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 flex items-center gap-1.5 shadow-2xs hover:border-rose-300 transition-all cursor-pointer"
                title="उच्च ब्लीडिंग जोखिम"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Aspirin + Warfarin</span>
                <span className="text-[10px] text-rose-600 font-normal">(⚠️ उच्च जोखिम)</span>
              </button>

              <button
                onClick={() => handleLoadTestPair('Ibuprofen 400mg', 'Aspirin 75mg (Ecosprin)')}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 flex items-center gap-1.5 shadow-2xs hover:border-rose-300 transition-all cursor-pointer"
                title="पेट में अल्सर का खतरा"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Ibuprofen + Aspirin</span>
                <span className="text-[10px] text-rose-600 font-normal">(⚠️ अल्सर खतरा)</span>
              </button>

              <button
                onClick={() => handleLoadTestPair('Metformin 500mg', 'Glimepiride 1mg')}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200 flex items-center gap-1.5 shadow-2xs hover:border-amber-300 transition-all cursor-pointer"
                title="शुगर लो होने की निगरानी"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Metformin + Glimepiride</span>
                <span className="text-[10px] text-amber-700 font-normal">(निगरानी)</span>
              </button>
            </div>
          </div>

          {/* Active Prescriptions from Patient Profile / Reminders */}
          {savedMedicines && savedMedicines.length > 0 && (
            <div className="mb-5 p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/80">
              <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block mb-2">
                📋 आपकी पर्ची की सक्रिय दवाइयाँ (क्लिक करके जोड़ें):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {savedMedicines.map((m, i) => {
                  const isAlreadyAdded = selectedMeds.includes(m);
                  return (
                    <button
                      key={i}
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddMed(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                        isAlreadyAdded
                          ? 'bg-teal-100/60 text-teal-800 border-teal-300 opacity-60 cursor-default'
                          : 'bg-white hover:bg-teal-100 text-teal-900 border-teal-300 hover:scale-102 cursor-pointer shadow-2xs'
                      }`}
                    >
                      <span>{isAlreadyAdded ? '✓' : '➕'}</span>
                      <span>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input field with Smart Autocomplete */}
          <div className="relative mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              दवाई का नाम लिखें (Any Medicine Name):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMed}
                  onChange={(e) => setInputMed(e.target.value)}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMed(inputMed);
                    }
                  }}
                  placeholder="उदा. Paracetamol, Dolo 650, Aspirin, Metformin, Shelcal..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-teal-500 focus:ring-3 focus:ring-teal-100 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={() => handleAddMed(inputMed)}
                disabled={!inputMed.trim()}
                className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:shadow-teal-700/20"
              >
                <Plus className="w-4 h-4" />
                <span>जोड़ें</span>
              </button>
            </div>

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {showSuggestions && searchSuggestions.length > 0 && (
                <motion.div
                  ref={suggestionsRef}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute z-20 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-teal-200 shadow-xl overflow-hidden"
                >
                  <div className="p-1.5 divide-y divide-slate-100">
                    {searchSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddMed(item.brandOrName)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-teal-50 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-teal-600 font-bold group-hover:text-teal-800">
                            💊 {item.brandOrName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({item.category})
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-teal-700 group-hover:underline">
                          + जोड़ें
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected Medicine Pills Container */}
          <div className="mb-6">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              जाँच के लिए चुनी गई दवाइयाँ:
            </span>
            <div className="flex flex-wrap gap-2 min-h-[50px] p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 items-center">
              {selectedMeds.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>
                    यहाँ कोई दवाई नहीं है। ऊपर नाम लिखकर या त्वरित परीक्षण बटन दबाकर दवाइयाँ जोड़ें।
                  </span>
                </div>
              ) : (
                selectedMeds.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-700 transition-colors"
                  >
                    <span>💊</span>
                    <span>{m}</span>
                    <button
                      onClick={() => handleRemoveMed(i)}
                      className="ml-1 hover:text-rose-200 p-0.5 rounded-full hover:bg-teal-800/60 transition-colors cursor-pointer"
                      title="हटाएं"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
            {selectedMeds.length === 1 && (
              <p className="text-[11px] text-amber-700 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                <span>⚠️</span>
                <span>टकराव जाँचने के लिए कम से कम 1 और दवाई जोड़ें (कुल 2 दवाइयाँ)।</span>
              </p>
            )}
          </div>

          {/* Submit Action Button */}
          <div className="text-center mb-6">
            <button
              onClick={handleCheckInteractions}
              disabled={selectedMeds.length < 2 || isChecking}
              className="px-8 py-4 rounded-2xl bg-linear-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-teal-700/25 hover:shadow-xl hover:scale-101 active:scale-99 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2.5 mx-auto"
            >
              <FlaskConical className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>
                {isChecking
                  ? 'AI फार्माकोलॉजिकल जाँच जारी है...'
                  : `${t.checkerBtn} (${selectedMeds.length} दवाइयाँ)`}
              </span>
            </button>
          </div>

          {/* Loading Animation Card */}
          {isChecking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-3xl bg-linear-to-r from-teal-50 to-emerald-50 border border-teal-200 text-center mb-6"
            >
              <div className="inline-block p-3 rounded-2xl bg-white shadow-md text-teal-600 mb-3 animate-bounce">
                <FlaskConical className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 mb-1">
                क्लिनिकल डेटाबेस व Gemini AI से जाँच हो रही है
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                चुनी गई दवाइयों के बीच एंजाइम टकराव, ब्लीडिंग जोखिम और खान-पान सावधानियों का विश्लेषण किया जा रहा है...
              </p>
            </motion.div>
          )}

          {/* Comprehensive Interaction Result Card */}
          <AnimatePresence>
            {result && !isChecking && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-6 rounded-3xl border-2 transition-all ${
                  result.level === 'high'
                    ? 'bg-rose-50/50 border-rose-300 shadow-rose-900/5'
                    : result.level === 'medium'
                    ? 'bg-amber-50/50 border-amber-300 shadow-amber-900/5'
                    : 'bg-emerald-50/40 border-emerald-300 shadow-emerald-900/5'
                }`}
              >
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-200/70">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs sm:text-sm border shadow-2xs ${
                      result.level === 'high'
                        ? 'bg-rose-600 text-white border-rose-700'
                        : result.level === 'medium'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-emerald-600 text-white border-emerald-700'
                    }`}
                  >
                    {result.level === 'high' ? (
                      <AlertTriangle className="w-4 h-4 text-white" />
                    ) : result.level === 'medium' ? (
                      <ShieldAlert className="w-4 h-4 text-white" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-white" />
                    )}
                    <span>
                      {result.level === 'high'
                        ? '🚫 उच्च जोखिम: साथ न लें (High Risk Interaction)'
                        : result.level === 'medium'
                        ? '⚠️ मध्यम सावधानी आवश्यक (Moderate Precaution)'
                        : '✅ सुरक्षित संयोजन (Safe to Take Together)'}
                    </span>
                  </div>

                  {/* Audio Listen Button */}
                  <button
                    onClick={handleToggleSpeak}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
                      isSpeaking
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-white hover:bg-teal-50 text-teal-800 border border-teal-300'
                    }`}
                    title={isSpeaking ? 'आवाज़ बंद करें' : 'परिणाम सुनें'}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>रोकें</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-teal-600" />
                        <span>🔊 सुनें</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Overall Summary */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs mb-5">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    चिकित्सीय सारांश (Clinical Summary):
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                {/* Pair-by-Pair Breakdown */}
                {result.items && result.items.length > 0 && (
                  <div className="space-y-3 mb-5">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                      प्रत्येक दवा का आपस में विश्लेषण (Detailed Pairwise Breakdown):
                    </span>

                    {result.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                          <b className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>💊</span>
                            <span>{it.pair}</span>
                          </b>
                          <span
                            className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] uppercase tracking-wide border ${
                              it.risk === 'high'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : it.risk === 'medium'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            जोखिम: {it.risk.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {it.advice}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dietary Precautions Card */}
                {result.foodCautions && result.foodCautions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-100/60 border border-amber-300 text-xs sm:text-sm text-amber-950 mb-5">
                    <div className="flex items-center gap-1.5 font-bold mb-2">
                      <Utensils className="w-4 h-4 text-amber-800" />
                      <span>भोजन व पेय सावधानियाँ (Dietary Precautions):</span>
                    </div>
                    <ul className="space-y-1.5 pl-5 list-disc">
                      {result.foodCautions.map((fc, i) => (
                        <li key={i} className="leading-relaxed">
                          {fc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Doctor Advisory Footer */}
                <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-[11px] sm:text-xs text-slate-600 flex items-start gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <p>
                    <b>महत्वपूर्ण नोट:</b> यह जानकारी AI व क्लिनिकल डेटाबेस पर आधारित है। डॉक्टर द्वारा पहले से लिखी गई आवश्यक दवा को कभी भी बिना डॉक्टर की अनुमति के खुद से बंद न करें।
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
