import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send, BookOpen, Type, ListOrdered, CheckSquare, ToggleLeft } from 'lucide-react';
import { useQuiz } from '../hooks/useQuiz';
import ProgressBar from './ProgressBar';
import QuestionNav from './QuestionNav';

function TypeBadge({ type }) {
  const config = {
    multiple_choice: { label: 'Multiple Choice', icon: CheckSquare, color: 'bg-[#4A4458]/40 text-[#D0BCFF] border-[#D0BCFF]/30' },
    identification: { label: 'Identification', icon: Type, color: 'bg-[#1E4378]/40 text-[#A8C7FA] border-[#A8C7FA]/30' },
    enumeration: { label: 'Enumeration', icon: ListOrdered, color: 'bg-[#443600]/40 text-[#FDE293] border-[#FDE293]/30' },
    true_false: { label: 'True or False', icon: ToggleLeft, color: 'bg-[#16251E] text-[#A8E8BC] border-[#A8E8BC]/30' },
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
            className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-[20px] text-left border transition-all cursor-pointer ${
              isSelected
                ? 'border-[#A8E8BC] bg-[#1B5238]/40 shadow-lg shadow-[#A8E8BC]/10'
                : 'border-white/[0.08] bg-[#191C20] hover:bg-[#272A2F] hover:border-white/20'
            }`}
            onClick={() => onSelect(option.label)}
          >
            <span
              className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-extrabold font-mono shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#A8E8BC] text-[#003822] shadow-md'
                  : 'bg-[#272A2F] text-[#8E9196]'
              }`}
            >
              {option.label}
            </span>
            <span className={`text-sm sm:text-base font-semibold leading-snug transition-colors ${
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
      <label className="block text-[#8E9196] text-xs font-bold uppercase tracking-wider mb-2">
        Type your answer:
      </label>
      <input
        id={`identification-input-${question.id}`}
        type="text"
        value={currentValue || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type answer here..."
        autoComplete="off"
        className="w-full px-5 py-4 rounded-2xl bg-[#191C20] border border-white/10 text-base font-semibold text-[#E2E2E6] placeholder:text-[#8E9196] focus:border-[#A8E8BC] focus:ring-2 focus:ring-[#A8E8BC]/20 focus:outline-none transition-all"
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
      <label className="block text-[#8E9196] text-xs font-bold uppercase tracking-wider mb-2">
        List <span className="text-[#A8E8BC] font-extrabold">{count}</span> items (any order):
      </label>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#272A2F] text-[#8E9196] text-xs font-extrabold font-mono shrink-0">
            {i + 1}
          </span>
          <input
            id={`enum-input-${question.id}-${i}`}
            type="text"
            value={values[i] || ''}
            onChange={(e) => handleItemChange(i, e.target.value)}
            placeholder={`Item ${i + 1}...`}
            autoComplete="off"
            className="flex-1 px-4 py-3.5 rounded-xl bg-[#191C20] border border-white/10 text-sm font-semibold text-[#E2E2E6] placeholder:text-[#8E9196] focus:border-[#A8E8BC] focus:ring-2 focus:ring-[#A8E8BC]/20 focus:outline-none transition-all"
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
            className={`flex flex-col items-center justify-center gap-2 py-8 rounded-[24px] text-base font-extrabold border transition-all cursor-pointer ${
              isSelected
                ? isTrue
                  ? 'border-[#7BD99F] bg-[#1B5238] text-[#A8E8BC] shadow-lg shadow-[#A8E8BC]/20'
                  : 'border-[#FFB4AB] bg-[#5C2822] text-[#FFB4AB] shadow-lg shadow-[#FFB4AB]/20'
                : 'border-white/10 bg-[#191C20] text-[#C4C7C5] hover:border-white/20 hover:text-[#E2E2E6]'
            }`}
            onClick={() => onSelect(val)}
          >
            <span className="text-3xl font-mono">{isTrue ? '✓' : '✗'}</span>
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
    <div className="min-h-screen flex flex-col px-4 py-6 sm:py-10 bg-[#111318] text-[#E2E2E6]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto mb-4"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#1B5238] text-[#A8E8BC] border border-[#A8E8BC]/30 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#E2E2E6] tracking-tight">
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
              className="p-7 sm:p-9 rounded-[32px] bg-[#1D2024] border border-white/[0.06] shadow-xl flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Question Info Header */}
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#1B5238] text-[#A8E8BC] border border-[#A8E8BC]/30 font-extrabold text-sm font-mono shadow-sm">
                      {quiz.currentIndex + 1}
                    </span>
                    <span className="text-[#8E9196] text-xs font-semibold uppercase tracking-wider">
                      Question {quiz.currentIndex + 1} of {quiz.totalQuestions}
                    </span>
                  </div>
                  <TypeBadge type={currentQ?.type} />
                </div>

                {/* Question Prompt */}
                <h2 className="text-lg sm:text-xl font-bold text-[#E2E2E6] leading-relaxed mb-6 tracking-tight">
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
                    question={currentQ}
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
          <div className="flex items-center justify-between mt-5 gap-4">
            <button
              id="prev-question-button"
              onClick={quiz.goPrev}
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
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm bg-[#A8E8BC] text-[#003822] shadow-xl shadow-[#A8E8BC]/20 hover:bg-[#B9F2CB] transition-all cursor-pointer border-0"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Submit Exam</span>
              </motion.button>
            ) : (
              <button
                id="next-question-button"
                onClick={quiz.goNext}
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
          <div className="p-6 rounded-[28px] bg-[#1D2024] border border-white/[0.06] lg:sticky lg:top-6 shadow-xl">
            <h3 className="text-[#8E9196] text-xs font-bold uppercase tracking-wider mb-4">
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
    </div>
  );
}
