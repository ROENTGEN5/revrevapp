import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Plus, BookOpen, Trophy, TrendingUp, Clock,
  MoreVertical, Trash2, ChevronRight, BarChart3, Layers,
  Loader2, PenLine
} from 'lucide-react';
import { getModules, getAllAttempts, deleteModule } from '../services/firebaseService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mods, atts] = await Promise.all([getModules(), getAllAttempts()]);
      setModules(mods);
      setAttempts(atts);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => setMenuOpen(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const handleDelete = async (moduleId) => {
    try {
      await deleteModule(moduleId);
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      setAttempts((prev) => prev.filter((a) => a.moduleId !== moduleId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting module:', err);
    }
  };

  // ─── Stats ──────────────────────────────────────────────────
  const publishedModules = modules.filter((m) => m.status !== 'draft');
  const draftModules = modules.filter((m) => m.status === 'draft');
  const totalModules = modules.length;
  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts)
    : 0;

  const recentAttempts = attempts.slice(0, 5);

  // Group attempts by moduleId for best-score lookup
  const bestScoreByModule = {};
  attempts.forEach((a) => {
    if (!bestScoreByModule[a.moduleId] || a.percentage > bestScoreByModule[a.moduleId].percentage) {
      bestScoreByModule[a.moduleId] = a;
    }
  });

  const attemptCountByModule = {};
  attempts.forEach((a) => {
    attemptCountByModule[a.moduleId] = (attemptCountByModule[a.moduleId] || 0) + 1;
  });

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

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-accent-400" />
            <h1 className="text-3xl sm:text-4xl font-extrabold gradient-text tracking-tight">
              QuizForge
            </h1>
          </div>
          <p className="text-surface-400 text-lg">
            Your personal study dashboard
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10"
        >
          <StatCard
            icon={<Layers className="w-5 h-5" />}
            label="Modules"
            value={totalModules}
            color="accent"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Exams Taken"
            value={totalAttempts}
            color="blue"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Avg Score"
            value={totalAttempts > 0 ? `${avgScore}%` : '—'}
            color="gold"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Best Score"
            value={
              attempts.length > 0
                ? `${Math.max(...attempts.map((a) => a.percentage || 0))}%`
                : '—'
            }
            color="green"
          />
        </motion.div>

        {/* Modules Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-surface-100">Your Modules</h2>
            <motion.button
              id="create-module-button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-500 to-[oklch(0.62_0.24_310)] text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Module
            </motion.button>
          </div>

          {modules.length === 0 ? (
            <EmptyState onCreateClick={() => navigate('/create')} />
          ) : (
            <>
              {/* Draft Modules */}
              {draftModules.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <PenLine className="w-4 h-4 text-warning-400" />
                    <span className="text-sm font-semibold text-warning-400">Drafts</span>
                    <span className="text-xs text-surface-500">({draftModules.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {draftModules.map((mod, index) => (
                      <ModuleCard
                        key={mod.id}
                        module={mod}
                        index={index}
                        bestScore={bestScoreByModule[mod.id]}
                        attemptCount={attemptCountByModule[mod.id] || 0}
                        menuOpen={menuOpen === mod.id}
                        onMenuToggle={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === mod.id ? null : mod.id);
                        }}
                        deleteConfirm={deleteConfirm === mod.id}
                        onDeleteRequest={() => setDeleteConfirm(mod.id)}
                        onDeleteConfirm={() => handleDelete(mod.id)}
                        onDeleteCancel={() => setDeleteConfirm(null)}
                        onClick={() => navigate(`/create/${mod.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Published Modules */}
              {publishedModules.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publishedModules.map((mod, index) => (
                    <ModuleCard
                      key={mod.id}
                      module={mod}
                      index={index}
                      bestScore={bestScoreByModule[mod.id]}
                      attemptCount={attemptCountByModule[mod.id] || 0}
                      menuOpen={menuOpen === mod.id}
                      onMenuToggle={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === mod.id ? null : mod.id);
                      }}
                      deleteConfirm={deleteConfirm === mod.id}
                      onDeleteRequest={() => setDeleteConfirm(mod.id)}
                      onDeleteConfirm={() => handleDelete(mod.id)}
                      onDeleteCancel={() => setDeleteConfirm(null)}
                      onClick={() => navigate(`/module/${mod.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Recent Activity */}
        {recentAttempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10"
          >
            <h2 className="text-xl font-bold text-surface-100 mb-4">Recent Activity</h2>
            <div className="glass rounded-2xl overflow-hidden">
              {recentAttempts.map((attempt, i) => {
                const mod = modules.find((m) => m.id === attempt.moduleId);
                return (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-800/30 transition-colors cursor-pointer ${
                      i < recentAttempts.length - 1 ? 'border-b border-surface-700/30' : ''
                    }`}
                    onClick={() => mod && navigate(`/module/${mod.id}`)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      attempt.percentage >= 80
                        ? 'bg-success-bg text-success-400'
                        : attempt.percentage >= 50
                        ? 'bg-warning-bg text-warning-400'
                        : 'bg-danger-bg text-danger-400'
                    }`}>
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-surface-200 text-sm font-semibold truncate">
                        {mod?.title || 'Unknown Module'}
                      </p>
                      <p className="text-surface-500 text-xs">
                        {attempt.completedAt?.toLocaleDateString?.()} · {attempt.score}/{attempt.totalQuestions} correct
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${
                      attempt.percentage >= 80 ? 'text-success-400' :
                      attempt.percentage >= 50 ? 'text-warning-400' :
                      'text-danger-400'
                    }`}>
                      {attempt.percentage}%
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


// ─── Sub-components ──────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    accent: 'bg-accent-500/15 text-accent-400',
    blue: 'bg-[oklch(0.72_0.18_200/0.15)] text-[oklch(0.72_0.18_200)]',
    gold: 'bg-[oklch(0.78_0.16_80/0.15)] text-[oklch(0.78_0.16_80)]',
    green: 'bg-success-bg text-success-400',
  };

  return (
    <div className="glass rounded-xl p-4 sm:p-5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-surface-100 tabular-nums">{value}</p>
      <p className="text-surface-500 text-xs font-medium mt-1">{label}</p>
    </div>
  );
}

function ModuleCard({
  module, index, bestScore, attemptCount,
  menuOpen, onMenuToggle,
  deleteConfirm, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
  onClick
}) {
  const isDraft = module.status === 'draft';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={onClick}
      className={`module-card glass-strong rounded-2xl p-5 sm:p-6 cursor-pointer group relative ${
        isDraft ? 'border border-warning-400/20' : ''
      }`}
    >
      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          id={`module-menu-${module.id}`}
          onClick={onMenuToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:text-surface-200 hover:bg-surface-700/50 transition-all cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50 min-w-[140px] glass-strong rounded-xl overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {deleteConfirm ? (
                <div className="p-3">
                  <p className="text-xs text-surface-300 mb-2">Delete this module?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={onDeleteConfirm}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-danger-500 text-white text-xs font-bold cursor-pointer hover:bg-danger-600 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={onDeleteCancel}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-surface-700 text-surface-300 text-xs font-bold cursor-pointer hover:bg-surface-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onDeleteRequest}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger-400 hover:bg-danger-bg/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Module Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
        isDraft
          ? 'bg-warning-bg group-hover:bg-warning-400/20'
          : 'bg-accent-500/15 group-hover:bg-accent-500/25'
      }`}>
        {isDraft
          ? <PenLine className="w-5 h-5 text-warning-400" />
          : <BookOpen className="w-5 h-5 text-accent-400" />
        }
      </div>

      {/* Draft Badge */}
      {isDraft && (
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-warning-bg text-warning-400 text-[10px] font-bold uppercase tracking-wider">
            Draft
          </span>
        </div>
      )}

      {/* Title & Description */}
      <h3 className="text-lg font-bold text-surface-100 mb-1 pr-8 truncate">
        {module.title}
      </h3>
      {module.description && (
        <p className="text-surface-400 text-sm mb-4 line-clamp-2">
          {module.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-surface-700/30">
        <span className="text-xs font-medium text-surface-500">
          {module.questionCount} {module.questionCount === 1 ? 'question' : 'questions'}
        </span>
        {isDraft ? (
          <>
            <span className="w-px h-3 bg-surface-700" />
            <span className="text-xs font-medium text-warning-400">
              Continue editing →
            </span>
          </>
        ) : (
          <>
            <span className="w-px h-3 bg-surface-700" />
            <span className="text-xs font-medium text-surface-500">
              {attemptCount} {attemptCount === 1 ? 'attempt' : 'attempts'}
            </span>
            {bestScore && (
              <>
                <span className="w-px h-3 bg-surface-700" />
                <span className={`text-xs font-bold ${
                  bestScore.percentage >= 80 ? 'text-success-400' :
                  bestScore.percentage >= 50 ? 'text-warning-400' :
                  'text-danger-400'
                }`}>
                  Best: {bestScore.percentage}%
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Hover Arrow */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5 text-accent-400" />
      </div>
    </motion.div>
  );
}

function EmptyState({ onCreateClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-10 sm:p-14 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-accent-500/15 flex items-center justify-center mx-auto mb-5">
        <BookOpen className="w-7 h-7 text-accent-400" />
      </div>
      <h3 className="text-xl font-bold text-surface-200 mb-2">No modules yet</h3>
      <p className="text-surface-400 text-sm mb-6 max-w-md mx-auto">
        Create your first study module by uploading a question file or entering questions manually.
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-500 to-[oklch(0.62_0.24_310)] text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-shadow cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Create Your First Module
      </motion.button>
    </motion.div>
  );
}
