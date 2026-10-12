import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../translations';

export const speakText = (text: string, lang: LanguageCode) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();

  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = langMeta.speechLang;
  utterance.rate = 0.88; // Slightly gentle pace for seniors and clarity
  utterance.pitch = 1.0;

  // Attempt to select an Indian voice if present
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().includes(langMeta.speechLang.toLowerCase()) ||
      v.lang.toLowerCase().includes('in') ||
      v.name.toLowerCase().includes('hindi') ||
      v.name.toLowerCase().includes('india')
  );
  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const playAudioChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
};
