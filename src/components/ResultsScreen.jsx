import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, MinusCircle, ChevronDown, Type, List, CheckSquare, ToggleLeft } from 'lucide-react';

function ScoreRing({ score, total }) {
  const radius = 64;
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

  let ringColor = '#a855f7'; // Purple default
  if (percentage >= 0.8) ringColor = '#10b981'; // Emerald
  else if (percentage >= 0.5) ringColor = '#f59e0b'; // Amber
  else ringColor = '#f43f5e'; // Rose

  return (
    <div className="relative inline-flex items-center justify-center my-4">
      <svg width="160" height="160" className="score-ring">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="10" />
        <motion.circle
          cx="80" cy="80" r={radius} fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 10px ${ringColor}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-white tracking-tight font-mono">{animatedScore}/{total}</span>
        <span className="text-xs font-bold text-white/50 uppercase tracking-widest mt-0.5">{Math.round(percentage * 100)}%</span>
      </div>
    </div>
  );
}

function TypeTag({ type }) {
  const config = {
    multiple_choice: { label: 'MC', icon: CheckSquare, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    identification: { label: 'ID', icon: Type, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    enumeration: { label: 'ENUM', icon: List, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    true_false: { label: 'T/F', icon: ToggleLeft, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  };
  const { label, icon: Icon, color } = config[type] || config.multiple_choice;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function MCReview({ result }) {
  const { options, correctAnswer, userAnswer, isCorrect } = result;
  return (
    <div className="space-y-2 mt-3">
      {options.map((opt) => {
        const isUserPick = opt.label === userAnswer;
        const isCorrectOption = opt.label === correctAnswer;

        let optionClass = 'border-white/10 bg-white/5';
        let labelClass = 'bg-white/10 text-white/50';
        let suffix = '';

        if (isCorrectOption) {
          optionClass = 'border-emerald-500/50 bg-emerald-500/15';
          labelClass = 'bg-emerald-500 text-white';
          suffix = ' ✓ Correct Answer';
        }
        if (isUserPick && !isCorrect) {
          optionClass = 'border-rose-500/50 bg-rose-500/15';
          labelClass = 'bg-rose-500 text-white';
          suffix = ' ✗ Your Answer';
        }
        if (isUserPick && isCorrect) {
          suffix = ' ✓ Your Answer';
        }

        return (
          <div key={opt.label} className={`flex items-center gap-3 p-3 rounded-xl border ${optionClass}`}>
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono shrink-0 opacity-0 ${labelClass}`}>
              {opt.label}
            </span>
            <span className="text-white/80 text-xs font-medium flex-1">{opt.text}</span>
            {suffix && (
              <span className={`text-xs font-bold shrink-0 ${isCorrectOption ? 'text-emerald-300' : 'text-rose-300'}`}>
                {suffix}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IdentificationReview({ result }) {
  const { correctAnswer, userAnswer, isCorrect, isSkipped } = result;
  return (
    <div className="space-y-2 mt-3">
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
        isSkipped ? 'border-amber-500/40 bg-amber-500/15' :
        isCorrect ? 'border-emerald-500/40 bg-emerald-500/15' :
        'border-rose-500/40 bg-rose-500/15'
      }`}>
        <span className="text-white/50 text-xs font-bold uppercase tracking-wider shrink-0 w-24">Your answer:</span>
        <span className={`text-xs font-bold font-mono flex-1 ${isSkipped ? 'text-amber-300 italic' : 'text-white'}`}>
          {isSkipped ? '(No answer)' : userAnswer}
        </span>
        {!isSkipped && (
          <span className={`text-xs font-extrabold ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>
      {!isCorrect && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15">
          <span className="text-white/50 text-xs font-bold uppercase tracking-wider shrink-0 w-24">Correct:</span>
          <span className="text-emerald-300 text-xs font-bold font-mono flex-1">{correctAnswer}</span>
        </div>
      )}
    </div>
  );
}

function EnumerationReview({ result }) {
  const { correctAnswer, userAnswer, isCorrect, isSkipped } = result;
  const normalizeItem = (s) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
  const correctSet = new Set(correctAnswer.map(normalizeItem));
  const userItems = Array.isArray(userAnswer) ? userAnswer : [];

  return (
    <div className="space-y-3 mt-3">
      <div>
        <span className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2">Your answers:</span>
        <div className="space-y-2">
          {isSkipped || userItems.every(s => !s.trim()) ? (
            <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/15">
              <span className="text-amber-300 text-xs italic font-medium">(No answer)</span>
            </div>
          ) : (
            userItems.map((item, i) => {
              const trimmed = item.trim();
              if (!trimmed) return null;
              const isItemCorrect = correctSet.has(normalizeItem(trimmed));
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isItemCorrect ? 'border-emerald-500/40 bg-emerald-500/15' : 'border-rose-500/40 bg-rose-500/15'
                }`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold font-mono shrink-0 ${
                    isItemCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>{i + 1}</span>
                  <span className="text-white/90 text-xs font-semibold flex-1">{trimmed}</span>
                  <span className={`text-xs font-extrabold ${isItemCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {isItemCorrect ? '✓' : '✗'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      {!isCorrect && (
        <div>
          <span className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2">Correct answers:</span>
          <div className="flex flex-wrap gap-2">
            {correctAnswer.map((item, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 text-xs font-bold font-mono">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrueFalseReview({ result }) {
  const { correctAnswer, userAnswer, isCorrect, isSkipped } = result;
  return (
    <div className="space-y-2 mt-3">
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
        isSkipped ? 'border-amber-500/40 bg-amber-500/15' :
        isCorrect ? 'border-emerald-500/40 bg-emerald-500/15' :
        'border-rose-500/40 bg-rose-500/15'
      }`}>
        <span className="text-white/50 text-xs font-bold uppercase tracking-wider shrink-0 w-24">Your answer:</span>
        <span className={`text-sm font-bold flex-1 ${
          isSkipped ? 'text-amber-300 italic' :
          userAnswer === 'True' ? 'text-emerald-300' : 'text-rose-300'
        }`}>
          {isSkipped ? '(No answer)' : userAnswer}
        </span>
        {!isSkipped && (
          <span className={`text-xs font-extrabold ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>
      {!isCorrect && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15">
          <span className="text-white/50 text-xs font-bold uppercase tracking-wider shrink-0 w-24">Correct:</span>
          <span className="text-emerald-300 text-sm font-bold flex-1">{correctAnswer}</span>
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
    statusIcon = <MinusCircle className="w-5 h-5 text-amber-400" />;
    statusBg = 'border-amber-500/30 bg-amber-500/10';
    statusText = 'Skipped';
  } else if (isCorrect) {
    statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    statusBg = 'border-emerald-500/30 bg-emerald-500/10';
    statusText = 'Correct';
  } else {
    statusIcon = <XCircle className="w-5 h-5 text-rose-400" />;
    statusBg = 'border-rose-500/30 bg-rose-500/10';
    statusText = 'Incorrect';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 25 }}
      className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${statusBg}`}
    >
      <button
        id={`review-item-${index + 1}`}
        className="w-full flex items-center gap-3.5 p-4 sm:p-5 text-left cursor-pointer hover:bg-white/5 transition"
        onClick={() => setExpanded(!expanded)}
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-white/40 text-xs font-extrabold font-mono">Q{index + 1}</span>
            <TypeTag type={type} />
          </div>
          <span className="text-white text-sm font-bold block">{question}</span>
        </div>
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full shrink-0 ${
          isCorrect ? 'bg-emerald-500/20 text-emerald-300' :
          isSkipped ? 'bg-amber-500/20 text-amber-300' :
          'bg-rose-500/20 text-rose-300'
        }`}>
          {statusText}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 pt-1 border-t border-white/5">
          {type === 'multiple_choice' && <MCReview result={result} />}
          {type === 'identification' && <IdentificationReview result={result} />}
          {type === 'enumeration' && <EnumerationReview result={result} />}
          {type === 'true_false' && <TrueFalseReview result={result} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ResultsScreen({ results, score, totalQuestions, onReviewAgain, onReset, onRetake }) {
  const percentage = totalQuestions > 0 ? score / totalQuestions : 0;
  const skipped = results.filter(r => r.isSkipped).length;
  const incorrect = totalQuestions - score - skipped;

  let verdict, verdictColor;
  if (percentage >= 0.9) { verdict = 'Outstanding Mastery! 🎉'; verdictColor = 'text-emerald-300'; }
  else if (percentage >= 0.7) { verdict = 'Great Performance! 👏'; verdictColor = 'text-emerald-300'; }
  else if (percentage >= 0.5) { verdict = 'Solid Practice! 💪'; verdictColor = 'text-amber-300'; }
  else { verdict = 'Needs Additional Study 📚'; verdictColor = 'text-rose-300'; }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 25 }}
        className="w-full max-w-3xl"
      >
        {/* Score Header Card */}
        <div className="glass-apple-card p-8 sm:p-10 text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 15 }}
            className="w-16 h-16 rounded-3xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/10"
          >
            <Trophy className="w-8 h-8 text-amber-400" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">Exam Completed</h1>
          <p className={`text-base font-extrabold ${verdictColor} mb-6`}>{verdict}</p>

          <ScoreRing score={score} total={totalQuestions} />

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-emerald-300 font-mono">{score}</p>
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Correct</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-rose-300 font-mono">{incorrect}</p>
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Incorrect</p>
            </div>
            {skipped > 0 && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-amber-300 font-mono">{skipped}</p>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Skipped</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Question Review Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-white mb-4 tracking-tight">Question Breakdown</h2>
          <div className="space-y-3.5">
            {results.map((result, idx) => (
              <ReviewItem key={result.id} result={result} index={idx} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
          <motion.button
            id="review-again-button"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReviewAgain}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl glass-apple-btn font-bold text-xs hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Review Flashcards</span>
          </motion.button>

          {onRetake && (
            <motion.button
              id="retake-exam-button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRetake}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all cursor-pointer border border-white/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Exam</span>
            </motion.button>
          )}

          <motion.button
            id="back-to-module-button"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl glass-apple-btn font-bold text-xs hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Module</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
