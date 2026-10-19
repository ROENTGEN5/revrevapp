import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Palette, Check } from 'lucide-react';
import { isSoundEnabled, toggleSound, playChoiceSound } from '../utils/soundEffects';
import { THEMES, getTheme, applyTheme } from '../utils/theme';

/**
 * Floating Material You "Quick Settings" pill: sound mute toggle + accent color picker.
 */
export default function QuickSettings() {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [theme, setTheme] = useState(getTheme());
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onChange = (e) => setSoundOn(Boolean(e.detail));
    window.addEventListener('quizforge_sound_change', onChange);
    return () => window.removeEventListener('quizforge_sound_change', onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const handleToggleSound = () => {
    const nowOn = toggleSound();
    setSoundOn(nowOn);
    if (nowOn) playChoiceSound(); // audible confirmation when unmuting
  };

  const handlePickTheme = (id) => {
    applyTheme(id);
    setTheme(id);
    playChoiceSound();
  };

  return (
    <div ref={wrapRef} className="fixed top-3 right-3 z-50 select-none font-sans">
      <div className="flex items-center gap-1 p-1 rounded-full bg-[#1D2024]/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <button
          id="sound-toggle"
          type="button"
          onClick={handleToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute sounds' : 'Unmute sounds'}
          title={soundOn ? 'Sound on — tap to mute' : 'Sound off — tap to unmute'}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            soundOn
              ? 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border-[color:var(--accent)]/30'
              : 'bg-[#272A2F] text-[#8E9196] border-white/10'
          }`}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{soundOn ? 'Sound' : 'Muted'}</span>
        </button>

        <button
          id="theme-toggle"
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Change accent color"
          title="Accent color"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold transition-all cursor-pointer border bg-[#272A2F] text-[#E2E2E6] border-white/10 hover:bg-[#32353A]"
        >
          <Palette className="w-4 h-4 text-[color:var(--accent)]" />
          <span className="hidden sm:inline">Theme</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 p-3 rounded-[24px] bg-[#1D2024] border border-white/10 shadow-2xl w-56"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E9196] mb-2.5 px-1">
              Accent color
            </p>
            <div className="flex items-center justify-between gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handlePickTheme(t.id)}
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={theme === t.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all border-2 ${
                    theme === t.id ? 'border-white scale-110' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: t.color }}
                >
                  {theme === t.id && <Check className="w-4 h-4 text-black/70 stroke-[3]" />}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-[#C4C7C5] mt-2.5 px-1">
              {THEMES.find((t) => t.id === theme)?.label}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
