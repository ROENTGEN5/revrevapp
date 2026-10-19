import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Plus, BookOpen, Trophy, TrendingUp,
  MoreVertical, Trash2, ChevronRight, BarChart3, Layers,
  Loader2, PenLine, Search, Brain, Zap, Calendar, X
} from 'lucide-react';
import { getModules, getAllAttempts, deleteModule, getAllDueQuestions } from '../services/firebaseService';
import { playNavSound, playSubmitSound, playChoiceSound } from '../utils/soundEffects';

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

  // Current date for Google Pixel "At a Glance"
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

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
          Loading QuizForge...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12 bg-[#111318] text-[#E2E2E6]">
      <div className="w-full max-w-6xl mx-auto">
        {/* Pixel "At a Glance" Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-4 px-2"
        >
          <div className="flex items-center gap-2 text-sm text-[#C4C7C5] font-medium">
            <Calendar className="w-4 h-4 text-[color:var(--accent)]" />
            <span>{formattedToday}</span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-[#A8C7FA]">Study Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E2228] border border-white/10 text-xs font-medium text-[#C4C7C5]">
              <span className="w-2 h-2 rounded-full bg-[color:var(--accent)] animate-pulse" />
              Pixel Dark UI
            </span>
          </div>
        </motion.div>

        {/* Google Pixel Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 25 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 p-7 sm:p-9 rounded-[32px] bg-[#1D2024] border border-white/[0.06] shadow-xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-3 rounded-2xl bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/20 shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#E2E2E6] tracking-tight">
                    QuizForge
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)] border border-[color:var(--accent)]/30 text-[11px] font-bold uppercase tracking-wider">
                    Pixel UI
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[#8E9196] text-sm sm:text-base ml-1 max-w-xl">
              Material You interactive flashcard & exam studio with SM-2 spaced repetition.
            </p>
          </div>

          {/* Quick Create CTA (Pixel Primary Pill) */}
          <motion.button
            id="create-module-button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playSubmitSound();
              navigate('/create');
            }}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-lg shadow-[color:var(--accent)]/20 hover:bg-[color:var(--accent-hover)] hover:shadow-[color:var(--accent)]/30 transition-all cursor-pointer border-0 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Create New Module</span>
          </motion.button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 25 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
        >
          <StatCard
            icon={<Layers className="w-5 h-5" />}
            label="Modules"
            value={totalModules}
            color="mint"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Exams Taken"
            value={totalAttempts}
            color="sky"
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
            color="lavender"
          />
        </motion.div>

        {/* Spaced Repetition Queue Banner (Pixel Mint / Sage) */}
        {dueQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 25 }}
            className="p-6 sm:p-7 mb-10 rounded-[28px] bg-[color:var(--accent-surface)] border border-[color:var(--accent)]/25 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 flex items-center justify-center shrink-0 shadow-md">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 text-[10px] font-extrabold uppercase tracking-wider">
                    Spaced Repetition Active
                  </span>
                  <span className="text-[#8E9196] text-xs font-mono">SM-2 Algorithm</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#E2E2E6] tracking-tight">
                  🧠 {dueQuestions.length} {dueQuestions.length === 1 ? 'Card' : 'Cards'} Due For Review Today
                </h3>
                <p className="text-[#8E9196] text-xs mt-0.5">
                  Reviewing these target cards today builds maximum long-term memory retention.
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (dueQuestions.length > 0) {
                  playSubmitSound();
                  const firstDue = dueQuestions[0];
                  navigate(`/module/${firstDue.moduleId}/review`);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-xs bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-lg shadow-[color:var(--accent)]/20 hover:bg-[color:var(--accent-hover)] transition-all cursor-pointer border-0 shrink-0"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start Smart Review ({dueQuestions.length})</span>
            </motion.button>
          </motion.div>
        )}

        {/* Modules Section Header & Pixel Search */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 25 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-extrabold text-[#E2E2E6] tracking-tight flex items-center gap-2.5">
              <span>Your Modules</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#272A2F] text-[color:var(--accent)] border border-white/10">
                {modules.length}
              </span>
            </h2>

            {/* Pixel Search Bar */}
            {modules.length > 0 && (
              <div className="relative w-full sm:w-80">
                <div className="pixel-search-bar px-4 py-2.5 flex items-center gap-3">
                  <Search className="w-4 h-4 text-[color:var(--accent)] shrink-0" />
                  <input
                    type="text"
                    placeholder="Search study modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 text-sm text-[#E2E2E6] placeholder:text-[#8E9196] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        playChoiceSound();
                        setSearchQuery('');
                      }}
                      className="text-[#8E9196] hover:text-[#E2E2E6] transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {modules.length === 0 ? (
            <EmptyState onCreateClick={() => navigate('/create')} />
          ) : (
            <>
              {/* Draft Modules */}
              {draftModules.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <PenLine className="w-4 h-4 text-[#FDE293]" />
                    <span className="text-sm font-bold text-[#FDE293]">Drafts</span>
                    <span className="text-xs text-[#8E9196]">({draftModules.length})</span>
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
                        onClick={() => {
                          playNavSound();
                          navigate(`/create/${mod.id}`);
                        }}
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
                      onClick={() => {
                        playNavSound();
                        navigate(`/module/${mod.id}`);
                      }}
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
            <h2 className="text-xl font-bold text-[#E2E2E6] mb-4 tracking-tight">Recent Activity</h2>
            <div className="rounded-[28px] bg-[#1D2024] border border-white/[0.06] overflow-hidden divide-y divide-white/5">
              {recentAttempts.map((attempt, i) => {
                const mod = modules.find((m) => m.id === attempt.moduleId);
                const isGreat = attempt.percentage >= 80;
                const isOkay = attempt.percentage >= 50;
                return (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => {
                      if (mod) {
                        playNavSound();
                        navigate(`/module/${mod.id}`);
                      }
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                        isGreat
                          ? 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border-[color:var(--accent)]/30'
                          : isOkay
                          ? 'bg-[#443600] text-[#FDE293] border-[#FDE293]/30'
                          : 'bg-[#5C2822] text-[#FFB4AB] border-[#FFB4AB]/30'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#E2E2E6] text-sm font-bold truncate">
                        {mod?.title || 'Unknown Module'}
                      </p>
                      <p className="text-[#8E9196] text-xs">
                        {attempt.completedAt?.toLocaleDateString?.() || 'Recent'} · {attempt.score}/{attempt.totalQuestions} correct
                      </p>
                    </div>
                    <span
                      className={`text-xs font-extrabold font-mono px-3.5 py-1 rounded-full border ${
                        isGreat
                          ? 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border-[color:var(--accent)]/30'
                          : isOkay
                          ? 'bg-[#443600] text-[#FDE293] border-[#FDE293]/30'
                          : 'bg-[#5C2822] text-[#FFB4AB] border-[#FFB4AB]/30'
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
    mint: 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border-[color:var(--accent)]/25',
    sky: 'bg-[#1E4378] text-[#A8C7FA] border-[#A8C7FA]/25',
    gold: 'bg-[#443600] text-[#FDE293] border-[#FDE293]/25',
    lavender: 'bg-[#4A4458] text-[#D0BCFF] border-[#D0BCFF]/25',
    // Compat
    red: 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border-[color:var(--accent)]/25',
    navy: 'bg-[#1E4378] text-[#A8C7FA] border-[#A8C7FA]/25',
    amber: 'bg-[#443600] text-[#FDE293] border-[#FDE293]/25',
    emerald: 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border-[color:var(--accent)]/25',
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      className="p-5 sm:p-6 rounded-[28px] bg-[#1D2024] border border-white/[0.06] flex flex-col justify-between shadow-lg hover:border-[color:var(--accent)]/25 transition-all"
    >
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl border mb-3 shadow-sm ${colorStyles[color] || colorStyles.mint}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-extrabold text-[#E2E2E6] tracking-tight tabular-nums font-mono">{value}</p>
        <p className="text-[#8E9196] text-xs font-semibold uppercase tracking-wider mt-1">{label}</p>
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
      className={`p-6 sm:p-7 rounded-[28px] bg-[#1D2024] border border-white/[0.06] cursor-pointer group relative flex flex-col justify-between hover:bg-[#22262C] hover:border-[color:var(--accent)]/30 shadow-lg hover:shadow-2xl transition-all ${
        isDraft ? 'border-[#FDE293]/40' : ''
      }`}
    >
      {/* Menu Options Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          id={`module-menu-${module.id}`}
          onClick={onMenuToggle}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E9196] hover:text-[#E2E2E6] hover:bg-white/10 transition cursor-pointer"
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
              className="absolute right-0 top-10 z-50 min-w-[160px] bg-[#272A2F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {deleteConfirm ? (
                <div className="p-2">
                  <p className="text-xs text-[#E2E2E6] mb-2 font-medium">Delete this module?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={onDeleteConfirm}
                      className="flex-1 px-3 py-1.5 rounded-full bg-[#5C2822] text-[#FFB4AB] border border-[#FFB4AB]/30 text-xs font-bold hover:bg-[#690005] transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={onDeleteCancel}
                      className="flex-1 px-3 py-1.5 rounded-full bg-white/10 text-[#C4C7C5] text-xs font-bold hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onDeleteRequest}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#FFB4AB] hover:bg-[#FFB4AB]/10 rounded-xl transition"
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
          <div className="h-32 -mx-6 -mt-6 sm:-mx-7 sm:-mt-7 mb-4 overflow-hidden rounded-t-[28px] relative">
            <img src={module.coverImage} alt={module.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1D2024] via-transparent to-transparent" />
          </div>
        )}

        {/* Module Icon & Badge */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
              isDraft
                ? 'bg-[#443600] text-[#FDE293] border-[#FDE293]/30'
                : 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border-[color:var(--accent)]/30'
            }`}
          >
            {isDraft ? <PenLine className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
          </div>
          {isDraft && (
            <span className="px-3 py-0.5 rounded-full bg-[#443600] border border-[#FDE293]/30 text-[#FDE293] text-[10px] font-extrabold uppercase tracking-wider">
              Draft
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-[#E2E2E6] mb-1.5 pr-8 truncate tracking-tight">
          {module.title}
        </h3>
        {module.description && (
          <p className="text-[#8E9196] text-xs mb-4 line-clamp-2 leading-relaxed">
            {module.description}
          </p>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs mt-4">
        <span className="text-[#8E9196] font-medium">
          {module.questionCount} {module.questionCount === 1 ? 'question' : 'questions'}
        </span>

        {isDraft ? (
          <span className="text-[#FDE293] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Edit →
          </span>
        ) : (
          <div className="flex items-center gap-2">
            {bestScore ? (
              <span
                className={`font-bold font-mono px-2.5 py-0.5 rounded-full border text-[11px] ${
                  bestScore.percentage >= 80
                    ? 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border-[color:var(--accent)]/30'
                    : bestScore.percentage >= 50
                    ? 'bg-[#443600] text-[#FDE293] border-[#FDE293]/30'
                    : 'bg-[#5C2822] text-[#FFB4AB] border-[#FFB4AB]/30'
                }`}
              >
                Best: {bestScore.percentage}%
              </span>
            ) : (
              <span className="text-[#8E9196] font-medium">Unattempted</span>
            )}
            <ChevronRight className="w-4 h-4 text-[color:var(--accent)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
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
      className="p-10 sm:p-14 text-center rounded-[32px] bg-[#1D2024] border-2 border-dashed border-white/10"
    >
      <div className="w-16 h-16 rounded-3xl bg-[color:var(--accent-container)] border border-[color:var(--accent)]/30 text-[color:var(--accent)] flex items-center justify-center mx-auto mb-5 shadow-lg">
        <BookOpen className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold text-[#E2E2E6] mb-2 tracking-tight">No Modules Yet</h3>
      <p className="text-[#8E9196] text-sm mb-6 max-w-md mx-auto leading-relaxed">
        Start building your flashcards & quiz library by uploading a CSV/JSON file or entering questions manually.
      </p>
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreateClick}
        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-xl shadow-[color:var(--accent)]/20 hover:bg-[color:var(--accent-hover)] transition-all cursor-pointer border-0"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        Create First Module
      </motion.button>
    </motion.div>
  );
}
