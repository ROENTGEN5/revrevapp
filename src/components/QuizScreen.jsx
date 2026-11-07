import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send, BookOpen, Type, ListOrdered, CheckSquare, ToggleLeft } from 'lucide-react';
import { useQuiz } from '../hooks/useQuiz';
import ProgressBar from './ProgressBar';
import QuestionNav from './QuestionNav';
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
    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border shadow-sm ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function MultipleChoiceOptions({ question, selectedAnswer, onSelect }) {
  return (
    <div className="space-y-3.5">
      {question.options.map((option) => {
        const isSelected = selectedAnswer === option.label;
        return (
          <motion.button
            key={option.label}
            id={`option-${option.label}`}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            aria-pressed={isSelected}
            className={`w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-xl text-left border transition-colors cursor-pointer ${
              isSelected
                ? 'border-[color:var(--accent)] bg-[color:var(--accent-container)]/40 shadow-lg shadow-[color:var(--accent)]/10'
                : 'border-white/10 bg-[#0e0f14] hover:bg-[#191b24] hover:border-white/20'
            }`}
            onClick={() => {
              playChoiceSound();
              onSelect(option.label);
            }}
          >
            <span
              className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-extrabold font-mono shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-md'
                  : 'bg-[#272A2F] text-[#8E9196]'
              }`}
            >
              {option.label}
            </span>
            <span className={`min-w-0 break-words text-sm sm:text-base font-medium leading-snug transition-colors ${
              isSelected ? 'text-[#E2E2E6]' : 'text-[#C4C7C5]'
            }`}>
              {option.text}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function IdentificationInput({ question, currentValue, onChange }) {
  return (
    <div className="space-y-3">
      <label htmlFor={`identification-input-${question.id}`} className="study-kicker block mb-2">
        Type your answer:
      </label>
      <input
        id={`identification-input-${question.id}`}
        type="text"
        value={currentValue || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type answer here..."
        autoComplete="off"
        className="w-full px-4 py-3.5 rounded-xl bg-[#0e0f14] border border-white/10 text-base text-[#E2E2E6] placeholder:text-[#8E9196] focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 focus:outline-none transition-all"
      />
      <p className="text-[#8E9196] text-xs font-medium">
        Case-insensitive evaluation.
      </p>
    </div>
  );
}

function EnumerationInput({ question, currentValues, onChange }) {
  const count = question.itemCount;
  const values = currentValues || new Array(count).fill('');

  const handleItemChange = (index, value) => {
    const updated = [...values];
    while (updated.length < count) updated.push('');
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <p className="study-kicker mb-2">
        List <span className="text-[color:var(--accent)] font-extrabold">{count}</span> items (any order):
      </p>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#272A2F] text-[#8E9196] text-xs font-extrabold font-mono shrink-0">
            {i + 1}
          </span>
          <input
            id={`enum-input-${question.id}-${i}`}
            aria-label={`Item ${i + 1}`}
            type="text"
            value={values[i] || ''}
            onChange={(e) => handleItemChange(i, e.target.value)}
            placeholder={`Item ${i + 1}...`}
            autoComplete="off"
            className="min-w-0 flex-1 px-4 py-3.5 rounded-xl bg-[#0e0f14] border border-white/10 text-base text-[#E2E2E6] placeholder:text-[#8E9196] focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 focus:outline-none transition-all"
          />
        </div>
      ))}
    </div>
  );
}

function TrueFalseOptions({ selectedAnswer, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {['True', 'False'].map((val) => {
        const isSelected = selectedAnswer === val;
        const isTrue = val === 'True';
        return (
          <motion.button
            key={val}
            id={`tf-option-${val.toLowerCase()}`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            aria-pressed={isSelected}
            className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl text-base font-bold border transition-colors cursor-pointer ${
              isSelected
                ? 'border-[color:var(--accent)] bg-[color:var(--accent-container)]/40 text-[color:var(--accent)]'
                : 'border-white/10 bg-[#0e0f14] text-[#C4C7C5] hover:border-white/20 hover:text-[#E2E2E6]'
            }`}
            onClick={() => {
              playChoiceSound();
              onSelect(val);
            }}
          >
            <span aria-hidden="true" className="text-2xl font-mono">{isTrue ? '✓' : '✗'}</span>
            <span className="text-lg tracking-wide">{val}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function QuizScreen({ questions, onSubmit, onReset }) {
  const quiz = useQuiz(questions);
  const [selectedZoomImage, setSelectedZoomImage] = useState(null);

  const handleKeyDown = useCallback((e) => {
    if (quiz.isSubmitted) return;

    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      playNavSound();
      quiz.goNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      playNavSound();
      quiz.goPrev();
    } else if (['1', '2', '3', '4'].includes(e.key) && quiz.currentQuestion?.type === 'multiple_choice') {
      const idx = parseInt(e.key) - 1;
      const option = quiz.currentQuestion?.options[idx];
      if (option) {
        playChoiceSound();
        quiz.selectAnswer(quiz.currentQuestion.id, option.label);
      }
    } else if (quiz.currentQuestion?.type === 'true_false') {
      if (e.key.toLowerCase() === 't') {
        playChoiceSound();
        quiz.selectAnswer(quiz.currentQuestion.id, 'True');
      } else if (e.key.toLowerCase() === 'f') {
        playChoiceSound();
        quiz.selectAnswer(quiz.currentQuestion.id, 'False');
      }
    }
  }, [quiz]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = () => {
    playSubmitSound();
    quiz.submitQuiz();
    onSubmit(quiz.results, quiz.score, quiz.totalQuestions);
  };

  const currentQ = quiz.currentQuestion;
  const isFirst = quiz.currentIndex === 0;
  const isLast = quiz.currentIndex === quiz.totalQuestions - 1;

  return (
    <main className="study-page min-h-screen flex flex-col px-4 pt-18 pb-24 sm:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl mx-auto mb-5"
      >
        <div className="flex items-center justify-between gap-2 mb-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="study-icon text-[color:var(--accent)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="study-kicker">QuizForge</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Exam Mode
              </h1>
            </div>
          </div>
          <button
            id="reset-quiz-button"
            onClick={onReset}
            className="px-4 py-2 rounded-full bg-[#272A2F] hover:bg-[#32353A] border border-white/10 text-xs font-bold text-[#E2E2E6] cursor-pointer transition"
          >
            ✕ Exit Exam
          </button>
        </div>

        {/* Progress Bar */}
        <div className="study-panel px-4 py-3 sm:px-5">
          <ProgressBar
            progress={quiz.progress}
            totalAnswered={quiz.totalAnswered}
            totalQuestions={quiz.totalQuestions}
          />
        </div>
      </motion.div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-5 w-full max-w-5xl mx-auto">
        {/* Question Card */}
        <div className="min-w-0 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={quiz.currentIndex}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="study-panel p-4 sm:p-8 flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Question Info Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-4 border-b border-white/10">
                  <span className="study-kicker">Question {quiz.currentIndex + 1} of {quiz.totalQuestions}</span>
                  <TypeBadge type={currentQ?.type} />
                </div>

                {/* Question Prompt */}
                <h2 className="text-xl sm:text-2xl font-semibold leading-snug break-words mb-6 tracking-tight">
                  {currentQ?.question}
                </h2>

                {/* Question Diagram Image */}
                {currentQ?.image && (
                  <div className="my-5 overflow-hidden rounded-[20px] border border-white/10 bg-[#16191D] p-2 flex justify-center">
                    <img
                      src={currentQ.image}
                      alt="Question Diagram"
                      className="max-h-60 object-contain rounded-xl cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setSelectedZoomImage(currentQ.image)}
                    />
                  </div>
                )}

                {/* Question Inputs */}
                {currentQ?.type === 'multiple_choice' && (
                  <MultipleChoiceOptions
                    question={currentQ}
                    selectedAnswer={quiz.answers[currentQ.id]}
                    onSelect={(label) => quiz.selectAnswer(currentQ.id, label)}
                  />
                )}

                {currentQ?.type === 'identification' && (
                  <IdentificationInput
                    question={currentQ}
                    currentValue={quiz.answers[currentQ.id]}
                    onChange={(value) => quiz.selectAnswer(currentQ.id, value)}
                  />
                )}

                {currentQ?.type === 'enumeration' && (
                  <EnumerationInput
                    question={currentQ}
                    currentValues={quiz.answers[currentQ.id]}
                    onChange={(values) => quiz.selectAnswer(currentQ.id, values)}
                  />
                )}

                {currentQ?.type === 'true_false' && (
                  <TrueFalseOptions
                    selectedAnswer={quiz.answers[currentQ.id]}
                    onSelect={(val) => quiz.selectAnswer(currentQ.id, val)}
                  />
                )}
              </div>

              {/* Keyboard Shortcuts Hint */}
              <p className="text-[#8E9196] text-xs font-medium mt-8 hidden sm:block">
                Press <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[#E2E2E6]">←</span> <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[#E2E2E6]">→</span> to navigate
                {currentQ?.type === 'multiple_choice' && (
                  <> or <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[#E2E2E6]">1-4</span> to select option</>
                )}
                {currentQ?.type === 'true_false' && (
                  <> or <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[#E2E2E6]">T</span> / <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[#E2E2E6]">F</span> to select</>
                )}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Action Control Buttons */}
          <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
            <button
              id="prev-question-button"
              onClick={() => {
                playNavSound();
                quiz.goPrev();
              }}
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

            {isLast ? (
              <motion.button
                id="submit-exam-button"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="study-primary"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Submit Exam</span>
              </motion.button>
            ) : (
              <button
                id="next-question-button"
                onClick={() => {
                  playNavSound();
                  quiz.goNext();
                }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#272A2F] text-[#E2E2E6] hover:bg-[#32353A] border border-white/10 font-bold text-xs transition cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Question Nav Grid */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:w-64 shrink-0"
        >
          <div className="study-panel p-5 lg:sticky lg:top-6">
            <h3 className="study-kicker mb-4">
              Question map
            </h3>
            <QuestionNav
              questions={questions}
              answers={quiz.answers}
              currentIndex={quiz.currentIndex}
              onNavigate={quiz.goToQuestion}
            />
          </div>
        </motion.div>
      </div>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {selectedZoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer"
            onClick={() => setSelectedZoomImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[85vh] p-3 rounded-[32px] bg-[#1D2024] border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedZoomImage}
                alt="Enlarged Diagram"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
              />
              <button
                onClick={() => setSelectedZoomImage(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#5C2822] text-[#FFB4AB] border border-[#FFB4AB]/30 flex items-center justify-center text-xs font-bold shadow-2xl hover:bg-[#690005] transition cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
