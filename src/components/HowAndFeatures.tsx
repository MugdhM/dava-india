import React from 'react';
import { motion } from 'motion/react';
import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../translations';
import {
  Camera,
  Cpu,
  Volume2,
  FileText,
  AlertTriangle,
  Clock,
  Globe2,
  Mic,
  Activity,
  CalendarDays,
  Building,
  CheckCircle2,
  ShieldCheck,
  Type,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

interface HowAndFeaturesProps {
  currentLang: LanguageCode;
  onNavigate: (sectionId: string) => void;
}

export const HowAndFeatures: React.FC<HowAndFeaturesProps> = ({
  currentLang,
  onNavigate,
}) => {
  const t = TRANSLATIONS[currentLang];

  const steps = [
    {
      num: '1',
      title: t.step1Title,
      desc: t.step1Desc,
      icon: <Camera className="w-8 h-8 text-white" />,
      color: 'from-teal-500 to-emerald-600',
    },
    {
      num: '2',
      title: t.step2Title,
      desc: t.step2Desc,
      icon: <Cpu className="w-8 h-8 text-white" />,
      color: 'from-amber-500 to-orange-600',
    },
    {
      num: '3',
      title: t.step3Title,
      desc: t.step3Desc,
      icon: <Volume2 className="w-8 h-8 text-white" />,
      color: 'from-blue-500 to-indigo-600',
    },
  ];

  const features = [
    {
      icon: <FileText className="w-6 h-6 text-teal-600" />,
      title: t.feat1Title,
      desc: t.feat1Desc,
      tag: 'विस्तृत विवरण',
      action: 'reader',
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
      title: t.feat2Title,
      desc: t.feat2Desc,
      tag: 'सुरक्षा जाँच',
      action: 'checker',
    },
    {
      icon: <Clock className="w-6 h-6 text-indigo-600" />,
      title: t.feat3Title,
      desc: t.feat3Desc,
      tag: 'कस्टम अलार्म',
      action: 'reminders',
    },
    {
      icon: <Globe2 className="w-6 h-6 text-emerald-600" />,
      title: t.feat4Title,
      desc: t.feat4Desc,
      tag: '6 भाषाएँ',
      action: 'reader',
    },
    {
      icon: <Mic className="w-6 h-6 text-purple-600" />,
      title: t.feat5Title,
      desc: t.feat5Desc,
      tag: 'वॉइस चैट',
      action: 'assistant',
    },
    {
      icon: <Activity className="w-6 h-6 text-rose-500" />,
      title: t.feat6Title,
      desc: t.feat6Desc,
      tag: 'बीपी व शुगर',
      action: 'dashboard',
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-blue-600" />,
      title: t.feat7Title,
      desc: t.feat7Desc,
      tag: 'एम्स ओपीडी',
      action: 'appointments',
    },
    {
      icon: <PhoneCall className="w-6 h-6 text-red-600" />,
      title: t.feat8Title,
      desc: t.feat8Desc,
      tag: '108 / 112',
      action: 'emergency',
    },
  ];

  return (
    <>
      {/* 3 Easy Steps Section */}
      <section
        id="how"
        className="py-14 sm:py-20 bg-linear-to-b from-white to-teal-50/40 border-b border-teal-100/70"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
              आसान प्रक्रिया (How It Works)
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-3">
              {t.howTitle}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t.howSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-md hover:shadow-xl transition-all group hover:-translate-y-1.5"
              >
                {/* Step badge */}
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-linear-to-tr ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-4xl font-black text-slate-200 group-hover:text-teal-200 transition-colors">
                    0{step.num}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section
        id="features"
        className="py-14 sm:py-20 bg-white border-b border-teal-100/70"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
              मुख्य खूबियाँ (Features)
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-3">
              {t.featTitle}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t.featSub}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (idx % 4) * 0.1 }}
                onClick={() => onNavigate(f.action)}
                className="bg-teal-50/30 hover:bg-white rounded-3xl p-5 sm:p-6 border border-teal-100/80 hover:border-teal-300 shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-teal-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-teal-100/60 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:underline">
                  <span>उपयोग करें</span>
                  <span>→</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
