import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { LanguageCode } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentLang?: LanguageCode;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = adminId.trim().toUpperCase();
    const cleanPass = password.trim();

    // Verification check for Admin ID and Password:
    // ID: DAWAMITRA
    // Password: PHARMTECH@123
    if (cleanId === 'DAWAMITRA' && cleanPass === 'PHARMTECH@123') {
      setIsSuccess(true);
      sessionStorage.setItem('dawai_admin_logged_in', '1');
      setTimeout(() => {
        setIsSuccess(false);
        setAdminId('');
        setPassword('');
        onSuccess();
        onClose();
      }, 700);
    } else {
      setErrorMsg('अमान्य एडमिन क्रेडेंशियल्स! आईडी या पासवर्ड गलत है।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="बंद करें"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/70 px-3 py-1 rounded-full border border-amber-800">
            सुरक्षित एडमिन पोर्टल (Master Control)
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold mt-3 text-white">
            दवाईमित्र व्यवस्थापक लॉगिन
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            वेबसाइट सामग्री, योजनाएं, अपॉइंटमेंट और नोटिफिकेशन नियंत्रित करने हेतु लॉगिन करें।
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Indicator */}
        {isSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>सफलतापूर्वक सत्यापित! एडमिन कंट्रोल पैनल खोला जा रहा है...</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              व्यवस्थापक आईडी (Admin ID)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="व्यवस्थापक आईडी दर्ज करें..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm font-mono tracking-wider"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              पासवर्ड (Admin Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck={false}
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm"
              />
              {/* Eye Icon to Toggle Password Visibility */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                title={showPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-amber-400" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              <span>आंख के आइकन पर क्लिक करके पासवर्ड जांच सकते हैं</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSuccess}
            className="w-full py-3.5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:scale-101 active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>एडमिन डैशबोर्ड में प्रवेश करें</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            सुरक्षित एवं अधिकृत उपयोग हेतु • अनधिकृत प्रवेश पूर्णतया प्रतिबंधित है
          </p>
        </div>
      </div>
    </div>
  );
};
