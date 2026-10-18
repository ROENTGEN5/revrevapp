import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Rocket, BarChart3, ArrowLeft, Clock, Trophy,
  ChevronDown, Layers, Loader2, TrendingUp, Sparkles
} from 'lucide-react';
import { getModule, getModuleQuestions, getAttemptHistory } from '../services/firebaseService';

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-lg text-[#C60C30]"
        >
          <Loader2 className="w-8 h-8" />
        </motion.div>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8A96A3]">
          Loading Module...
        </span>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-apple-card rounded-3xl p-8 text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Module Not Found</h2>
          <p className="text-white/60 text-sm mb-6">This module may have been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl glass-apple-btn font-bold text-xs"
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

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl mx-auto">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            id="back-to-dashboard"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-apple-btn text-xs font-semibold hover:text-[#0A1628] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </motion.div>

        {/* Apple Glass Module Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 25 }}
          className="glass-apple-card p-6 sm:p-8 mb-6 relative overflow-hidden"
        >
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1628] mb-1.5 tracking-tight">
                {module.title}
              </h1>
              {module.description && (
                <p className="text-[#4A5568] text-sm sm:text-base mb-4 leading-relaxed">
                  {module.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white font-semibold text-xs border border-white/10">
                  {questions.length} Questions
                </span>
                {mcCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                    {mcCount} Multiple Choice
                  </span>
                )}
                {idCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                    {idCount} Identification
                  </span>
                )}
                {enumCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    {enumCount} Enumeration
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
            <div className="glass-apple-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-[#8A96A3] text-xs font-semibold uppercase tracking-wider">Attempts</span>
              </div>
              <p className="text-3xl font-extrabold text-[#0A1628] font-mono">{history.length}</p>
            </div>
            <div className="glass-apple-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-[#8A96A3] text-xs font-semibold uppercase tracking-wider">Best Score</span>
              </div>
              <p
                className={`text-3xl font-extrabold font-mono ${
                  bestAttempt.percentage >= 80
                    ? 'text-emerald-600'
                    : bestAttempt.percentage >= 50
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {bestAttempt.percentage}%
              </p>
            </div>
            <div className="glass-apple-card p-5 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-[#8A96A3] text-xs font-semibold uppercase tracking-wider">Last Score</span>
              </div>
              <p
                className={`text-3xl font-extrabold font-mono ${
                  lastAttempt.percentage >= 80
                    ? 'text-emerald-600'
                    : lastAttempt.percentage >= 50
                    ? 'text-amber-600'
                    : 'text-red-600'
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
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/module/${moduleId}/review`)}
            className="glass-apple-card p-6 flex items-center gap-5 cursor-pointer text-left group border hover:border-[#C60C30]/30"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg tracking-tight">Review Mode</p>
              <p className="text-white/50 text-xs mt-1">Study flashcards & view complete study sheets</p>
            </div>
          </motion.button>

          {/* Exam Mode Button */}
          <motion.button
            id="start-exam-button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/module/${moduleId}/exam`)}
            className="glass-apple-card p-6 flex items-center gap-5 cursor-pointer text-left group border hover:border-[#C60C30]/40"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FEE2E8] text-[#C60C30] border border-[#FECDD3] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Rocket className="w-7 h-7" />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg tracking-tight">Take Exam</p>
              <p className="text-white/50 text-xs mt-1">Test your knowledge with live scoring & history</p>
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
              onClick={() => setShowHistory(!showHistory)}
              className="w-full glass-apple-card p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#C60C30]" />
                <span className="text-[#0A1628] font-bold text-sm">
                  Score History ({history.length} {history.length === 1 ? 'attempt' : 'attempts'})
                </span>
              </div>
              <motion.div animate={{ rotate: showHistory ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-5 h-5 text-[#8A96A3]" />
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
                  <div className="mt-3 glass-apple-card overflow-hidden divide-y divide-white/5">
                    <div className="grid grid-cols-4 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#8A96A3]">
                      <span>#</span>
                      <span>Date</span>
                      <span>Score</span>
                      <span className="text-right">Result</span>
                    </div>

                    {history.map((attempt, i) => (
                      <div key={attempt.id} className="grid grid-cols-4 gap-4 px-6 py-3.5 items-center">
                        <span className="text-[#4A5568] text-sm font-mono">{i + 1}</span>
                        <span className="text-[#0A1628] text-xs font-semibold">
                          {attempt.completedAt?.toLocaleDateString?.('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[#0A1628] text-sm font-bold font-mono">
                          {attempt.score}/{attempt.totalQuestions}
                        </span>
                        <span
                          className={`text-sm font-extrabold font-mono text-right ${
                            attempt.percentage >= 80
                              ? 'text-emerald-600'
                              : attempt.percentage >= 50
                              ? 'text-amber-600'
                              : 'text-red-600'
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
