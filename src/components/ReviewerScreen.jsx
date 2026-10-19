import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Layers, List, ChevronLeft, ChevronRight,
  Rocket, Eye, CheckSquare, Type, ListOrdered, Sparkles,
  ArrowLeft, ToggleLeft
} from 'lucide-react';
import { saveQuestionMastery } from '../services/firebaseService';
import { playChoiceSound, playNavSound, playSubmitSound } from '../utils/soundEffects';

function TypeBadge({ type }) {
  const config = {
    multiple_choice: { label: 'Multiple Choice', icon: CheckSquare, color: 'bg-[#4A4458]/40 text-[#D0BCFF] border-[#D0BCFF]/30' },
    identification: { label: 'Identification', icon: Type, color: 'bg-[#1E4378]/40 text-[#A8C7FA] border-[#A8C7FA]/30' },
    enumeration: { label: 'Enumeration', icon: ListOrdered, color: 'bg-[#443600]/40 text-[#FDE293] border-[#FDE293]/30' },
    true_false: { label: 'True or False', icon: ToggleLeft, color: 'bg-[color:var(--accent-surface)] text-[color:var(--accent)] border-[color:var(--accent)]/30' },
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
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                isCorrect
                  ? 'border-[color:var(--accent)]/40 bg-[color:var(--accent-container)]/30 shadow-md shadow-[color:var(--accent)]/10'
                  : 'border-white/5 bg-[#191C20]'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-extrabold font-mono shrink-0 ${
                  isCorrect ? 'bg-[color:var(--accent)] text-[color:var(--accent-on)]' : 'bg-[#272A2F] text-[#8E9196]'
                }`}
              >
                {opt.label}
              </span>
              <span className={`text-sm font-semibold flex-1 ${isCorrect ? 'text-[color:var(--accent)]' : 'text-[#C4C7C5]'}`}>
                {opt.text}
              </span>
              {isCorrect && (
                <span className="px-3 py-0.5 rounded-full bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 text-[11px] font-extrabold uppercase tracking-wider">
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
        <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider block mb-2">Answer:</span>
        <div className="p-4 rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent-container)]/30">
          <span className="text-[color:var(--accent)] text-lg font-bold font-mono">{question.correctAnswer}</span>
        </div>
      </div>
    );
  }

  if (question.type === 'enumeration') {
    return (
      <div className="mt-4">
        <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider block mb-2">
          Items ({question.correctAnswer.length}):
        </span>
        <div className="flex flex-wrap gap-2">
          {question.correctAnswer.map((item, i) => (
            <span
              key={i}
              className="px-3.5 py-2 rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent-container)]/30 text-[color:var(--accent)] text-sm font-bold font-mono"
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
        <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider block mb-2">Answer:</span>
        <div className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl border font-bold text-base ${
          isTrue
            ? 'border-[color:var(--accent)]/40 bg-[color:var(--accent-container)]/30 text-[color:var(--accent)]'
            : 'border-[#FFB4AB]/40 bg-[#5C2822]/30 text-[#FFB4AB]'
        }`}>
          <span className="text-lg">{isTrue ? '✓' : '✗'}</span>
          <span>{question.correctAnswer}</span>
        </div>
      </div>
    );
  }

  return null;
}

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
        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        onClick={() => {
          playChoiceSound();
          setIsFlipped(!isFlipped);
        }}
      >
        {/* Front */}
        <div className="flashcard-face flashcard-front p-8 sm:p-10 flex flex-col justify-between rounded-[32px] bg-[#1D2024] border border-white/[0.06] shadow-2xl">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 font-extrabold text-sm font-mono shadow-md">
                {index + 1}
              </span>
              <span className="text-[#8E9196] text-xs font-semibold uppercase tracking-wider">
                Question {index + 1} of {total}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#272A2F] text-[#E2E2E6] border border-white/10 text-[10px] font-extrabold uppercase">
                ⚡ Box {boxLevel}
              </span>
              <TypeBadge type={question.type} />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center my-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#E2E2E6] leading-relaxed text-center tracking-tight">
              {question.question}
            </h2>

            {question.image && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#16191D] p-2 flex justify-center max-h-48 w-full">
                <img
                  src={question.image}
                  alt="Diagram"
                  className="max-h-44 object-contain rounded-xl"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-[color:var(--accent)] font-semibold text-xs bg-[#272A2F] py-2 px-5 rounded-full border border-white/10 mx-auto shadow-sm">
            <Eye className="w-4 h-4" />
            <span>Click or tap to flip card</span>
          </div>
        </div>

        {/* Back */}
        <div className="flashcard-face flashcard-back p-8 sm:p-10 flex flex-col justify-between rounded-[32px] bg-[#22262C] border border-white/[0.08] shadow-2xl">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[color:var(--accent)]" />
              <span className="text-[color:var(--accent)] text-sm font-extrabold tracking-wide uppercase">Answer Key</span>
            </div>
            <TypeBadge type={question.type} />
          </div>

          <h3 className="text-xs font-semibold text-[#8E9196] mb-1 leading-relaxed">
            {question.question}
          </h3>

          <div className="flex-1 overflow-y-auto my-2 pr-1">
            <AnswerDisplay question={question} />
          </div>

          {/* Spaced Repetition Recall Rating Buttons */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs font-semibold text-[#8E9196] uppercase tracking-wider text-center mb-2.5">
              Rate Recall Difficulty:
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playChoiceSound();
                  onRate(1);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-2xl bg-[#5C2822]/40 hover:bg-[#5C2822]/70 border border-[#FFB4AB]/30 text-[#FFB4AB] transition cursor-pointer active:scale-95"
                title="Review tomorrow"
              >
                <span className="text-xs font-bold">Again</span>
                <span className="text-[10px] text-white/50 font-mono">+1d</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playChoiceSound();
                  onRate(2);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-2xl bg-[#443600]/40 hover:bg-[#443600]/70 border border-[#FDE293]/30 text-[#FDE293] transition cursor-pointer active:scale-95"
                title="Review in 2 days"
              >
                <span className="text-xs font-bold">Hard</span>
                <span className="text-[10px] text-white/50 font-mono">+2d</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playChoiceSound();
                  onRate(3);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-2xl bg-[color:var(--accent-container)]/40 hover:bg-[color:var(--accent-container)]/70 border border-[color:var(--accent)]/30 text-[color:var(--accent)] transition cursor-pointer active:scale-95"
                title="Review in 6 days"
              >
                <span className="text-xs font-bold">Good</span>
                <span className="text-[10px] text-white/50 font-mono">+6d</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playChoiceSound();
                  onRate(4);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-2xl bg-[#1E4378]/40 hover:bg-[#1E4378]/70 border border-[#A8C7FA]/30 text-[#A8C7FA] transition cursor-pointer active:scale-95"
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
      className="p-6 sm:p-7 rounded-[28px] bg-[#1D2024] border border-white/[0.06] shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 font-extrabold text-xs font-mono shadow-md">
          {index + 1}
        </span>
        <TypeBadge type={question.type} />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#E2E2E6] leading-relaxed mb-2 tracking-tight">
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
    playNavSound();
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goPrev = useCallback(() => {
    playNavSound();
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
      const modId = currentQ.moduleId;
      if (modId && qId) {
        const updatedSrs = await saveQuestionMastery(modId, qId, rating, currentQ.srs || {});
        currentQ.srs = updatedSrs;
      }
    } catch (err) {
      console.error('Error saving question mastery:', err);
    }
    if (!isLast) goNext();
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 sm:py-10 pb-28 bg-[#111318] text-[#E2E2E6]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto mb-6"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#4A4458] text-[#D0BCFF] border border-[#D0BCFF]/30 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#E2E2E6] tracking-tight">
              Reviewer Mode
            </h1>
          </div>
          <button
            id="back-to-upload-button"
            onClick={() => {
              playNavSound();
              onBackToUpload();
            }}
            className="px-4 py-2 rounded-full bg-[#272A2F] hover:bg-[#32353A] border border-white/10 text-xs font-bold text-[#E2E2E6] cursor-pointer inline-flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4 text-[color:var(--accent)]" />
            <span>Back</span>
          </button>
        </div>

        {/* Pixel View Switcher Tabs */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex rounded-full p-1.5 gap-1.5 bg-[#1D2024] border border-white/10 shadow-lg">
            <button
              id="toggle-flashcard-view"
              onClick={() => {
                playNavSound();
                setViewMode('flashcard');
              }}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'flashcard'
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-md'
                  : 'text-[#8E9196] hover:text-[#E2E2E6]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Flashcards</span>
            </button>
            <button
              id="toggle-sheet-view"
              onClick={() => {
                playNavSound();
                setViewMode('sheet');
              }}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'sheet'
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-md'
                  : 'text-[#8E9196] hover:text-[#E2E2E6]'
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
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    isFirst
                      ? 'opacity-30 cursor-not-allowed bg-[#1D2024] text-[#8E9196]'
                      : 'bg-[#272A2F] text-[#E2E2E6] hover:bg-[#32353A] border border-white/10'
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
                      onClick={() => {
                        playNavSound();
                        setCurrentIndex(i);
                      }}
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all cursor-pointer ${
                        i === currentIndex
                          ? 'bg-[color:var(--accent)] scale-125 shadow-md shadow-[color:var(--accent)]/40'
                          : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                <button
                  id="flashcard-next-button"
                  onClick={goNext}
                  disabled={isLast}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    isLast
                      ? 'opacity-30 cursor-not-allowed bg-[#1D2024] text-[#8E9196]'
                      : 'bg-[#272A2F] text-[#E2E2E6] hover:bg-[#32353A] border border-white/10'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[#8E9196] text-xs font-medium mt-4 text-center hidden sm:block">
                Press <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[#E2E2E6]">←</span> <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[#E2E2E6]">→</span> to switch cards
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

      {/* Floating Pixel CTA Dock */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-xl px-4">
        <div className="p-3 px-6 rounded-full flex items-center justify-between shadow-2xl bg-[#1D2024] border border-white/15 backdrop-blur-xl">
          <p className="text-[#C4C7C5] text-xs font-semibold hidden sm:block">
            Ready to test your memory?
          </p>
          <motion.button
            id="start-exam-button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playSubmitSound();
              onStartExam();
            }}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full font-bold text-xs bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-lg shadow-[color:var(--accent)]/20 hover:bg-[color:var(--accent-hover)] transition-all cursor-pointer border-0 ml-auto sm:ml-0"
          >
            <Rocket className="w-4 h-4 stroke-[2.5]" />
            <span>Take Exam</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
