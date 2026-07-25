import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Rocket, BarChart3, ArrowLeft, Clock, Trophy,
  ChevronDown, ChevronUp, Layers, Loader2, TrendingUp
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
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-accent-400" />
        </motion.div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-surface-200 mb-2">Module not found</h2>
          <p className="text-surface-400 text-sm mb-4">This module may have been deleted.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const bestAttempt = history.length > 0
    ? history.reduce((best, a) => a.percentage > best.percentage ? a : best)
    : null;

  const lastAttempt = history.length > 0 ? history[0] : null;

  // Question type breakdown
  const mcCount = questions.filter((q) => q.type === 'multiple_choice').length;
  const idCount = questions.filter((q) => q.type === 'identification').length;
  const enumCount = questions.filter((q) => q.type === 'enumeration').length;

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            id="back-to-dashboard"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-surface-400 hover:text-surface-200 text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
        </motion.div>

        {/* Module Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-6 sm:p-8 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent-500/15 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-accent-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-100 mb-1">
                {module.title}
              </h1>
              {module.description && (
                <p className="text-surface-400 text-sm sm:text-base mb-4">
                  {module.description}
                </p>
              )}

              {/* Question stats */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-surface-400 text-sm font-medium">
                  {questions.length} Questions
                </span>
                <span className="w-px h-4 bg-surface-700" />
                {mcCount > 0 && (
                  <span className="text-xs font-medium text-surface-400 bg-surface-800/60 px-2.5 py-1 rounded-lg">
                    {mcCount} MC
                  </span>
                )}
                {idCount > 0 && (
                  <span className="text-xs font-medium text-surface-400 bg-surface-800/60 px-2.5 py-1 rounded-lg">
                    {idCount} ID
                  </span>
                )}
                {enumCount > 0 && (
                  <span className="text-xs font-medium text-surface-400 bg-surface-800/60 px-2.5 py-1 rounded-lg">
                    {enumCount} Enum
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
          >
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-[oklch(0.72_0.18_200)]" />
                <span className="text-surface-500 text-xs font-medium">Attempts</span>
              </div>
              <p className="text-2xl font-extrabold text-surface-100">{history.length}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-[oklch(0.78_0.16_80)]" />
                <span className="text-surface-500 text-xs font-medium">Best Score</span>
              </div>
              <p className={`text-2xl font-extrabold ${
                bestAttempt.percentage >= 80 ? 'text-success-400' :
                bestAttempt.percentage >= 50 ? 'text-warning-400' :
                'text-danger-400'
              }`}>
                {bestAttempt.percentage}%
              </p>
            </div>
            <div className="glass rounded-xl p-4 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-success-400" />
                <span className="text-surface-500 text-xs font-medium">Last Score</span>
              </div>
              <p className={`text-2xl font-extrabold ${
                lastAttempt.percentage >= 80 ? 'text-success-400' :
                lastAttempt.percentage >= 50 ? 'text-warning-400' :
                'text-danger-400'
              }`}>
                {lastAttempt.percentage}%
              </p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
        >
          <motion.button
            id="start-review-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/module/${moduleId}/review`)}
            className="module-action-card glass-strong rounded-xl p-5 flex items-center gap-4 cursor-pointer text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-500/15 flex items-center justify-center shrink-0 group-hover:bg-accent-500/25 transition-colors">
              <Layers className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <p className="text-surface-100 font-bold text-base">Review Mode</p>
              <p className="text-surface-500 text-xs mt-0.5">Study with flashcards & study sheet</p>
            </div>
          </motion.button>

          <motion.button
            id="start-exam-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/module/${moduleId}/exam`)}
            className="module-action-card glass-strong rounded-xl p-5 flex items-center gap-4 cursor-pointer text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500/20 to-[oklch(0.62_0.24_310/0.2)] flex items-center justify-center shrink-0 group-hover:from-accent-500/30 group-hover:to-[oklch(0.62_0.24_310/0.3)] transition-colors">
              <Rocket className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <p className="text-surface-100 font-bold text-base">Take Exam</p>
              <p className="text-surface-500 text-xs mt-0.5">Test your knowledge & track your score</p>
            </div>
          </motion.button>
        </motion.div>

        {/* Score History */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              id="toggle-history"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full glass rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-surface-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-surface-400" />
                <span className="text-surface-200 font-semibold text-sm">
                  Score History ({history.length} {history.length === 1 ? 'attempt' : 'attempts'})
                </span>
              </div>
              <motion.div
                animate={{ rotate: showHistory ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-surface-400" />
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
                  <div className="mt-3 glass rounded-xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-surface-700/30">
                      <span className="text-surface-500 text-xs font-semibold uppercase tracking-wider">#</span>
                      <span className="text-surface-500 text-xs font-semibold uppercase tracking-wider">Date</span>
                      <span className="text-surface-500 text-xs font-semibold uppercase tracking-wider">Score</span>
                      <span className="text-surface-500 text-xs font-semibold uppercase tracking-wider text-right">%</span>
                    </div>

                    {history.map((attempt, i) => (
                      <div
                        key={attempt.id}
                        className={`grid grid-cols-4 gap-4 px-5 py-3 ${
                          i < history.length - 1 ? 'border-b border-surface-700/20' : ''
                        }`}
                      >
                        <span className="text-surface-400 text-sm">{i + 1}</span>
                        <span className="text-surface-300 text-sm">
                          {attempt.completedAt?.toLocaleDateString?.('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-surface-200 text-sm font-medium">
                          {attempt.score}/{attempt.totalQuestions}
                        </span>
                        <span className={`text-sm font-bold text-right ${
                          attempt.percentage >= 80 ? 'text-success-400' :
                          attempt.percentage >= 50 ? 'text-warning-400' :
                          'text-danger-400'
                        }`}>
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
