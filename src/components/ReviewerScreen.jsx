import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Layers, List, RotateCcw, ChevronLeft, ChevronRight,
  Rocket, Eye, EyeOff, CheckSquare, Type, ListOrdered, Sparkles,
  ArrowLeft
} from 'lucide-react';

// ─── Type Badge ──────────────────────────────────────────────────
function TypeBadge({ type }) {
  const config = {
    multiple_choice: { label: 'Multiple Choice', icon: CheckSquare, color: 'bg-accent-500/15 text-accent-400' },
    identification: { label: 'Identification', icon: Type, color: 'bg-[oklch(0.72_0.18_200/0.15)] text-[oklch(0.72_0.18_200)]' },
    enumeration: { label: 'Enumeration', icon: ListOrdered, color: 'bg-[oklch(0.78_0.16_80/0.15)] text-[oklch(0.78_0.16_80)]' },
  };
  const { label, icon: Icon, color } = config[type] || config.multiple_choice;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ─── Answer display for a question (used in flashcard back + study sheet) ───
function AnswerDisplay({ question }) {
  if (question.type === 'multiple_choice') {
    return (
      <div className="space-y-2 mt-4">
        {question.options.map((opt) => {
          const isCorrect = opt.label === question.correctAnswer;
          return (
            <div
              key={opt.label}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isCorrect
                  ? 'border-success-border bg-success-bg'
                  : 'border-surface-700/30 bg-surface-800/20'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 ${
                  isCorrect ? 'bg-success-500 text-white' : 'bg-surface-700 text-surface-400'
                }`}
              >
                {opt.label}
              </span>
              <span className={`text-sm font-medium flex-1 ${isCorrect ? 'text-success-400' : 'text-surface-300'}`}>
                {opt.text}
              </span>
              {isCorrect && (
                <span className="correct-badge text-xs font-bold px-2 py-0.5 rounded-md">
                  ✓ Correct
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (question.type === 'identification') {
    return (
      <div className="mt-4">
        <span className="text-surface-400 text-xs font-semibold block mb-2">Answer:</span>
        <div className="p-4 rounded-lg border border-success-border bg-success-bg">
          <span className="text-success-400 text-lg font-bold">{question.correctAnswer}</span>
        </div>
      </div>
    );
  }

  if (question.type === 'enumeration') {
    return (
      <div className="mt-4">
        <span className="text-surface-400 text-xs font-semibold block mb-2">
          Items ({question.correctAnswer.length}):
        </span>
        <div className="flex flex-wrap gap-2">
          {question.correctAnswer.map((item, i) => (
            <span
              key={i}
              className="px-3 py-2 rounded-lg border border-success-border bg-success-bg text-success-400 text-sm font-semibold"
            >
              {i + 1}. {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Flashcard Component ──────────────────────────────────────────
function Flashcard({ question, index, total }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip when question changes
  useEffect(() => {
    setIsFlipped(false);
  }, [question.id]);

  return (
    <div className="flashcard-perspective w-full max-w-2xl mx-auto">
      <motion.div
        className="flashcard w-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div className="flashcard-face flashcard-front glass-strong">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-500/15 text-accent-400 font-bold text-sm">
                {index + 1}
              </span>
              <span className="text-surface-400 text-sm font-medium">
                of {total}
              </span>
            </div>
            <TypeBadge type={question.type} />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-surface-100 leading-relaxed text-center">
              {question.question}
            </h2>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-surface-500">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-medium">Click to reveal answer</span>
          </div>
        </div>

        {/* Back */}
        <div className="flashcard-face flashcard-back glass-strong">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-success-400" />
              <span className="text-success-400 text-sm font-bold">Answer</span>
            </div>
            <TypeBadge type={question.type} />
          </div>

          <h3 className="text-base sm:text-lg font-medium text-surface-300 mb-2 leading-relaxed">
            {question.question}
          </h3>

          <div className="flex-1 overflow-y-auto">
            <AnswerDisplay question={question} />
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-surface-500">
            <EyeOff className="w-4 h-4" />
            <span className="text-xs font-medium">Click to hide answer</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Study Sheet Item ─────────────────────────────────────────────
function StudySheetItem({ question, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="study-sheet-item glass-strong rounded-xl p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-500/15 text-accent-400 font-bold text-sm">
          {index + 1}
        </span>
        <TypeBadge type={question.type} />
      </div>

      {/* Question */}
      <h3 className="text-base sm:text-lg font-semibold text-surface-100 leading-relaxed mb-1">
        {question.question}
      </h3>

      {/* Answer */}
      <AnswerDisplay question={question} />
    </motion.div>
  );
}


// ─── Main Reviewer Screen ─────────────────────────────────────────
export default function ReviewerScreen({ questions, onStartExam, onBackToUpload }) {
  const [viewMode, setViewMode] = useState('flashcard'); // 'flashcard' | 'sheet'
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];

  const mcCount = questions.filter(q => q.type === 'multiple_choice').length;
  const idCount = questions.filter(q => q.type === 'identification').length;
  const enumCount = questions.filter(q => q.type === 'enumeration').length;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation for flashcards
  useEffect(() => {
    if (viewMode !== 'flashcard') return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewMode, goNext, goPrev]);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 sm:py-10 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-surface-100">
              Reviewer Mode
            </h1>
          </div>
          <button
            id="back-to-upload-button"
            onClick={onBackToUpload}
            className="inline-flex items-center gap-1.5 text-surface-400 hover:text-surface-200 text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-surface-400 text-sm font-medium">
            {totalQuestions} Questions
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

        {/* View Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="view-toggle-pill inline-flex rounded-xl p-1 gap-1">
            <button
              id="toggle-flashcard-view"
              onClick={() => setViewMode('flashcard')}
              className={`view-toggle-option inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${
                viewMode === 'flashcard' ? 'active' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Flashcards
            </button>
            <button
              id="toggle-sheet-view"
              onClick={() => setViewMode('sheet')}
              className={`view-toggle-option inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${
                viewMode === 'sheet' ? 'active' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <List className="w-4 h-4" />
              Study Sheet
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {viewMode === 'flashcard' ? (
            <motion.div
              key="flashcard-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Flashcard */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Flashcard
                    question={currentQ}
                    index={currentIndex}
                    total={totalQuestions}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 max-w-2xl mx-auto gap-3">
                <button
                  id="flashcard-prev-button"
                  onClick={goPrev}
                  disabled={isFirst}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    isFirst
                      ? 'bg-surface-800/40 text-surface-600 cursor-not-allowed'
                      : 'bg-surface-800/80 text-surface-200 hover:bg-surface-700/80'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Card Dots */}
                <div className="flex items-center gap-1.5 overflow-x-auto px-2">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all cursor-pointer ${
                        i === currentIndex
                          ? 'bg-accent-400 scale-125'
                          : 'bg-surface-600 hover:bg-surface-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  id="flashcard-next-button"
                  onClick={goNext}
                  disabled={isLast}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    isLast
                      ? 'bg-surface-800/40 text-surface-600 cursor-not-allowed'
                      : 'bg-surface-800/80 text-surface-200 hover:bg-surface-700/80'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Keyboard hint */}
              <p className="text-surface-600 text-xs mt-4 text-center hidden sm:block">
                <span className="font-mono bg-surface-800/60 px-1.5 py-0.5 rounded">←→</span> navigate
                &nbsp;<span className="font-mono bg-surface-800/60 px-1.5 py-0.5 rounded">click</span> flip card
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="sheet-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {questions.map((q, i) => (
                <StudySheetItem key={q.id} question={q} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 floating-cta z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <p className="text-surface-400 text-sm font-medium hidden sm:block">
            Done studying? Test your knowledge →
          </p>
          <motion.button
            id="start-exam-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartExam}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-500 to-[oklch(0.62_0.24_310)] text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-shadow cursor-pointer ml-auto"
          >
            <Rocket className="w-4 h-4" />
            I'm Ready — Take the Exam
          </motion.button>
        </div>
      </div>
    </div>
  );
}
