import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send, BookOpen, Type, List, CheckSquare } from 'lucide-react';
import { useQuiz } from '../hooks/useQuiz';
import ProgressBar from './ProgressBar';
import QuestionNav from './QuestionNav';

/** Badge showing the question type */
function TypeBadge({ type }) {
  const config = {
    multiple_choice: { label: 'Multiple Choice', icon: CheckSquare, color: 'bg-accent-500/15 text-accent-400' },
    identification: { label: 'Identification', icon: Type, color: 'bg-[oklch(0.72_0.18_200/0.15)] text-[oklch(0.72_0.18_200)]' },
    enumeration: { label: 'Enumeration', icon: List, color: 'bg-[oklch(0.78_0.16_80/0.15)] text-[oklch(0.78_0.16_80)]' },
  };
  const { label, icon: Icon, color } = config[type] || config.multiple_choice;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

/** Multiple Choice options */
function MultipleChoiceOptions({ question, selectedAnswer, onSelect }) {
  return (
    <div className="space-y-3">
      {question.options.map((option) => {
        const isSelected = selectedAnswer === option.label;
        return (
          <motion.button
            key={option.label}
            id={`option-${option.label}`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`option-card w-full flex items-center gap-4 p-4 sm:p-5 rounded-xl border text-left ${
              isSelected
                ? 'selected border-accent-500/50'
                : 'border-surface-700/50 hover:border-surface-500/50'
            }`}
            onClick={() => onSelect(option.label)}
          >
            <span
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold shrink-0 transition-colors duration-200 ${
                isSelected
                  ? 'bg-accent-500 text-white'
                  : 'bg-surface-800 text-surface-400'
              }`}
            >
              {option.label}
            </span>
            <span className={`text-sm sm:text-base font-medium transition-colors ${
              isSelected ? 'text-surface-100' : 'text-surface-300'
            }`}>
              {option.text}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Identification text input */
function IdentificationInput({ question, currentValue, onChange }) {
  return (
    <div className="space-y-3">
      <label className="block text-surface-400 text-sm font-medium mb-2">
        Type your answer below:
      </label>
      <input
        id={`identification-input-${question.id}`}
        type="text"
        value={currentValue || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your answer..."
        autoComplete="off"
        className="w-full px-5 py-4 rounded-xl border border-surface-700/50 bg-surface-900/40 text-surface-100 text-base font-medium placeholder:text-surface-600 focus:outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/20 transition-all"
      />
      <p className="text-surface-600 text-xs">
        Answer is checked case-insensitively.
      </p>
    </div>
  );
}

/** Enumeration — multiple text inputs */
function EnumerationInput({ question, currentValues, onChange }) {
  const count = question.itemCount;
  const values = currentValues || new Array(count).fill('');

  const handleItemChange = (index, value) => {
    const updated = [...values];
    // Ensure array is long enough
    while (updated.length < count) updated.push('');
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-surface-400 text-sm font-medium mb-2">
        List <span className="text-accent-400 font-bold">{count}</span> items (any order):
      </label>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-800 text-surface-400 text-sm font-bold shrink-0">
            {i + 1}
          </span>
          <input
            id={`enum-input-${question.id}-${i}`}
            type="text"
            value={values[i] || ''}
            onChange={(e) => handleItemChange(i, e.target.value)}
            placeholder={`Item ${i + 1}...`}
            autoComplete="off"
            className="flex-1 px-4 py-3 rounded-xl border border-surface-700/50 bg-surface-900/40 text-surface-100 text-sm font-medium placeholder:text-surface-600 focus:outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/20 transition-all"
          />
        </div>
      ))}
      <p className="text-surface-600 text-xs">
        Order doesn't matter. Answers are checked case-insensitively.
      </p>
    </div>
  );
}


export default function QuizScreen({ questions, onSubmit, onReset }) {
  const quiz = useQuiz(questions);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (quiz.isSubmitted) return;

    // Only handle arrow keys if not focused on an input
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      quiz.goNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      quiz.goPrev();
    } else if (['1', '2', '3', '4'].includes(e.key) && quiz.currentQuestion?.type === 'multiple_choice') {
      const labels = ['A', 'B', 'C', 'D'];
      const idx = parseInt(e.key) - 1;
      const option = quiz.currentQuestion?.options[idx];
      if (option) {
        quiz.selectAnswer(quiz.currentQuestion.id, option.label);
      }
    }
  }, [quiz]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = () => {
    quiz.submitQuiz();
    onSubmit(quiz.results, quiz.score, quiz.totalQuestions);
  };

  const currentQ = quiz.currentQuestion;
  const isFirst = quiz.currentIndex === 0;
  const isLast = quiz.currentIndex === quiz.totalQuestions - 1;

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 sm:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-surface-100">
              Quiz Mode
            </h1>
          </div>
          <button
            id="reset-quiz-button"
            onClick={onReset}
            className="text-surface-400 hover:text-surface-200 text-sm font-medium transition-colors cursor-pointer"
          >
            ✕ Exit
          </button>
        </div>

        {/* Progress */}
        <ProgressBar
          progress={quiz.progress}
          totalAnswered={quiz.totalAnswered}
          totalQuestions={quiz.totalQuestions}
        />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full max-w-4xl mx-auto mt-6">
        {/* Question Card */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={quiz.currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong rounded-2xl p-6 sm:p-8 flex-1"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-500/15 text-accent-400 font-bold text-sm">
                    {quiz.currentIndex + 1}
                  </span>
                  <span className="text-surface-400 text-sm font-medium">
                    of {quiz.totalQuestions} questions
                  </span>
                </div>
                <TypeBadge type={currentQ?.type} />
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-semibold text-surface-100 leading-relaxed mb-8">
                {currentQ?.question}
              </h2>

              {/* Answer Area — renders differently based on type */}
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

              {/* Keyboard Hint */}
              <p className="text-surface-600 text-xs mt-6 hidden sm:block">
                <span className="font-mono bg-surface-800/60 px-1.5 py-0.5 rounded">←→</span> navigate
                {currentQ?.type === 'multiple_choice' && (
                  <> &nbsp;<span className="font-mono bg-surface-800/60 px-1.5 py-0.5 rounded">1-4</span> select answer</>
                )}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              id="prev-question-button"
              onClick={quiz.goPrev}
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

            {isLast ? (
              <motion.button
                id="submit-exam-button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-500 to-[oklch(0.62_0.24_310)] text-white shadow-lg shadow-accent-500/20 hover:shadow-accent-500/30 transition-shadow cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Submit Exam
              </motion.button>
            ) : (
              <button
                id="next-question-button"
                onClick={quiz.goNext}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-surface-800/80 text-surface-200 hover:bg-surface-700/80 transition-all cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Question Navigator */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:w-56 shrink-0"
        >
          <div className="glass rounded-2xl p-4 lg:sticky lg:top-6">
            <h3 className="text-surface-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Questions
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
    </div>
  );
}
