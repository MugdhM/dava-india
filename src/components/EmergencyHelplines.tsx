import React from 'react';
import { motion } from 'motion/react';
import { LanguageCode } from '../types';
import { TRANSLATIONS, EMERGENCY_NUMBERS } from '../translations';
import { Phone, PhoneCall, ShieldAlert, HeartPulse } from 'lucide-react';

interface EmergencyHelplinesProps {
  currentLang: LanguageCode;
}

export const EmergencyHelplines: React.FC<EmergencyHelplinesProps> = ({
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <section
      id="emergency"
      className="py-14 sm:py-20 bg-linear-to-b from-rose-50/40 via-red-50/20 to-white border-b border-rose-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-rose-700 bg-rose-100/80 px-3 py-1 rounded-full border border-rose-200">
            24×7 आपातकालीन सहायता
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2 flex items-center justify-center gap-2">
            <span>{t.emgTitle}</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {t.emgSub}
          </p>
        </div>

        {/* Emergency Numbers Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EMERGENCY_NUMBERS.map((emg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="bg-white rounded-3xl p-6 border-2 border-rose-100 hover:border-rose-300 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{emg.icon}</span>
                  <div className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wider">
                    मुफ़्त / 24×7
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tight group-hover:scale-105 inline-block transition-transform">
                    {emg.number}
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1">
                    {emg.title[currentLang] || emg.title.hi}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {emg.desc[currentLang] || emg.desc.hi}
                </p>
              </div>

              <a
                href={`tel:${emg.number}`}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-sm sm:text-base shadow-md shadow-rose-600/30 hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <PhoneCall className="w-5 h-5 animate-pulse" />
                <span>अभी कॉल करें ({emg.number})</span>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
