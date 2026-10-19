import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Rocket, BarChart3, ArrowLeft, Clock, Trophy,
  ChevronDown, Layers, Loader2, TrendingUp, Sparkles, CheckSquare, Type, ListOrdered, ToggleLeft
} from 'lucide-react';
import { getModule, getModuleQuestions, getAttemptHistory } from '../services/firebaseService';
import { playNavSound, playSubmitSound, playChoiceSound } from '../utils/soundEffects';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [mod, qs, hist] = await Promise.all([
          getModule(moduleId),
          getModuleQuestions(moduleId),
          getAttemptHistory(moduleId),
        ]);
        setModule(mod);
        setQuestions(qs);
        setHistory(hist);
      } catch (err) {
        console.error('Error loading module:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#111318]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="p-4 rounded-3xl bg-[#1D2024] border border-white/10 shadow-2xl text-[color:var(--accent)]"
        >
          <Loader2 className="w-8 h-8" />
        </motion.div>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8E9196]">
          Loading Module...
        </span>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#111318]">
        <div className="rounded-[32px] bg-[#1D2024] border border-white/10 p-8 text-center max-w-sm w-full shadow-2xl">
          <h2 className="text-2xl font-bold text-[#E2E2E6] mb-2">Module Not Found</h2>
          <p className="text-[#8E9196] text-sm mb-6">This module may have been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#272A2F] hover:bg-[#32353A] text-[#E2E2E6] font-bold text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const bestAttempt =
    history.length > 0
      ? history.reduce((best, a) => (a.percentage > best.percentage ? a : best))
      : null;

  const lastAttempt = history.length > 0 ? history[0] : null;

  const mcCount = questions.filter((q) => q.type === 'multiple_choice').length;
  const idCount = questions.filter((q) => q.type === 'identification').length;
  const enumCount = questions.filter((q) => q.type === 'enumeration').length;
  const tfCount = questions.filter((q) => q.type === 'true_false').length;

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12 bg-[#111318] text-[#E2E2E6]">
      <div className="w-full max-w-4xl mx-auto">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            id="back-to-dashboard"
            onClick={() => {
              playNavSound();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#272A2F] hover:bg-[#32353A] border border-white/10 text-xs font-semibold text-[#E2E2E6] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[color:var(--accent)]" />
            <span>Dashboard</span>
          </button>
        </motion.div>

        {/* Pixel Module Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 25 }}
          className="rounded-[32px] bg-[#1D2024] border border-white/[0.06] p-7 sm:p-9 mb-6 relative overflow-hidden shadow-xl"
        >
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full bg-[color:var(--accent-container)]/60 text-[color:var(--accent)] border border-[color:var(--accent)]/20 text-[10px] font-extrabold uppercase tracking-wider">
                  Module
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E2E2E6] mb-2 tracking-tight">
                {module.title}
              </h1>
              {module.description && (
                <p className="text-[#8E9196] text-sm sm:text-base mb-5 leading-relaxed">
                  {module.description}
                </p>
              )}

              {/* Pixel Badges / Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="px-3.5 py-1 rounded-full bg-[#272A2F] text-[#E2E2E6] font-semibold text-xs border border-white/10">
                  {questions.length} Questions
                </span>
                {mcCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A4458]/40 text-[#D0BCFF] border border-[#D0BCFF]/30 text-xs font-bold">
                    <CheckSquare className="w-3.5 h-3.5" />
                    {mcCount} Multiple Choice
                  </span>
                )}
                {idCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E4378]/40 text-[#A8C7FA] border border-[#A8C7FA]/30 text-xs font-bold">
                    <Type className="w-3.5 h-3.5" />
                    {idCount} Identification
                  </span>
                )}
                {enumCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#443600]/40 text-[#FDE293] border border-[#FDE293]/30 text-xs font-bold">
                    <ListOrdered className="w-3.5 h-3.5" />
                    {enumCount} Enumeration
                  </span>
                )}
                {tfCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--accent-surface)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 text-xs font-bold">
                    <ToggleLeft className="w-3.5 h-3.5" />
                    {tfCount} True/False
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 25 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
          >
            <div className="p-5 rounded-[28px] bg-[#1D2024] border border-white/[0.06] shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-[#A8C7FA]" />
                <span className="text-[#8E9196] text-xs font-semibold uppercase tracking-wider">Attempts</span>
              </div>
              <p className="text-3xl font-extrabold text-[#E2E2E6] font-mono">{history.length}</p>
            </div>
            <div className="p-5 rounded-[28px] bg-[#1D2024] border border-white/[0.06] shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-[#FDE293]" />
                <span className="text-[#8E9196] text-xs font-semibold uppercase tracking-wider">Best Score</span>
              </div>
              <p
                className={`text-3xl font-extrabold font-mono ${
                  bestAttempt.percentage >= 80
                    ? 'text-[color:var(--accent)]'
                    : bestAttempt.percentage >= 50
                    ? 'text-[#FDE293]'
                    : 'text-[#FFB4AB]'
                }`}
              >
                {bestAttempt.percentage}%
              </p>
            </div>
            <div className="p-5 rounded-[28px] bg-[#1D2024] border border-white/[0.06] shadow-lg col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[color:var(--accent)]" />
                <span className="text-[#8E9196] text-xs font-semibold uppercase tracking-wider">Last Score</span>
              </div>
              <p
                className={`text-3xl font-extrabold font-mono ${
                  lastAttempt.percentage >= 80
                    ? 'text-[color:var(--accent)]'
                    : lastAttempt.percentage >= 50
                    ? 'text-[#FDE293]'
                    : 'text-[#FFB4AB]'
                }`}
              >
                {lastAttempt.percentage}%
              </p>
            </div>
          </motion.div>
        )}

        {/* Primary Action Modes */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 25 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
        >
          {/* Review Mode Button */}
          <motion.button
            id="start-review-button"
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playNavSound();
              navigate(`/module/${moduleId}/review`);
            }}
            className="p-6 sm:p-7 rounded-[28px] bg-[#1D2024] border border-white/[0.06] hover:border-[#D0BCFF]/40 hover:bg-[#23272D] flex items-center gap-5 cursor-pointer text-left group shadow-lg transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#4A4458] text-[#D0BCFF] border border-[#D0BCFF]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[#E2E2E6] font-extrabold text-lg tracking-tight">Review Mode</p>
              <p className="text-[#8E9196] text-xs mt-1">Study 3D flashcards &amp; complete study sheets</p>
            </div>
          </motion.button>

          {/* Exam Mode Button */}
          <motion.button
            id="start-exam-button"
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playSubmitSound();
              navigate(`/module/${moduleId}/exam`);
            }}
            className="p-6 sm:p-7 rounded-[28px] bg-[#1D2024] border border-white/[0.06] hover:border-[color:var(--accent)]/40 hover:bg-[#23272D] flex items-center gap-5 cursor-pointer text-left group shadow-lg transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Rocket className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[#E2E2E6] font-extrabold text-lg tracking-tight">Take Exam</p>
              <p className="text-[#8E9196] text-xs mt-1">Test your knowledge with live grading &amp; history</p>
            </div>
          </motion.button>
        </motion.div>

        {/* History Accordion */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              id="toggle-history"
              onClick={() => {
                playChoiceSound();
                setShowHistory(!showHistory);
              }}
              className="w-full p-5 rounded-[28px] bg-[#1D2024] border border-white/[0.06] flex items-center justify-between cursor-pointer hover:bg-[#23272D] transition shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[color:var(--accent)]" />
                <span className="text-[#E2E2E6] font-bold text-sm">
                  Score History ({history.length} {history.length === 1 ? 'attempt' : 'attempts'})
                </span>
              </div>
              <motion.div animate={{ rotate: showHistory ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-5 h-5 text-[#8E9196]" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-[28px] bg-[#1D2024] border border-white/[0.06] overflow-hidden divide-y divide-white/5 shadow-xl">
                    <div className="grid grid-cols-4 gap-4 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#8E9196]">
                      <span>#</span>
                      <span>Date</span>
                      <span>Score</span>
                      <span className="text-right">Result</span>
                    </div>

                    {history.map((attempt, i) => (
                      <div key={attempt.id} className="grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors">
                        <span className="text-[#8E9196] text-sm font-mono">{i + 1}</span>
                        <span className="text-[#E2E2E6] text-xs font-semibold">
                          {attempt.completedAt?.toLocaleDateString?.('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[#E2E2E6] text-sm font-bold font-mono">
                          {attempt.score}/{attempt.totalQuestions}
                        </span>
                        <span
                          className={`text-sm font-extrabold font-mono text-right ${
                            attempt.percentage >= 80
                              ? 'text-[color:var(--accent)]'
                              : attempt.percentage >= 50
                              ? 'text-[#FDE293]'
                              : 'text-[#FFB4AB]'
                          }`}
                        >
                          {attempt.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
