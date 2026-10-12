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
  Database,
  Loader2,
} from 'lucide-react';
import { signInWithGoogle } from '../firebase/authService';

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
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoadingGoogle(true);
    try {
      const user = await signInWithGoogle();
      const userObj = {
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        uid: user.uid,
        photoURL: user.photoURL || '',
      };
      localStorage.setItem('dawai_user', JSON.stringify(userObj));
      onLoginSuccess(userObj);
      onClose();
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('लॉगिन विंडो बंद कर दी गई। कृपया पुनः प्रयास करें।');
      } else {
        setErrorMsg(err.message || 'Firebase लॉगिन विफल रहा। कृपया पुनः प्रयास करें।');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

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

          {/* Firebase Connected Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firebase Console Connected (Firestore & Auth)</span>
          </div>
        </div>

        {/* Primary Action: Google Sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border-2 border-slate-200 hover:border-teal-500 shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 mb-5"
        >
          {loadingGoogle ? (
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google खाते से साइन-इन करें (Firebase)</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase">या ईमेल द्वारा</span>
          <div className="flex-1 h-px bg-slate-200"></div>
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
