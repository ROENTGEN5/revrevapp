import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, CheckSquare, Type, ListOrdered, ArrowRight,
  AlertCircle, GripVertical, ChevronDown, PenLine, Image as ImageIcon,
  X, Loader2, ToggleLeft
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: CheckSquare, color: 'accent' },
  { value: 'identification', label: 'Identification', icon: Type, color: 'info' },
  { value: 'enumeration', label: 'Enumeration', icon: ListOrdered, color: 'warning' },
  { value: 'true_false', label: 'True or False', icon: ToggleLeft, color: 'teal' },
];

const TYPE_STYLES = {
  multiple_choice: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  identification: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  enumeration: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  true_false: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

const EMPTY_MC = {
  type: 'multiple_choice',
  question: '',
  image: null,
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: '',
};

const EMPTY_ID = {
  type: 'identification',
  question: '',
  image: null,
  correctAnswer: '',
};

const EMPTY_ENUM = {
  type: 'enumeration',
  question: '',
  image: null,
  enumItems: ['', ''],
};

const EMPTY_TF = {
  type: 'true_false',
  question: '',
  image: null,
  correctAnswer: '',
};

function getEmptyForm(type) {
  if (type === 'identification') return { ...EMPTY_ID };
  if (type === 'enumeration') return { ...EMPTY_ENUM, enumItems: ['', ''] };
  if (type === 'true_false') return { ...EMPTY_TF };
  return { ...EMPTY_MC };
}

// ─── Question Type Selector ──────────────────────────────────────
function TypeSelector({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUESTION_TYPES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
            selected === value
              ? TYPE_STYLES[value]
              : 'bg-surface-800/40 text-surface-400 border-surface-700/50 hover:bg-surface-800/70 hover:text-surface-300'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────
function FormInput({ label, value, onChange, placeholder, required, multiline }) {
  const baseClass =
    'w-full bg-surface-900/60 border border-surface-700/50 rounded-xl px-4 py-3 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all';

  return (
    <div>
      {label && (
        <label className="block text-surface-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">
          {label}
          {required && <span className="text-danger-400 ml-1">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}

function QuestionImageUploader({ image, onImageChange }) {
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      setCompressing(true);
      const compressedDataUrl = await compressImage(file, 800, 800, 0.75);
      onImageChange(compressedDataUrl);
    } catch (err) {
      alert(err.message || 'Image compression failed');
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div className="mt-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {!image ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={compressing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 text-xs font-semibold transition cursor-pointer"
        >
          {compressing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Compressing image...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Attach Diagram / Image (Auto-Compressed)</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative inline-block mt-1 group">
          <img
            src={image}
            alt="Question Diagram"
            className="w-32 h-24 object-cover rounded-xl border border-white/20 shadow-md"
          />
          <button
            type="button"
            onClick={() => onImageChange(null)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-lg hover:bg-rose-500 transition cursor-pointer"
            title="Remove Diagram"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Multiple Choice Options ──────────────────────────────────────
function MCOptions({ form, setForm }) {
  const labels = ['A', 'B', 'C', 'D'];
  return (
    <div className="space-y-3">
      <label className="block text-surface-300 text-xs font-semibold uppercase tracking-wide">
        Options <span className="text-danger-400 ml-1">*</span>
      </label>
      {labels.map((label) => {
        const key = `option${label}`;
        const isCorrect = form.correctAnswer === label;
        return (
          <div key={label} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, correctAnswer: label })}
              className={`shrink-0 w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                isCorrect
                  ? 'bg-success-bg border-success-border text-success-400 shadow-md shadow-success-500/10'
                  : 'bg-surface-800/60 border-surface-700/50 text-surface-400 hover:border-surface-500'
              }`}
              title={`Set ${label} as correct answer`}
            >
              {label}
            </button>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={`Option ${label}${label === 'C' || label === 'D' ? ' (optional)' : ''}`}
              className="flex-1 bg-surface-900/60 border border-surface-700/50 rounded-xl px-4 py-3 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>
        );
      })}
      {form.correctAnswer && (
        <p className="text-xs text-success-400 font-medium mt-1">
          ✓ Correct answer: {form.correctAnswer}
        </p>
      )}
      {!form.correctAnswer && (
        <p className="text-xs text-surface-500 font-medium mt-1">
          Click a letter to mark it as the correct answer
        </p>
      )}
    </div>
  );
}

// ─── Enumeration Items ────────────────────────────────────────────
function EnumItems({ form, setForm }) {
  const items = form.enumItems || ['', ''];

  const updateItem = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    setForm({ ...form, enumItems: updated });
  };

  const addItem = () => {
    setForm({ ...form, enumItems: [...items, ''] });
  };

  const removeItem = (index) => {
    if (items.length <= 2) return;
    setForm({ ...form, enumItems: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <label className="block text-surface-300 text-xs font-semibold uppercase tracking-wide">
        Answer Items <span className="text-danger-400 ml-1">*</span>
        <span className="text-surface-500 font-normal normal-case ml-2">
          (min. 2 items)
        </span>
      </label>
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3"
          >
            <span className="shrink-0 w-8 h-8 rounded-lg bg-[oklch(0.78_0.16_80/0.15)] text-[oklch(0.78_0.16_80)] flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={`Item ${i + 1}`}
              className="flex-1 bg-surface-900/60 border border-surface-700/50 rounded-xl px-4 py-3 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={items.length <= 2}
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                items.length <= 2
                  ? 'text-surface-700 cursor-not-allowed'
                  : 'text-surface-500 hover:text-danger-400 hover:bg-danger-bg'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-2 text-sm text-accent-400 font-semibold hover:text-accent-300 transition-colors cursor-pointer mt-1"
      >
        <Plus className="w-4 h-4" />
        Add item
      </button>
    </div>
  );
}

// ─── True or False Options ────────────────────────────────────────
function TFOptions({ form, setForm }) {
  return (
    <div className="space-y-3">
      <label className="block text-surface-300 text-xs font-semibold uppercase tracking-wide">
        Correct Answer <span className="text-danger-400 ml-1">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {['True', 'False'].map((val) => {
          const isSelected = form.correctAnswer === val;
          const isTrue = val === 'True';
          return (
            <button
              key={val}
              type="button"
              onClick={() => setForm({ ...form, correctAnswer: val })}
              className={`flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                isSelected
                  ? isTrue
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/10'
                  : 'bg-surface-800/40 border-surface-700/50 text-surface-400 hover:bg-surface-800/70 hover:text-surface-300'
              }`}
            >
              <span className="text-lg font-extrabold">{isTrue ? '✓' : '✗'}</span>
              <span>{val}</span>
            </button>
          );
        })}
      </div>
      {form.correctAnswer && (
        <p className="text-xs text-success-400 font-medium mt-1">
          ✓ Correct answer: {form.correctAnswer}
        </p>
      )}
      {!form.correctAnswer && (
        <p className="text-xs text-surface-500 font-medium mt-1">
          Click True or False to set the correct answer
        </p>
      )}
    </div>
  );
}

// ─── Added Question Preview ───────────────────────────────────────
function QuestionPreview({ questions, onRemove }) {
  if (questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-surface-200 text-sm font-semibold">
          Added Questions ({questions.length})
        </h3>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {questions.map((q, i) => (
            <motion.div
              key={q._tempId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/40 border border-surface-700/30 group"
            >
              <span className="shrink-0 w-7 h-7 rounded-lg bg-surface-800 text-surface-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-200 font-medium truncate">
                  {q.question}
                </p>
                <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${TYPE_STYLES[q.type]}`}>
                  {q.type.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(q._tempId)}
                className="shrink-0 p-1.5 rounded-lg text-surface-600 hover:text-danger-400 hover:bg-danger-bg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                title="Remove question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


// ─── Main Form Component ──────────────────────────────────────────
export default function ManualEntryForm({ onQuizReady, submitLabel, disabled, onQuestionsChange, initialQuestions }) {
  const [form, setForm] = useState(getEmptyForm('multiple_choice'));
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [error, setError] = useState(null);
  let nextId = 0;

  // Notify parent whenever questions change (for auto-save)
  const prevQuestionsRef = useRef(questions);
  useEffect(() => {
    if (onQuestionsChange && questions !== prevQuestionsRef.current) {
      prevQuestionsRef.current = questions;
      onQuestionsChange(questions);
    }
  }, [questions, onQuestionsChange]);

  const handleTypeChange = useCallback((type) => {
    setForm(getEmptyForm(type));
    setError(null);
  }, []);

  const validateAndAdd = useCallback(() => {
    setError(null);

    // Validate question text
    if (!form.question.trim()) {
      setError('Please enter a question.');
      return;
    }

    let normalizedQ;

    if (form.type === 'multiple_choice') {
      if (!form.optionA.trim() || !form.optionB.trim()) {
        setError('Options A and B are required.');
        return;
      }
      if (!form.correctAnswer) {
        setError('Please select the correct answer (A, B, C, or D).');
        return;
      }
      // Check that the selected answer has text
      const answerKey = `option${form.correctAnswer}`;
      if (!form[answerKey]?.trim()) {
        setError(`Option ${form.correctAnswer} is selected as correct but has no text.`);
        return;
      }

      const options = [
        { label: 'A', text: form.optionA.trim() },
        { label: 'B', text: form.optionB.trim() },
        form.optionC.trim() ? { label: 'C', text: form.optionC.trim() } : null,
        form.optionD.trim() ? { label: 'D', text: form.optionD.trim() } : null,
      ].filter(Boolean);

      normalizedQ = {
        _tempId: Date.now() + Math.random(),
        type: 'multiple_choice',
        question: form.question.trim(),
        image: form.image || null,
        options,
        correctAnswer: form.correctAnswer,
      };
    } else if (form.type === 'identification') {
      if (!form.correctAnswer.trim()) {
        setError('Please enter the correct answer.');
        return;
      }
      normalizedQ = {
        _tempId: Date.now() + Math.random(),
        type: 'identification',
        question: form.question.trim(),
        image: form.image || null,
        correctAnswer: form.correctAnswer.trim(),
      };
    } else if (form.type === 'enumeration') {
      const items = (form.enumItems || []).map((s) => s.trim()).filter(Boolean);
      if (items.length < 2) {
        setError('Enumeration requires at least 2 items.');
        return;
      }
      normalizedQ = {
        _tempId: Date.now() + Math.random(),
        type: 'enumeration',
        question: form.question.trim(),
        image: form.image || null,
        correctAnswer: items,
        itemCount: items.length,
      };
    } else if (form.type === 'true_false') {
      if (!form.correctAnswer) {
        setError('Please select True or False as the correct answer.');
        return;
      }
      normalizedQ = {
        _tempId: Date.now() + Math.random(),
        type: 'true_false',
        question: form.question.trim(),
        image: form.image || null,
        correctAnswer: form.correctAnswer,
      };
    }

    setQuestions((prev) => [...prev, normalizedQ]);
    // Reset form but keep the same type
    setForm(getEmptyForm(form.type));
  }, [form]);

  const removeQuestion = useCallback((tempId) => {
    setQuestions((prev) => prev.filter((q) => q._tempId !== tempId));
  }, []);

  const handleProceed = useCallback(() => {
    if (questions.length === 0) {
      setError('Add at least one question before proceeding.');
      return;
    }
    // Assign proper ids
    const finalQuestions = questions.map((q, i) => {
      const { _tempId, ...rest } = q;
      return { ...rest, id: i };
    });
    onQuizReady(finalQuestions);
  }, [questions, onQuizReady]);

  return (
    <div className="space-y-6">
      {/* Type Selector */}
      <div>
        <label className="block text-surface-300 text-xs font-semibold mb-2 uppercase tracking-wide">
          Question Type
        </label>
        <TypeSelector selected={form.type} onChange={handleTypeChange} />
      </div>

      {/* Question Text */}
      <div>
        <FormInput
          label="Question"
          value={form.question}
          onChange={(v) => setForm({ ...form, question: v })}
          placeholder="Enter your question here..."
          required
          multiline
        />
        {/* Question Diagram Attachment Uploader */}
        <QuestionImageUploader
          image={form.image}
          onImageChange={(img) => setForm({ ...form, image: img })}
        />
      </div>

      {/* Type-specific fields */}
      <AnimatePresence mode="wait">
        <motion.div
          key={form.type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {form.type === 'multiple_choice' && (
            <MCOptions form={form} setForm={setForm} />
          )}

          {form.type === 'identification' && (
            <FormInput
              label="Correct Answer"
              value={form.correctAnswer}
              onChange={(v) => setForm({ ...form, correctAnswer: v })}
              placeholder="Enter the correct answer..."
              required
            />
          )}

          {form.type === 'enumeration' && (
            <EnumItems form={form} setForm={setForm} />
          )}

          {form.type === 'true_false' && (
            <TFOptions form={form} setForm={setForm} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-danger-bg border border-danger-border"
          >
            <AlertCircle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
            <p className="text-danger-400 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={validateAndAdd}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-surface-800/80 text-surface-200 hover:bg-surface-700/80 border border-surface-700/50 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Question
      </motion.button>

      {/* Preview of added questions */}
      <QuestionPreview questions={questions} onRemove={removeQuestion} />

      {/* Proceed Button */}
      <AnimatePresence>
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleProceed}
              disabled={disabled}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-500 to-[oklch(0.62_0.24_310)] text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-shadow cursor-pointer disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              {submitLabel || `Continue with ${questions.length} Question${questions.length !== 1 ? 's' : ''}`}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
