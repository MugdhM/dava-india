import React, { useState } from 'react';
import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../translations';
import {
  User,
  Mail,
  Lock,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  currentLang: LanguageCode;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; uid?: string; photoURL?: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentLang,
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const t = TRANSLATIONS[currentLang];

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('कृपया अपना पूरा नाम लिखें।');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('कृपया सही ईमेल पता लिखें।');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }

    const displayName = mode === 'signup' ? name.trim() : email.split('@')[0];
    const userObj = {
      name: displayName,
      email: email.trim(),
      uid: `local-${Date.now()}`,
    };

    localStorage.setItem('dawai_user', JSON.stringify(userObj));
    onLoginSuccess(userObj);
    onClose();
  };

  const handleGuestDemo = () => {
    const guestUser = {
      name: 'कार्तिक गहलोत (Demo)',
      email: 'kartikgehlot146@gmail.com',
      uid: 'demo-kartik-1',
    };
    localStorage.setItem('dawai_user', JSON.stringify(guestUser));
    onLoginSuccess(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-teal-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-teal-700" />
          </div>
          <h3 className="font-extrabold text-xl text-slate-900">
            {t.authTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {t.authSub}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            यह secure authentication नहीं है। Profile और स्वास्थ्य डेटा केवल इसी browser में सेव होगा।
          </p>
        </div>

        {/* Tab Toggle: Login vs Signup */}
        <div className="flex p-1 rounded-2xl bg-slate-100 mb-4">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.loginTab}
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.signupTab}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
          {mode === 'signup' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {t.nameLabel}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. रमेश कुमार"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-teal-500 text-xs sm:text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="उदा. patient@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-teal-500 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t.passLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="कम से कम 6 अक्षर"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-teal-500 text-xs sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-2xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm shadow-md shadow-teal-600/30 transition-all cursor-pointer"
          >
            {mode === 'login' ? t.authSubmitLogin : t.authSubmitSignup}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            onClick={handleGuestDemo}
            className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{t.guestDemoBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
