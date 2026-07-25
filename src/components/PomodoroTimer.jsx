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
  }, [mode, settings.workMinutes, settings.shortBreakMinutes, settings.longBreakMinutes]);

  // ─── Countdown Interval Loop ────────────────────────────────────────
  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);

      if (settings.soundEnabled) {
        playPomodoroChime();
      }

      if (mode === 'work') {
        setCompletedSessions((prev) => prev + 1);
        const nextMode = (completedSessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);
        setTimeLeft(
          (nextMode === 'longBreak' ? settings.longBreakMinutes : settings.shortBreakMinutes) * 60
        );
        if (settings.autoStartBreaks) setIsRunning(true);
      } else {
        setMode('work');
        setTimeLeft(settings.workMinutes * 60);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, settings, completedSessions]);

  // ─── Helper Functions ──────────────────────────────────────────────
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

  // Mode Theme Colors
  const modeColors = {
    work: {
      accent: 'oklch(0.72 0.22 330)', // Apple pink/violet
      glow: 'rgba(236, 72, 153, 0.4)',
      bgPill: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      stroke: '#ec4899',
    },
    shortBreak: {
      accent: 'oklch(0.78 0.18 155)', // Apple emerald green
      glow: 'rgba(16, 185, 129, 0.4)',
      bgPill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      stroke: '#10b981',
    },
    longBreak: {
      accent: 'oklch(0.75 0.18 240)', // Apple sapphire blue
      glow: 'rgba(59, 130, 246, 0.4)',
      bgPill: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      stroke: '#3b82f6',
    },
  };

  const activeColor = modeColors[mode];

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ─── MINIMIZED FLOATING GLASS PILL ─── */
          <motion.div
            key="pill"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="glass-apple-pill flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl cursor-pointer hover:border-white/30 transition-all group"
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
                className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: activeColor.stroke }}
              >
                {mode === 'work' ? (
                  <Timer className="w-4 h-4" />
                ) : (
                  <Coffee className="w-4 h-4" />
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white/70 leading-none">
                {mode === 'work' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </span>
              <span className="text-sm font-bold text-white tracking-wider font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Quick Play/Pause inside pill */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="ml-1 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
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
              className="p-1 text-white/50 group-hover:text-white/90 transition"
              title="Expand Timer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          /* ─── EXPANDED CONTROL CENTER CARD ─── */
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-apple w-80 sm:w-96 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl border border-white/20 relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
                  Focus Timer
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`p-2 rounded-full transition ${
                    isSettingsOpen
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 hover:bg-white/15 text-white/70 hover:text-white'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-black/30 p-1 rounded-2xl mb-6 relative border border-white/5">
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
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl transition-all relative z-10 ${
                      active ? 'text-white font-semibold' : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl bg-white/15 border border-white/20 shadow-md"
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
                      className="text-white/10"
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
                        filter: `drop-shadow(0 0 8px ${activeColor.glow})`,
                      }}
                    />
                  </svg>

                  {/* Countdown Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-white tracking-tight font-mono drop-shadow-md">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-xs font-medium text-white/50 mt-1 uppercase tracking-wider">
                      {isRunning ? 'In Progress' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Session Counter Badge */}
                <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    Sessions Completed: <strong className="text-white">{completedSessions}</strong>
                  </span>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-4 mt-6">
                  <button
                    onClick={resetTimer}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition active:scale-95"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-lg transition transform active:scale-95 hover:brightness-110"
                    style={{
                      backgroundColor: activeColor.stroke,
                      boxShadow: `0 8px 20px ${activeColor.glow}`,
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
                    className="p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition active:scale-95"
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
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Timer Customization
                </div>

                {/* Focus Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80 font-medium">Focus Duration</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={settings.workMinutes}
                      onChange={(e) =>
                        setSettings({ ...settings, workMinutes: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-16 px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-center text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                    />
                    <span className="text-xs text-white/50">min</span>
                  </div>
                </div>

                {/* Short Break Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80 font-medium">Short Break</span>
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
                      className="w-16 px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-center text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-xs text-white/50">min</span>
                  </div>
                </div>

                {/* Long Break Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80 font-medium">Long Break</span>
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
                      className="w-16 px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-center text-sm text-white font-mono focus:outline-none focus:border-blue-400"
                    />
                    <span className="text-xs text-white/50">min</span>
                  </div>
                </div>

                <hr className="border-white/10 my-1" />

                {/* Audio Chime Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-purple-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-white/40" />
                    )}
                    <span className="text-sm text-white/80 font-medium">Sound Alert</span>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${
                      settings.soundEnabled ? 'bg-purple-600' : 'bg-white/15'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto Start Breaks Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80 font-medium">Auto-start Breaks</span>
                  <button
                    onClick={() => setSettings({ ...settings, autoStartBreaks: !settings.autoStartBreaks })}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${
                      settings.autoStartBreaks ? 'bg-purple-600' : 'bg-white/15'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.autoStartBreaks ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Done Button */}
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="mt-2 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-xs transition"
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
