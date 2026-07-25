import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Upload, CheckCircle2, XCircle, MinusCircle, ChevronDown, Type, List, CheckSquare } from 'lucide-react';

function ScoreRing({ score, total }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? score / total : 0;
  const offset = circumference * (1 - percentage);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  let ringColor = 'oklch(0.65 0.25 280)';
  if (percentage >= 0.8) ringColor = 'oklch(0.72 0.22 155)';
  else if (percentage >= 0.5) ringColor = 'oklch(0.78 0.16 80)';
  else ringColor = 'oklch(0.68 0.22 25)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="score-ring">
        <circle className="score-ring-track" cx="70" cy="70" r={radius} fill="none" strokeWidth="8" />
        <motion.circle
          cx="70" cy="70" r={radius} fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-surface-100 tabular-nums">{animatedScore}/{total}</span>
        <span className="text-xs text-surface-400 font-medium mt-0.5">{Math.round(percentage * 100)}%</span>
      </div>
    </div>
  );
}

/** Type badge for review items */
function TypeTag({ type }) {
  const config = {
    multiple_choice: { label: 'MC', icon: CheckSquare, color: 'bg-accent-500/20 text-accent-400' },
    identification: { label: 'ID', icon: Type, color: 'bg-[oklch(0.72_0.18_200/0.2)] text-[oklch(0.72_0.18_200)]' },
    enumeration: { label: 'ENUM', icon: List, color: 'bg-[oklch(0.78_0.16_80/0.2)] text-[oklch(0.78_0.16_80)]' },
  };
  const { label, icon: Icon, color } = config[type] || config.multiple_choice;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

/** Review for Multiple Choice */
function MCReview({ result }) {
  const { options, correctAnswer, userAnswer, isCorrect } = result;
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isUserPick = opt.label === userAnswer;
        const isCorrectOption = opt.label === correctAnswer;

        let optionClass = 'border-surface-700/30 bg-surface-800/20';
        let labelClass = 'bg-surface-700 text-surface-400';
        let suffix = '';

        if (isCorrectOption) {
          optionClass = 'border-success-border bg-success-bg';
          labelClass = 'bg-success-500 text-white';
          suffix = ' ✓ Correct Answer';
        }
        if (isUserPick && !isCorrect) {
          optionClass = 'border-danger-border bg-danger-bg';
          labelClass = 'bg-danger-500 text-white';
          suffix = ' ✗ Your Answer';
        }
        if (isUserPick && isCorrect) {
          suffix = ' ✓ Your Answer';
        }

        return (
          <div key={opt.label} className={`flex items-center gap-3 p-3 rounded-lg border ${optionClass}`}>
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0 ${labelClass}`}>
              {opt.label}
            </span>
            <span className="text-surface-200 text-sm flex-1">{opt.text}</span>
            {suffix && (
              <span className={`text-xs font-semibold shrink-0 ${isCorrectOption ? 'text-success-400' : 'text-danger-400'}`}>
                {suffix}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Review for Identification */
function IdentificationReview({ result }) {
  const { correctAnswer, userAnswer, isCorrect, isSkipped } = result;
  return (
    <div className="space-y-2">
      {/* User's answer */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        isSkipped ? 'border-warning-border/40 bg-warning-bg/30' :
        isCorrect ? 'border-success-border bg-success-bg' :
        'border-danger-border bg-danger-bg'
      }`}>
        <span className="text-surface-400 text-xs font-semibold shrink-0 w-20">Your answer:</span>
        <span className={`text-sm font-medium flex-1 ${isSkipped ? 'text-warning-400 italic' : 'text-surface-100'}`}>
          {isSkipped ? '(No answer)' : userAnswer}
        </span>
        {!isSkipped && (
          <span className={`text-xs font-semibold ${isCorrect ? 'text-success-400' : 'text-danger-400'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>
      {/* Correct answer (show if wrong or skipped) */}
      {!isCorrect && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-success-border bg-success-bg">
          <span className="text-surface-400 text-xs font-semibold shrink-0 w-20">Correct:</span>
          <span className="text-success-400 text-sm font-semibold flex-1">{correctAnswer}</span>
        </div>
      )}
    </div>
  );
}

/** Review for Enumeration */
function EnumerationReview({ result }) {
  const { correctAnswer, userAnswer, isCorrect, isSkipped } = result;
  const normalizeItem = (s) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
  const correctSet = new Set(correctAnswer.map(normalizeItem));
  const userItems = Array.isArray(userAnswer) ? userAnswer : [];

  return (
    <div className="space-y-3">
      {/* User's answers */}
      <div>
        <span className="text-surface-400 text-xs font-semibold block mb-2">Your answers:</span>
        <div className="space-y-1.5">
          {isSkipped || userItems.every(s => !s.trim()) ? (
            <div className="p-3 rounded-lg border border-warning-border/40 bg-warning-bg/30">
              <span className="text-warning-400 text-sm italic">(No answer)</span>
            </div>
          ) : (
            userItems.map((item, i) => {
              const trimmed = item.trim();
              if (!trimmed) return null;
              const isItemCorrect = correctSet.has(normalizeItem(trimmed));
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isItemCorrect ? 'border-success-border bg-success-bg' : 'border-danger-border bg-danger-bg'
                }`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold shrink-0 ${
                    isItemCorrect ? 'bg-success-500 text-white' : 'bg-danger-500 text-white'
                  }`}>{i + 1}</span>
                  <span className="text-surface-200 text-sm flex-1">{trimmed}</span>
                  <span className={`text-xs font-semibold ${isItemCorrect ? 'text-success-400' : 'text-danger-400'}`}>
                    {isItemCorrect ? '✓' : '✗'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Correct answers (always show for reference) */}
      {!isCorrect && (
        <div>
          <span className="text-surface-400 text-xs font-semibold block mb-2">Correct answers:</span>
          <div className="flex flex-wrap gap-2">
            {correctAnswer.map((item, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg border border-success-border bg-success-bg text-success-400 text-sm font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewItem({ result, index }) {
  const [expanded, setExpanded] = useState(false);
  const { question, type, isCorrect, isSkipped } = result;

  let statusIcon, statusBg, statusText;
  if (isSkipped) {
    statusIcon = <MinusCircle className="w-5 h-5 text-warning-400" />;
    statusBg = 'border-warning-border/40 bg-warning-bg/30';
    statusText = 'Skipped';
  } else if (isCorrect) {
    statusIcon = <CheckCircle2 className="w-5 h-5 text-success-400" />;
    statusBg = 'border-success-border/40 bg-success-bg/30';
    statusText = 'Correct';
  } else {
    statusIcon = <XCircle className="w-5 h-5 text-danger-400" />;
    statusBg = 'border-danger-border/40 bg-danger-bg/30';
    statusText = 'Incorrect';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`rounded-xl border overflow-hidden ${statusBg}`}
    >
      <button
        id={`review-item-${index + 1}`}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-surface-500 text-xs font-semibold">Q{index + 1}</span>
            <TypeTag type={type} />
          </div>
          <span className="text-surface-200 text-sm font-medium block mt-0.5">{question}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${
          isCorrect ? 'bg-success-500/20 text-success-400' :
          isSkipped ? 'bg-warning-500/20 text-warning-400' :
          'bg-danger-500/20 text-danger-400'
        }`}>
          {statusText}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-surface-500 shrink-0" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4">
          {type === 'multiple_choice' && <MCReview result={result} />}
          {type === 'identification' && <IdentificationReview result={result} />}
          {type === 'enumeration' && <EnumerationReview result={result} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ResultsScreen({ results, score, totalQuestions, onReviewAgain, onReset, onRetake, moduleId }) {
  const percentage = totalQuestions > 0 ? score / totalQuestions : 0;
  const skipped = results.filter(r => r.isSkipped).length;
  const incorrect = totalQuestions - score - skipped;

  let verdict, verdictColor;
  if (percentage >= 0.9) { verdict = 'Outstanding! 🎉'; verdictColor = 'text-success-400'; }
  else if (percentage >= 0.7) { verdict = 'Great job! 👏'; verdictColor = 'text-success-400'; }
  else if (percentage >= 0.5) { verdict = 'Keep practicing! 💪'; verdictColor = 'text-warning-400'; }
  else { verdict = 'Needs improvement 📚'; verdictColor = 'text-danger-400'; }

  // Count by type
  const mcCount = results.filter(r => r.type === 'multiple_choice').length;
  const idCount = results.filter(r => r.type === 'identification').length;
  const enumCount = results.filter(r => r.type === 'enumeration').length;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl"
      >
        {/* Score Header */}
        <div className="glass-strong rounded-2xl p-8 sm:p-10 text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Trophy className="w-10 h-10 text-accent-400 mx-auto mb-4" />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-100 mb-2">Exam Complete</h1>
          <p className={`text-lg font-semibold ${verdictColor} mb-6`}>{verdict}</p>

          <ScoreRing score={score} total={totalQuestions} />

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-success-400">{score}</p>
              <p className="text-xs text-surface-400 font-medium">Correct</p>
            </div>
            <div className="w-px h-8 bg-surface-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-danger-400">{incorrect}</p>
              <p className="text-xs text-surface-400 font-medium">Incorrect</p>
            </div>
            {skipped > 0 && (
              <>
                <div className="w-px h-8 bg-surface-700" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning-400">{skipped}</p>
                  <p className="text-xs text-surface-400 font-medium">Skipped</p>
                </div>
              </>
            )}
          </div>

          {/* Question type breakdown */}
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {mcCount > 0 && (
              <span className="text-xs font-medium text-surface-400 bg-surface-800/60 px-3 py-1 rounded-lg">
                {mcCount} Multiple Choice
              </span>
            )}
            {idCount > 0 && (
              <span className="text-xs font-medium text-surface-400 bg-surface-800/60 px-3 py-1 rounded-lg">
                {idCount} Identification
              </span>
            )}
            {enumCount > 0 && (
              <span className="text-xs font-medium text-surface-400 bg-surface-800/60 px-3 py-1 rounded-lg">
                {enumCount} Enumeration
              </span>
            )}
          </div>
        </div>

        {/* Review Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-surface-200 mb-4">Review Answers</h2>
          <div className="space-y-3">
            {results.map((result, idx) => (
              <ReviewItem key={result.id} result={result} index={idx} />
            ))}
          </div>
        </div>

        {/* Dual Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-10">
          <motion.button
            id="review-again-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReviewAgain}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base bg-surface-800/80 border border-surface-600/50 text-surface-200 hover:bg-surface-700/80 hover:border-surface-500/50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            Review Again
          </motion.button>

          {onRetake && (
            <motion.button
              id="retake-exam-button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRetake}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-accent-500 to-[oklch(0.62_0.24_310)] text-white shadow-lg shadow-accent-500/20 hover:shadow-accent-500/30 transition-shadow cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </motion.button>
          )}

          <motion.button
            id="back-to-module-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReset}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base bg-surface-800/80 border border-surface-600/50 text-surface-200 hover:bg-surface-700/80 hover:border-surface-500/50 transition-all cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            Back to Module
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
