import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send, BookOpen, Type, List, CheckSquare, ToggleLeft } from 'lucide-react';
import { useQuiz } from '../hooks/useQuiz';
import ProgressBar from './ProgressBar';
import QuestionNav from './QuestionNav';

function TypeBadge({ type }) {
  const config = {
    multiple_choice: { label: 'Multiple Choice', icon: CheckSquare, color: 'bg-purple-950/40 text-purple-400 border-purple-800/40' },
    identification: { label: 'Identification', icon: Type, color: 'bg-blue-950/40 text-blue-400 border-blue-800/40' },
    enumeration: { label: 'Enumeration', icon: List, color: 'bg-amber-950/40 text-amber-400 border-amber-800/40' },
    true_false: { label: 'True or False', icon: ToggleLeft, color: 'bg-teal-950/40 text-teal-400 border-teal-800/40' },
  };
  const { label, icon: Icon, color } = config[type] || config.multiple_choice;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${color}`}>
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
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            className={`option-card w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl text-left border ${
              isSelected
                ? 'selected border-[#C60C30] bg-[rgba(198,12,48,0.18)] shadow-lg'
                : 'border-white/10'
            }`}
            onClick={() => onSelect(option.label)}
          >
            <span
              className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-extrabold font-mono shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#C60C30] text-white shadow-md'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {option.label}
            </span>
            <span className={`text-sm sm:text-base font-semibold leading-snug transition-colors ${
              isSelected ? 'text-white' : 'text-white/80'
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
      <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
        Type your answer:
      </label>
      <input
        id={`identification-input-${question.id}`}
        type="text"
        value={currentValue || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type answer here..."
        autoComplete="off"
        className="w-full px-5 py-4 rounded-2xl glass-apple-input text-base font-semibold placeholder:text-white/30 focus:ring-2 focus:ring-[#C60C30]/30"
      />
      <p className="text-white/40 text-xs font-medium">
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
      <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
        List <span className="text-[#C60C30] font-extrabold">{count}</span> items (any order):
      </label>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 text-white/80 text-xs font-extrabold font-mono shrink-0">
            {i + 1}
          </span>
          <input
            id={`enum-input-${question.id}-${i}`}
            type="text"
            value={values[i] || ''}
            onChange={(e) => handleItemChange(i, e.target.value)}
            placeholder={`Item ${i + 1}...`}
            autoComplete="off"
            className="flex-1 px-4 py-3.5 rounded-xl glass-apple-input text-sm font-semibold placeholder:text-white/30 focus:ring-2 focus:ring-[#C60C30]/30"
          />
        </div>
      ))}
    </div>
  );
}

function TrueFalseOptions({ question, selectedAnswer, onSelect }) {
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
            className={`flex flex-col items-center justify-center gap-2 py-8 rounded-2xl text-base font-extrabold border transition-all cursor-pointer ${
              isSelected
                ? isTrue
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-md'
                  : 'border-red-500 bg-red-950/40 text-red-300 shadow-md'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
            }`}
            onClick={() => onSelect(val)}
          >
            <span className="text-2xl">{isTrue ? '✓' : '✗'}</span>
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
    } else if (quiz.currentQuestion?.type === 'true_false') {
      if (e.key.toLowerCase() === 't') {
        quiz.selectAnswer(quiz.currentQuestion.id, 'True');
      } else if (e.key.toLowerCase() === 'f') {
        quiz.selectAnswer(quiz.currentQuestion.id, 'False');
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
        className="w-full max-w-4xl mx-auto mb-4"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/40 text-[#C60C30] border border-red-800/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Exam Mode
            </h1>
          </div>
          <button
            id="reset-quiz-button"
            onClick={onReset}
            className="px-3.5 py-1.5 rounded-xl glass-apple-btn text-xs font-bold text-white/70 hover:text-white cursor-pointer"
          >
            ✕ Exit Exam
          </button>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          progress={quiz.progress}
          totalAnswered={quiz.totalAnswered}
          totalQuestions={quiz.totalQuestions}
        />
      </motion.div>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full max-w-4xl mx-auto mt-4">
        {/* Question Card */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={quiz.currentIndex}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="glass-apple-card p-6 sm:p-8 flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Question Info Header */}
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-red-950/40 text-[#C60C30] border border-red-800/40 font-extrabold text-sm font-mono shadow-sm">
                      {quiz.currentIndex + 1}
                    </span>
                    <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Question {quiz.currentIndex + 1} of {quiz.totalQuestions}
                    </span>
                  </div>
                  <TypeBadge type={currentQ?.type} />
                </div>

                {/* Question Prompt */}
                <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed mb-4 tracking-tight">
                  {currentQ?.question}
                </h2>

                {/* Question Diagram Image */}
                {currentQ?.image && (
                  <div className="my-4 overflow-hidden rounded-2xl border border-white/15 bg-black/40 p-2 flex justify-center">
                    <img
                      src={currentQ.image}
                      alt="Question Diagram"
                      className="max-h-56 object-contain rounded-xl cursor-pointer hover:scale-105 transition-transform"
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
                    question={currentQ}
                    selectedAnswer={quiz.answers[currentQ.id]}
                    onSelect={(val) => quiz.selectAnswer(currentQ.id, val)}
                  />
                )}
              </div>

              {/* Keyboard Shortcuts Hint */}
              <p className="text-white/40 text-xs font-medium mt-8 hidden sm:block">
                Press <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">←</span> <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">→</span> to navigate
                {currentQ?.type === 'multiple_choice' && (
                  <> or <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">1-4</span> to select option</>
                )}
                {currentQ?.type === 'true_false' && (
                  <> or <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">T</span> / <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">F</span> to select</>
                )}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Action Control Buttons */}
          <div className="flex items-center justify-between mt-5 gap-4">
            <button
              id="prev-question-button"
              onClick={quiz.goPrev}
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

            {isLast ? (
              <motion.button
                id="submit-exam-button"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm bg-[#C60C30] text-white shadow-xl shadow-[rgba(198,12,48,0.3)] hover:bg-[#A00825] transition-all cursor-pointer border border-[rgba(255,255,255,0.15)]"
              >
                <Send className="w-4 h-4" />
                <span>Submit Exam</span>
              </motion.button>
            ) : (
              <button
                id="next-question-button"
                onClick={quiz.goNext}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass-apple-btn font-bold text-xs hover:text-white transition cursor-pointer"
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
          className="lg:w-60 shrink-0"
        >
          <div className="glass-apple-card p-5 lg:sticky lg:top-6">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">
              Questions Map
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
            onClick={() => setSelectedZoomImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-[85vh] p-2 glass-apple-card border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedZoomImage}
                alt="Enlarged Diagram"
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              <button
                onClick={() => setSelectedZoomImage(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-2xl hover:bg-rose-500 transition cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
