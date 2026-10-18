import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Plus, BookOpen, Trophy, TrendingUp,
  MoreVertical, Trash2, ChevronRight, BarChart3, Layers,
  Loader2, PenLine, Search, Brain, Zap
} from 'lucide-react';
import { getModules, getAllAttempts, deleteModule, getAllDueQuestions } from '../services/firebaseService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [dueQuestions, setDueQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mods, atts, dues] = await Promise.all([
        getModules(),
        getAllAttempts(),
        getAllDueQuestions(),
      ]);
      setModules(mods);
      setAttempts(atts);
      setDueQuestions(dues);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // ─── Stats & Filter Logic ────────────────────────────────────
  const filteredModules = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const publishedModules = filteredModules.filter((m) => m.status !== 'draft');
  const draftModules = filteredModules.filter((m) => m.status === 'draft');
  const totalModules = modules.length;
  const totalAttempts = attempts.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts)
      : 0;

  const recentAttempts = attempts.slice(0, 5);

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-lg text-[#C60C30]"
        >
          <Loader2 className="w-8 h-8" />
        </motion.div>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8A96A3]">
          Loading QuizForge...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="w-full max-w-6xl mx-auto">
        {/* Apple macOS Control Center Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 p-6 sm:p-8 rounded-2xl bg-[#0A1628] border border-[rgba(255,255,255,0.08)] shadow-xl"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-[#C60C30] text-white shadow-lg shadow-[rgba(198,12,48,0.3)]">
                <Sparkles className="w-7 h-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                QuizForge
              </h1>
            </div>
            <p className="text-white/60 text-sm sm:text-base ml-0.5">
              Apple Glass interactive study & review studio
            </p>
          </div>

          {/* Quick Create CTA */}
          <motion.button
            id="create-module-button"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/create')}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-[#C60C30] text-white shadow-xl shadow-[rgba(198,12,48,0.35)] hover:bg-[#A00825] transition-all cursor-pointer border border-[rgba(255,255,255,0.15)]"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Module</span>
          </motion.button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 25 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-10"
        >
          <StatCard
            icon={<Layers className="w-5 h-5" />}
            label="Modules"
            value={totalModules}
            color="red"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Exams Taken"
            value={totalAttempts}
            color="navy"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Avg Score"
            value={totalAttempts > 0 ? `${avgScore}%` : '—'}
            color="amber"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Best Score"
            value={
              attempts.length > 0
                ? `${Math.max(...attempts.map((a) => a.percentage || 0))}%`
                : '—'
            }
            color="emerald"
          />
        </motion.div>

        {/* Spaced Repetition Queue Banner */}
        {dueQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 25 }}
            className="glass-apple-card p-6 mb-10 border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-md">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                    Spaced Repetition Active
                  </span>
                  <span className="text-[#8A96A3] text-xs font-mono">SM-2 Algorithm</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#0A1628] tracking-tight">
                  🧠 {dueQuestions.length} {dueQuestions.length === 1 ? 'Card' : 'Cards'} Due For Review Today
                </h3>
                <p className="text-[#4A5568] text-xs mt-0.5">
                  Reviewing these target cards today builds maximum long-term memory retention.
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (dueQuestions.length > 0) {
                  const firstDue = dueQuestions[0];
                  navigate(`/module/${firstDue.moduleId}/review`);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 transition-all cursor-pointer border border-emerald-500 shrink-0"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start Smart Review ({dueQuestions.length})</span>
            </motion.button>
          </motion.div>
        )}

        {/* Modules Section Header & Search */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 25 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-extrabold text-[#0A1628] tracking-tight flex items-center gap-2">
              <span>Your Modules</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0EDE7] text-[#4A5568] border border-[#D8D2C8]">
                {modules.length}
              </span>
            </h2>

            {/* Search Input */}
            {modules.length > 0 && (
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl glass-apple-input text-sm focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            )}
          </div>

          {modules.length === 0 ? (
            <EmptyState onCreateClick={() => navigate('/create')} />
          ) : (
            <>
              {/* Draft Modules */}
              {draftModules.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <PenLine className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-300">Drafts</span>
                    <span className="text-xs text-white/40">({draftModules.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

        {/* Recent Activity List */}
        {recentAttempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 25 }}
            className="mt-12"
          >
            <h2 className="text-xl font-bold text-[#0A1628] mb-4 tracking-tight">Recent Activity</h2>
            <div className="glass-apple-card overflow-hidden divide-y divide-[#E2DDD5]">
              {recentAttempts.map((attempt, i) => {
                const mod = modules.find((m) => m.id === attempt.moduleId);
                return (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => mod && navigate(`/module/${mod.id}`)}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        attempt.percentage >= 80
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                          : attempt.percentage >= 50
                          ? 'bg-amber-100 text-amber-600 border border-amber-200'
                          : 'bg-red-100 text-red-600 border border-red-200'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#0A1628] text-sm font-bold truncate">
                        {mod?.title || 'Unknown Module'}
                      </p>
                      <p className="text-[#8A96A3] text-xs">
                        {attempt.completedAt?.toLocaleDateString?.() || 'Recent'} · {attempt.score}/{attempt.totalQuestions} correct
                      </p>
                    </div>
                    <span
                      className={`text-sm font-extrabold font-mono px-3 py-1 rounded-full ${
                        attempt.percentage >= 80
                          ? 'bg-emerald-100 text-emerald-700'
                          : attempt.percentage >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
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
  const colorStyles = {
    red: 'bg-[#FEE2E8] text-[#C60C30] border-[#FECDD3]',
    navy: 'bg-[#EEF2FF] text-[#0A1628] border-[#C7D2FE]',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    // Legacy compat
    purple: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
    blue: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className="glass-apple-card p-5 flex flex-col justify-between"
    >
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl border mb-3 shadow-sm ${colorStyles[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-extrabold text-[#0A1628] tracking-tight tabular-nums">{value}</p>
        <p className="text-[#8A96A3] text-xs font-semibold uppercase tracking-wider mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function ModuleCard({
  module,
  index,
  bestScore,
  attemptCount,
  menuOpen,
  onMenuToggle,
  deleteConfirm,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onClick,
}) {
  const isDraft = module.status === 'draft';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 24 }}
      onClick={onClick}
      className={`glass-apple-card p-6 cursor-pointer group relative flex flex-col justify-between ${
        isDraft ? 'border-amber-300' : ''
      }`}
    >
      {/* Menu Options Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          id={`module-menu-${module.id}`}
          onClick={onMenuToggle}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8A96A3] hover:text-[#0A1628] hover:bg-[#F0EDE7] transition cursor-pointer"
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
              className="absolute right-0 top-10 z-50 min-w-[150px] bg-white border border-[#E2DDD5] rounded-2xl overflow-hidden shadow-xl p-1"
              onClick={(e) => e.stopPropagation()}
            >
              {deleteConfirm ? (
                <div className="p-2">
                  <p className="text-xs text-white/70 mb-2 font-medium">Delete this module?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={onDeleteConfirm}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={onDeleteCancel}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 text-white/70 text-xs font-bold hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onDeleteRequest}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Module
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        {/* Module Cover Image Banner */}
        {module.coverImage && (
          <div className="h-28 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl relative">
            <img src={module.coverImage} alt={module.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141420] via-transparent to-transparent" />
          </div>
        )}

        {/* Module Icon & Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
              isDraft
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-[#FEE2E8] text-[#C60C30] border-[#FECDD3]'
            }`}
          >
            {isDraft ? <PenLine className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
          </div>
          {isDraft && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider">
              Draft
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-[#0A1628] mb-1.5 pr-8 truncate tracking-tight">
          {module.title}
        </h3>
        {module.description && (
          <p className="text-[#4A5568] text-xs mb-4 line-clamp-2 leading-relaxed">
            {module.description}
          </p>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E2DDD5] text-xs mt-4">
        <span className="text-[#8A96A3] font-medium">
          {module.questionCount} {module.questionCount === 1 ? 'question' : 'questions'}
        </span>

        {isDraft ? (
          <span className="text-amber-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Edit →
          </span>
        ) : (
          <div className="flex items-center gap-2">
            {bestScore ? (
              <span
                className={`font-bold font-mono px-2 py-0.5 rounded-md ${
                  bestScore.percentage >= 80
                    ? 'bg-emerald-100 text-emerald-700'
                    : bestScore.percentage >= 50
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                Best: {bestScore.percentage}%
              </span>
            ) : (
              <span className="text-[#8A96A3] font-medium">Unattempted</span>
            )}
            <ChevronRight className="w-4 h-4 text-[#C60C30] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ onCreateClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-apple-card p-10 sm:p-14 text-center border-2 border-dashed border-[#D8D2C8]"
    >
      <div className="w-16 h-16 rounded-3xl bg-[#FEE2E8] border border-[#FECDD3] text-[#C60C30] flex items-center justify-center mx-auto mb-5 shadow-lg">
        <BookOpen className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold text-[#0A1628] mb-2 tracking-tight">No Modules Yet</h3>
      <p className="text-[#4A5568] text-sm mb-6 max-w-md mx-auto leading-relaxed">
        Start building your flashcards & quiz library by uploading a CSV/JSON file or entering questions manually.
      </p>
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCreateClick}
        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-[#C60C30] text-white shadow-xl shadow-[rgba(198,12,48,0.3)] hover:bg-[#A00825] transition-all cursor-pointer border border-[rgba(255,255,255,0.15)]"
      >
        <Plus className="w-5 h-5" />
        Create First Module
      </motion.button>
    </motion.div>
  );
}
