import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../translations';
import { speakText, stopSpeech } from '../utils/speech';
import { chatAssistantService } from '../utils/geminiClient';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiAssistantProps {
  currentLang: LanguageCode;
  activeMedicines: string[];
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  currentLang,
  activeMedicines,
}) => {
  const t = TRANSLATIONS[currentLang];
  const langMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize welcome message whenever language changes
  useEffect(() => {
    const welcomeMessages: Record<LanguageCode, string> = {
      hi: 'नमस्ते! मैं आपका DawaiMitra AI स्वास्थ्य साथी हूँ। अपनी दवाइयों, खुराक, परहेज या किसी भी शंका के बारे में पूछिए।',
      en: 'Hello! I am your DawaiMitra AI Health Companion. Feel free to ask any questions about your medicines, dosage, diet, or symptoms.',
      mwr: 'राम राम सा! म्हें आपरो DawaiMitra साथी हूँ। आपरी दवाई, खुराक या परहेज बारे कीं भी पूछ सको सा।',
      gu: 'નમસ્તે! હું તમારો DawaiMitra AI સાથી છું. તમારી દવાઓ, માત્રા અથવા પરેજી વિશે કંઈપણ પૂછો.',
      ta: 'வணக்கம்! நான் உங்கள் மருந்துமித்ரா AI நலத் தோழன். மருந்துகள், உணவு முறைகள் குறித்து எதையும் கேளுங்கள்.',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ DawaiMitra AI ਸਿਹਤ ਸਾਥੀ ਹਾਂ। ਦਵਾਈਆਂ ਜਾਂ ਪਰਹੇਜ਼ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ ਜੀ।',
    };

    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: welcomeMessages[currentLang] || welcomeMessages.hi,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [currentLang]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle Speech Recognition (Microphone input)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('आपके ब्राउज़र में बोलकर पूछने की सुविधा उपलब्ध नहीं है। कृपया टाइप करें।');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = langMeta.speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await chatAssistantService(
        text,
        currentLang,
        historyPayload,
        activeMedicines
      );

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Automatically speak the response in patient's selected language
      speakText(reply, currentLang);
      setSpeakingMsgId(botMsg.id);
      setTimeout(() => setSpeakingMsgId(null), 10000);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = (msg: ChatMessage) => {
    if (speakingMsgId === msg.id) {
      stopSpeech();
      setSpeakingMsgId(null);
      return;
    }
    stopSpeech();
    setSpeakingMsgId(msg.id);
    speakText(msg.content, currentLang);
    setTimeout(() => setSpeakingMsgId(null), 10000);
  };

  const handleSuggestedClick = (q: string) => {
    setInputText(q);
    handleSendMessage(q);
  };

  return (
    <section
      id="assistant"
      className="py-14 sm:py-20 bg-linear-to-b from-white via-teal-50/20 to-white border-b border-teal-100/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
            24×7 AI डॉक्टर साथी
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2">
            {t.aiTitle}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {t.aiSub}
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-teal-100 shadow-xl overflow-hidden flex flex-col h-[580px] sm:h-[620px]">
          {/* Header Bar */}
          <div className="px-5 py-4 bg-linear-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Bot className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base leading-tight">
                  दवाईमित्र AI साथी ({langMeta.native})
                </h4>
                <span className="text-[11px] text-teal-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  ऑनलाइन • 6 भाषाओं में दक्ष
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                stopSpeech();
                setMessages((prev) => prev.slice(0, 1));
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white transition-colors"
              title="चैट रीसेट करें"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-linear-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                      : 'bg-white border border-teal-100 text-slate-800 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] ${
                      m.role === 'user' ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => handleSpeakMessage(m)}
                        className="ml-2 font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                        title="आवाज़ में सुनें"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>
                          {speakingMsgId === m.id ? 'बोल रहा है...' : 'सुनें'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-teal-100 rounded-2xl p-4 shadow-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce delay-150" />
                  <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce delay-300" />
                  <span className="text-xs text-slate-500 ml-1">
                    उत्तर तैयार हो रहा है...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">
              {currentLang === 'en' ? 'Quick Qs:' : 'सुझाव:'}
            </span>
            {(
              (currentLang === 'en'
                ? [
                    'I have a headache, what should I do?',
                    'When to take Paracetamol for fever?',
                    'Remedies for stomach gas & acidity?',
                    'What if I miss a medicine dose?',
                    'Precautions for cold & cough?',
                  ]
                : currentLang === 'mwr'
                ? [
                    'माथो घणो दरद करे है, कांई करूँ?',
                    'ताव में पैरासिटामोल कदे लेवणी?',
                    'पेट में गैस रो कांई उपाय है?',
                    'दवाई लेवणी भूल ग्या तो कांई करां?',
                    'खांसी-जुकाम में कांई परहेज राखणो?',
                  ]
                : currentLang === 'gu'
                ? [
                    'માથું દુખે છે, શું કરવું?',
                    'તાવમાં પેરાસિટામોલ ક્યારે લેવી?',
                    'ગેસ અને એસિડિટી માટે શું કરવું?',
                    'દવા લેવાનું ભૂલી જવાય તો?',
                    'શરદી-ઉધરસમાં શું પરેજી રાખવી?',
                  ]
                : currentLang === 'ta'
                ? [
                    'தலைவலிக்கு என்ன செய்ய வேண்டும்?',
                    'காய்ச்சலுக்கு எப்போது மருந்து எடுக்க வேண்டும்?',
                    'அசிடிட்டிக்கு எளிய தீர்வு என்ன?',
                    'மருந்தை மறந்தால் என்ன செய்ய வேண்டும்?',
                  ]
                : currentLang === 'pa'
                ? [
                    'ਸਿਰਦਰਦ ਹੋ ਰਿਹਾ ਹੈ, ਕੀ ਕਰਾਂ?',
                    'ਬੁਖਾਰ ਵਿੱਚ ਪੈਰਾਸੀਟਾਮੋਲ ਕਦੋਂ ਲਈਏ?',
                    'ਪੇਟ ਵਿੱਚ ਗੈਸ ਅਤੇ ਤੇਜ਼ਾਬ ਦਾ ਹੱਲ?',
                    'ਜੇ ਦਵਾਈ ਭੁੱਲ ਜਾਈਏ ਤਾਂ ਕੀ ਕਰੀਏ?',
                  ]
                : [
                    'सिरदर्द हो रहा है, क्या करूँ?',
                    'बुखार में पैरासिटामोल कब लें?',
                    'पेट में गैस और जलन के उपाय?',
                    'अगर दवा की खुराक भूल जाएं तो?',
                    'खांसी-जुकाम में क्या परहेज रखें?',
                  ])
            ).map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedClick(sq)}
                className="px-3 py-1 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200 shrink-0 transition-colors cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Input & Voice Controls Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-teal-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Mic button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                }`}
                title={isListening ? 'सुन रहा हूँ...' : t.aiMic}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? t.aiListening : t.aiPlaceholder}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-xs sm:text-sm outline-none transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-3 sm:px-5 rounded-2xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{t.aiSend}</span>
              </button>
            </form>

            <div className="mt-2 text-[10px] text-slate-400 text-center">
              {t.aiDisclaimer}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
