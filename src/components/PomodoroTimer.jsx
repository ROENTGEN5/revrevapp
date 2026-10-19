import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Timer,
  Coffee,
  Sparkles,
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  soundEnabled: true,
  autoStartBreaks: false,
};

// ─── Web Audio Chime Generator ───────────────────────────────────────
function playPomodoroChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Bright chime)

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0, now + index * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + index * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.85);
    });
  } catch (err) {
    console.warn('Audio chime playback omitted:', err);
  }
}

export default function PomodoroTimer() {
  // Saved settings & stats
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('quizforge_pomodoro_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [completedSessions, setCompletedSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('quizforge_pomodoro_sessions');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [mode, setMode] = useState('work'); // 'work' | 'shortBreak' | 'longBreak'
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('quizforge_pomodoro_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('quizforge_pomodoro_sessions', completedSessions.toString());
  }, [completedSessions]);

  // Update timer target when mode or settings change (if timer is stopped)
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'work') setTimeLeft(settings.workMinutes * 60);
      else if (mode === 'shortBreak') setTimeLeft(settings.shortBreakMinutes * 60);
      else if (mode === 'longBreak') setTimeLeft(settings.longBreakMinutes * 60);
    }
  }, [settings, mode, isRunning]);

  // Countdown timer effect
  useEffect(() => {
    let timerId = null;

    if (isRunning && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (settings.soundEnabled) {
        playPomodoroChime();
      }

      if (mode === 'work') {
        const nextSessions = completedSessions + 1;
        setCompletedSessions(nextSessions);
        if (nextSessions % 4 === 0) {
          setMode('longBreak');
          setTimeLeft(settings.longBreakMinutes * 60);
        } else {
          setMode('shortBreak');
          setTimeLeft(settings.shortBreakMinutes * 60);
        }
      } else {
        setMode('work');
        setTimeLeft(settings.workMinutes * 60);
      }

      if (!settings.autoStartBreaks) {
        setIsRunning(false);
      }
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRunning, timeLeft, mode, settings, completedSessions]);

  const togglePlay = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'work') setTimeLeft(settings.workMinutes * 60);
    else if (mode === 'shortBreak') setTimeLeft(settings.shortBreakMinutes * 60);
    else if (mode === 'longBreak') setTimeLeft(settings.longBreakMinutes * 60);
  };

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'work') setTimeLeft(settings.workMinutes * 60);
    else if (newMode === 'shortBreak') setTimeLeft(settings.shortBreakMinutes * 60);
    else if (newMode === 'longBreak') setTimeLeft(settings.longBreakMinutes * 60);
  };

  const getTotalDuration = () => {
    if (mode === 'work') return settings.workMinutes * 60;
    if (mode === 'shortBreak') return settings.shortBreakMinutes * 60;
    return settings.longBreakMinutes * 60;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = getTotalDuration();
  const progressPercent = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;

  // Google Pixel Material You Mode Colors
  const modeColors = {
    work: {
      accent: '#A8E8BC', // Pixel Mint
      glow: 'rgba(168, 232, 188, 0.4)',
      bgPill: 'bg-[#1B5238] text-[#A8E8BC] border-[#A8E8BC]/30',
      stroke: '#A8E8BC',
      onAccent: '#003822',
    },
    shortBreak: {
      accent: '#A8C7FA', // Pixel Sky Blue
      glow: 'rgba(168, 199, 250, 0.4)',
      bgPill: 'bg-[#1E4378] text-[#A8C7FA] border-[#A8C7FA]/30',
      stroke: '#A8C7FA',
      onAccent: '#043265',
    },
    longBreak: {
      accent: '#D0BCFF', // Pixel Lavender
      glow: 'rgba(208, 188, 255, 0.4)',
      bgPill: 'bg-[#4A4458] text-[#D0BCFF] border-[#D0BCFF]/30',
      stroke: '#D0BCFF',
      onAccent: '#381E72',
    },
  };

  const activeColor = modeColors[mode];

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ─── MINIMIZED FLOATING PIXEL PILL ─── */
          <motion.div
            key="pill"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl bg-[#1D2024] border border-white/10 cursor-pointer hover:border-[#A8E8BC]/30 transition-all group backdrop-blur-xl"
            onClick={() => setIsExpanded(true)}
          >
            <div className="relative flex items-center justify-center">
              {/* Pulse effect when running */}
              {isRunning && (
                <span
                  className="absolute inset-0 rounded-full animate-ping opacity-30"
                  style={{ backgroundColor: activeColor.stroke }}
                />
              )}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: activeColor.stroke, color: activeColor.onAccent }}
              >
                {mode === 'work' ? (
                  <Timer className="w-4 h-4" />
                ) : (
                  <Coffee className="w-4 h-4" />
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#8E9196] leading-none">
                {mode === 'work' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </span>
              <span className="text-sm font-bold text-[#E2E2E6] tracking-wider font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Quick Play/Pause inside pill */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="ml-1 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#E2E2E6] transition"
              title={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            {/* Expand indicator */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="p-1 text-[#8E9196] group-hover:text-[#E2E2E6] transition"
              title="Expand Timer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          /* ─── EXPANDED PIXEL DIALOG CARD ─── */
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="w-80 sm:w-96 rounded-[32px] bg-[#1D2024] p-6 shadow-2xl border border-white/10 relative overflow-hidden backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A8E8BC]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E9196]">
                  Pixel Focus Timer
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`p-2 rounded-full transition ${
                    isSettingsOpen
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 hover:bg-white/15 text-[#8E9196] hover:text-[#E2E2E6]'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-[#8E9196] hover:text-[#E2E2E6] transition"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#16191D] p-1 rounded-full mb-6 relative border border-white/5">
              {[
                { id: 'work', label: 'Focus', icon: Timer },
                { id: 'shortBreak', label: 'Short Break', icon: Coffee },
                { id: 'longBreak', label: 'Long Break', icon: Coffee },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => switchMode(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-full transition-all relative z-10 ${
                      active ? 'text-[#003822] font-bold' : 'text-[#8E9196] hover:text-[#E2E2E6]'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-full shadow-md"
                        style={{ backgroundColor: activeColor.stroke }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Timer Display with SVG Ring */}
            {!isSettingsOpen ? (
              <div className="flex flex-col items-center justify-center my-2">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-white/5"
                      fill="transparent"
                    />
                    {/* Animated Progress Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke={activeColor.stroke}
                      strokeWidth="6"
                      strokeDasharray={263.89}
                      strokeDashoffset={263.89 * (1 - progressPercent)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-linear"
                      style={{
                        filter: `drop-shadow(0 0 10px ${activeColor.glow})`,
                      }}
                    />
                  </svg>

                  {/* Countdown Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-[#E2E2E6] tracking-tight font-mono">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-xs font-semibold text-[#8E9196] mt-1 uppercase tracking-wider">
                      {isRunning ? 'In Progress' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Session Counter Badge */}
                <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#191C20] border border-white/5 text-xs text-[#8E9196]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#A8E8BC]" />
                  <span>
                    Sessions Completed: <strong className="text-[#E2E2E6]">{completedSessions}</strong>
                  </span>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-4 mt-6">
                  <button
                    onClick={resetTimer}
                    className="p-3.5 rounded-full bg-[#272A2F] hover:bg-[#32353A] text-[#8E9196] hover:text-[#E2E2E6] border border-white/10 transition active:scale-95"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold shadow-lg transition transform active:scale-95 hover:brightness-105"
                    style={{
                      backgroundColor: activeColor.stroke,
                      color: activeColor.onAccent,
                      boxShadow: `0 8px 24px ${activeColor.glow}`,
                    }}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-5 h-5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                        <span>Start</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsRunning(false);
                      if (mode === 'work') switchMode('shortBreak');
                      else switchMode('work');
                    }}
                    className="p-3.5 rounded-full bg-[#272A2F] hover:bg-[#32353A] text-[#8E9196] hover:text-[#E2E2E6] border border-white/10 transition active:scale-95"
                    title="Skip to Next"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* ─── SETTINGS PANEL ─── */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4 py-2"
              >
                <div className="text-xs font-bold text-[#8E9196] uppercase tracking-wider">
                  Timer Customization
                </div>

                {/* Focus Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#E2E2E6] font-medium">Focus Duration</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={settings.workMinutes}
                      onChange={(e) =>
                        setSettings({ ...settings, workMinutes: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-16 px-2.5 py-1.5 rounded-xl bg-[#191C20] border border-white/15 text-center text-sm text-[#E2E2E6] font-mono focus:outline-none focus:border-[#A8E8BC]"
                    />
                    <span className="text-xs text-[#8E9196]">min</span>
                  </div>
                </div>

                {/* Short Break Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#E2E2E6] font-medium">Short Break</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.shortBreakMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shortBreakMinutes: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-16 px-2.5 py-1.5 rounded-xl bg-[#191C20] border border-white/15 text-center text-sm text-[#E2E2E6] font-mono focus:outline-none focus:border-[#A8C7FA]"
                    />
                    <span className="text-xs text-[#8E9196]">min</span>
                  </div>
                </div>

                {/* Long Break Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#E2E2E6] font-medium">Long Break</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.longBreakMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          longBreakMinutes: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-16 px-2.5 py-1.5 rounded-xl bg-[#191C20] border border-white/15 text-center text-sm text-[#E2E2E6] font-mono focus:outline-none focus:border-[#D0BCFF]"
                    />
                    <span className="text-xs text-[#8E9196]">min</span>
                  </div>
                </div>

                <hr className="border-white/10 my-1" />

                {/* Audio Chime Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#A8E8BC]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-[#8E9196]" />
                    )}
                    <span className="text-sm text-[#E2E2E6] font-medium">Sound Alert</span>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                      settings.soundEnabled ? 'bg-[#A8E8BC]' : 'bg-[#32353A]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full shadow-md transition-transform ${
                        settings.soundEnabled ? 'translate-x-6 bg-[#003822]' : 'translate-x-0 bg-white/70'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto Start Breaks Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#E2E2E6] font-medium">Auto-start Breaks</span>
                  <button
                    onClick={() => setSettings({ ...settings, autoStartBreaks: !settings.autoStartBreaks })}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                      settings.autoStartBreaks ? 'bg-[#A8E8BC]' : 'bg-[#32353A]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full shadow-md transition-transform ${
                        settings.autoStartBreaks ? 'translate-x-6 bg-[#003822]' : 'translate-x-0 bg-white/70'
                      }`}
                    />
                  </button>
                </div>

                {/* Done Button */}
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="mt-2 w-full py-2.5 rounded-full bg-[#A8E8BC] text-[#003822] font-bold text-xs transition hover:bg-[#B9F2CB]"
                >
                  Save Settings
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
