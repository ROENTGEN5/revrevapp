import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Layers, List, ChevronLeft, ChevronRight,
  Rocket, Eye, EyeOff, CheckSquare, Type, ListOrdered, Sparkles,
  ArrowLeft, ToggleLeft
} from 'lucide-react';

function TypeBadge({ type }) {
  const config = {
    multiple_choice: { label: 'Multiple Choice', icon: CheckSquare, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    identification: { label: 'Identification', icon: Type, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    enumeration: { label: 'Enumeration', icon: ListOrdered, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    true_false: { label: 'True or False', icon: ToggleLeft, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  };
  const { label, icon: Icon, color } = config[type] || config.multiple_choice;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function AnswerDisplay({ question }) {
  if (question.type === 'multiple_choice') {
    return (
      <div className="space-y-2.5 mt-4">
        {question.options.map((opt) => {
          const isCorrect = opt.label === question.correctAnswer;
          return (
            <div
              key={opt.label}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                isCorrect
                  ? 'border-emerald-500/50 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-extrabold font-mono shrink-0 ${
                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'
                }`}
              >
                {opt.label}
              </span>
              <span className={`text-sm font-semibold flex-1 ${isCorrect ? 'text-emerald-300' : 'text-white/70'}`}>
                {opt.text}
              </span>
              {isCorrect && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold uppercase tracking-wider">
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
        <span className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2">Answer:</span>
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15">
          <span className="text-emerald-300 text-lg font-bold font-mono">{question.correctAnswer}</span>
        </div>
      </div>
    );
  }

  if (question.type === 'enumeration') {
    return (
      <div className="mt-4">
        <span className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2">
          Items ({question.correctAnswer.length}):
        </span>
        <div className="flex flex-wrap gap-2">
          {question.correctAnswer.map((item, i) => (
            <span
              key={i}
              className="px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 text-sm font-bold font-mono"
            >
              {i + 1}. {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === 'true_false') {
    const isTrue = question.correctAnswer === 'True';
    return (
      <div className="mt-4">
        <span className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2">Answer:</span>
        <div className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border font-bold text-base ${
          isTrue
            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
            : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
        }`}>
          <span className="text-lg">{isTrue ? '✓' : '✗'}</span>
          <span>{question.correctAnswer}</span>
        </div>
      </div>
    );
  }

  return null;
}

import { saveQuestionMastery } from '../services/firebaseService';

function Flashcard({ question, index, total, onRate }) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [question.id]);

  const boxLevel = question.srs?.boxLevel || 1;

  return (
    <div className="flashcard-perspective w-full max-w-2xl mx-auto">
      <motion.div
        className="flashcard w-full cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div className="flashcard-face flashcard-front glass-apple-card p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold text-sm font-mono shadow-md">
                {index + 1}
              </span>
              <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                Question {index + 1} of {total}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10 text-[10px] font-extrabold uppercase">
                ⚡ Box {boxLevel}
              </span>
              <TypeBadge type={question.type} />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center my-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed text-center tracking-tight">
              {question.question}
            </h2>

            {question.image && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/15 bg-black/40 p-1.5 flex justify-center max-h-44 w-full">
                <img
                  src={question.image}
                  alt="Diagram"
                  className="max-h-40 object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-purple-300/80 font-semibold text-xs bg-white/5 py-2 px-4 rounded-full border border-white/10 mx-auto">
            <Eye className="w-4 h-4" />
            <span>Click or tap to flip card</span>
          </div>
        </div>

        {/* Back */}
        <div className="flashcard-face flashcard-back glass-apple-card p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-extrabold tracking-wide uppercase">Answer Key</span>
            </div>
            <TypeBadge type={question.type} />
          </div>

          <h3 className="text-xs font-semibold text-white/60 mb-1 leading-relaxed">
            {question.question}
          </h3>

          <div className="flex-1 overflow-y-auto my-2 pr-1">
            <AnswerDisplay question={question} />
          </div>

          {/* Spaced Repetition Rating Buttons */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider text-center mb-2.5">
              Rate Recall Difficulty:
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(1);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-300 transition cursor-pointer active:scale-95"
                title="Review tomorrow"
              >
                <span className="text-xs font-bold">Again</span>
                <span className="text-[10px] text-white/50 font-mono">+1d</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(2);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 transition cursor-pointer active:scale-95"
                title="Review in 2 days"
              >
                <span className="text-xs font-bold">Hard</span>
                <span className="text-[10px] text-white/50 font-mono">+2d</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(3);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 transition cursor-pointer active:scale-95"
                title="Review in 6 days"
              >
                <span className="text-xs font-bold">Good</span>
                <span className="text-[10px] text-white/50 font-mono">+6d</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(4);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/35 border border-blue-500/40 text-blue-300 transition cursor-pointer active:scale-95"
                title="Review in 14+ days"
              >
                <span className="text-xs font-bold">Easy</span>
                <span className="text-[10px] text-white/50 font-mono">+14d</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StudySheetItem({ question, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 25 }}
      className="glass-apple-card p-6 sm:p-7"
    >
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold text-xs font-mono shadow-md">
          {index + 1}
        </span>
        <TypeBadge type={question.type} />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed mb-2 tracking-tight">
        {question.question}
      </h3>

      <AnswerDisplay question={question} />
    </motion.div>
  );
}

export default function ReviewerScreen({ questions, onStartExam, onBackToUpload }) {
  const [viewMode, setViewMode] = useState('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

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

  const handleRateCard = async (rating) => {
    if (!currentQ) return;
    try {
      const qId = currentQ.firestoreId || currentQ.id;
      const modId = moduleId || currentQ.moduleId;
      const updatedSrs = await saveQuestionMastery(modId, qId, rating, currentQ.srs || {});
      currentQ.srs = updatedSrs;
    } catch (err) {
      console.error('Error saving question mastery:', err);
    }
    if (!isLast) goNext();
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 sm:py-10 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto mb-6"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Reviewer Mode
            </h1>
          </div>
          <button
            id="back-to-upload-button"
            onClick={onBackToUpload}
            className="px-3.5 py-1.5 rounded-xl glass-apple-btn text-xs font-bold text-white/70 hover:text-white cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-center mb-6">
          <div className="glass-apple-pill inline-flex rounded-2xl p-1.5 gap-2 border border-white/10">
            <button
              id="toggle-flashcard-view"
              onClick={() => setViewMode('flashcard')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'flashcard' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Flashcards</span>
            </button>
            <button
              id="toggle-sheet-view"
              onClick={() => setViewMode('sheet')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'sheet' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Study Sheet</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {viewMode === 'flashcard' ? (
            <motion.div
              key="flashcard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                >
                  <Flashcard
                    question={currentQ}
                    index={currentIndex}
                    total={totalQuestions}
                    onRate={handleRateCard}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Flashcard Action Buttons & Progress Dots */}
              <div className="flex items-center justify-between mt-8 max-w-2xl mx-auto gap-4">
                <button
                  id="flashcard-prev-button"
                  onClick={goPrev}
                  disabled={isFirst}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    isFirst
                      ? 'opacity-40 cursor-not-allowed glass-apple-pill'
                      : 'glass-apple-btn hover:text-white'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Dots indicator */}
                <div className="flex items-center gap-1.5 overflow-x-auto px-2">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all cursor-pointer ${
                        i === currentIndex
                          ? 'bg-purple-400 scale-125 shadow-lg shadow-purple-400/50'
                          : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                <button
                  id="flashcard-next-button"
                  onClick={goNext}
                  disabled={isLast}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    isLast
                      ? 'opacity-40 cursor-not-allowed glass-apple-pill'
                      : 'glass-apple-btn hover:text-white'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-white/40 text-xs font-medium mt-4 text-center hidden sm:block">
                Press <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">←</span> <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">→</span> to switch cards
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="sheet-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
              className="space-y-5"
            >
              {questions.map((q, i) => (
                <StudySheetItem key={q.id} question={q} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating CTA Dock */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-xl px-4">
        <div className="glass-apple-pill p-3 px-6 rounded-full flex items-center justify-between shadow-2xl border border-white/20">
          <p className="text-white/70 text-xs font-semibold hidden sm:block">
            Ready to test your memory?
          </p>
          <motion.button
            id="start-exam-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartExam}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all cursor-pointer border border-white/20 ml-auto sm:ml-0"
          >
            <Rocket className="w-4 h-4" />
            <span>Take Exam</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
