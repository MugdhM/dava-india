import React from 'react';
import { LanguageCode } from '../types';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../translations';
import { Pill, Heart, Shield, PhoneCall } from 'lucide-react';

interface FooterProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentLang,
  onLanguageChange,
  onNavigate,
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center">
                <Pill className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                {t.appName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footerNote}
            </p>
            <div className="text-[11px] text-teal-400 font-semibold flex items-center gap-1.5 pt-1">
              <Shield className="w-3.5 h-3.5" />
              <span>प्राइवेसी-सुरक्षित • भारतीय स्वास्थ्य मिशन समर्थित</span>
            </div>
          </div>

          {/* Quick Section Links */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-3">
              मुख्य अनुभाग (Sections)
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('reader')}
                  className="hover:text-teal-400 cursor-pointer"
                >
                  📷 {t.navUpload}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('reminders')}
                  className="hover:text-teal-400 cursor-pointer"
                >
                  ⏰ {t.navReminders}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('assistant')}
                  className="hover:text-teal-400 cursor-pointer"
                >
                  🎙️ {t.navAssistant}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-teal-400 cursor-pointer"
                >
                  👤 {t.navRecords}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('appointments')}
                  className="hover:text-teal-400 cursor-pointer"
                >
                  📅 {t.navAppointments}
                </button>
              </li>
            </ul>
          </div>

          {/* Government Portals */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-3">
              सरकारी सेवाएँ (Govt Portals)
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://pmjay.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400"
                >
                  ↗ Ayushman Bharat (PM-JAY)
                </a>
              </li>
              <li>
                <a
                  href="https://abha.abdm.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400"
                >
                  ↗ ABHA Digital Health Card
                </a>
              </li>
              <li>
                <a
                  href="https://janaushadhi.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400"
                >
                  ↗ Pradhan Mantri Jan Aushadhi
                </a>
              </li>
              <li>
                <a
                  href="https://esanjeevani.mohfw.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400"
                >
                  ↗ eSanjeevani Teleconsultation
                </a>
              </li>
              <li>
                <a
                  href="https://aiimsjodhpur.edu.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400"
                >
                  ↗ AIIMS Jodhpur OPD Portal
                </a>
              </li>
            </ul>
          </div>

          {/* 6 Languages Switcher in Footer */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-3">
              भाषाएँ (Languages)
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    currentLang === lang.code
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lang.native}
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-900/60 text-xs">
              <span className="font-extrabold text-rose-300 block mb-0.5">
                🆘 आपातकालीन 108 / 112
              </span>
              <span className="text-[11px] text-slate-400">
                तुरंत सहायता हेतु निःशुल्क कॉल करें।
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Copyright */}
        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <p>
            ⚕️ <b>अस्वीकरण (Medical Disclaimer):</b> DawaiMitra केवल सूचनात्मक और
            दवाई समझने की सुविधा हेतु निर्मित है। यह किसी पंजीकृत डॉक्टर या
            फार्मासिस्ट की व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है।
          </p>
          <p>{t.copyright}</p>
        </div>
      </div>
    </footer>
  );
};
