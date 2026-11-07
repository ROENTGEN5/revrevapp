import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, MinusCircle, ChevronDown, Type, ListOrdered, CheckSquare, ToggleLeft } from 'lucide-react';
import { playResultSound, playNavSound, playSubmitSound } from '../utils/soundEffects';
import { getAccentColor } from '../utils/theme';
import confetti from 'canvas-confetti';

function ScoreRing({ score, total }) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? score / total : 0;
  const offset = circumference * (1 - percentage);
  const ringColor = percentage >= 0.8 ? 'var(--accent)' : percentage >= 0.5 ? '#FDE293' : '#FFB4AB';

  return (
    <div className="relative grid size-44 place-items-center shrink-0">
      <svg aria-hidden="true" viewBox="0 0 160 160" className="size-full -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="6" />
        <motion.circle
          cx="80" cy="80" r={radius} fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-[-0.06em] tabular-nums">{Math.round(percentage * 100)}%</span>
        <span className="study-kicker mt-1">Score</span>
      </div>
    </div>
  );
}

function TypeTag({ type }) {
  const config = {
    multiple_choice: { label: 'MC', icon: CheckSquare, color: 'bg-[#4A4458]/40 text-[#D0BCFF] border-[#D0BCFF]/30' },
    identification: { label: 'ID', icon: Type, color: 'bg-[#1E4378]/40 text-[#A8C7FA] border-[#A8C7FA]/30' },
    enumeration: { label: 'ENUM', icon: ListOrdered, color: 'bg-[#443600]/40 text-[#FDE293] border-[#FDE293]/30' },
    true_false: { label: 'T/F', icon: ToggleLeft, color: 'bg-[color:var(--accent-surface)] text-[color:var(--accent)] border-[color:var(--accent)]/30' },
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

        let optionClass = 'border-white/5 bg-[#191C20]';
        let labelClass = 'bg-[#272A2F] text-[#8E9196]';
        let suffix = '';

        if (isCorrectOption) {
          optionClass = 'border-[color:var(--accent)]/40 bg-[color:var(--accent-container)]/30';
          labelClass = 'bg-[color:var(--accent)] text-[color:var(--accent-on)]';
          suffix = ' ✓ Correct Answer';
        }
        if (isUserPick && !isCorrect) {
          optionClass = 'border-[#FFB4AB]/40 bg-[#5C2822]/30';
          labelClass = 'bg-[#FFB4AB] text-[#561E18]';
          suffix = ' ✗ Your Answer';
        }
        if (isUserPick && isCorrect) {
          suffix = ' ✓ Your Answer';
        }

        return (
          <div key={opt.label} className={`grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 p-3 rounded-xl border ${optionClass}`}>
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-bold font-mono shrink-0 ${labelClass}`}>
              {opt.label}
            </span>
            <span className="text-[#E2E2E6] text-sm break-words">{opt.text}</span>
            {suffix && (
              <span className={`col-start-2 sm:col-start-auto text-xs font-bold ${isCorrectOption ? 'text-[color:var(--accent)]' : 'text-[#FFB4AB]'}`}>
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
      <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
        isSkipped ? 'border-[#FDE293]/30 bg-[#443600]/25' :
        isCorrect ? 'border-[color:var(--accent)]/30 bg-[color:var(--accent-container)]/25' :
        'border-[#FFB4AB]/30 bg-[#5C2822]/25'
      }`}>
        <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider shrink-0 w-24">Your answer:</span>
        <span className={`text-xs font-bold font-mono flex-1 ${isSkipped ? 'text-[#FDE293] italic' : 'text-[#E2E2E6]'}`}>
          {isSkipped ? '(No answer)' : userAnswer}
        </span>
        {!isSkipped && (
          <span className={`text-xs font-extrabold ${isCorrect ? 'text-[color:var(--accent)]' : 'text-[#FFB4AB]'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>
      {!isCorrect && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent-container)]/25">
          <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider shrink-0 w-24">Correct:</span>
          <span className="text-[color:var(--accent)] text-xs font-bold font-mono flex-1">{correctAnswer}</span>
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
        <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider block mb-2">Your answers:</span>
        <div className="space-y-2">
          {isSkipped || userItems.every(s => !s.trim()) ? (
            <div className="p-3 rounded-2xl border border-[#FDE293]/30 bg-[#443600]/25">
              <span className="text-[#FDE293] text-xs italic font-medium">(No answer)</span>
            </div>
          ) : (
            userItems.map((item, i) => {
              const trimmed = item.trim();
              if (!trimmed) return null;
              const isItemCorrect = correctSet.has(normalizeItem(trimmed));
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  isItemCorrect ? 'border-[color:var(--accent)]/30 bg-[color:var(--accent-container)]/25' : 'border-[#FFB4AB]/30 bg-[#5C2822]/25'
                }`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold font-mono shrink-0 ${
                    isItemCorrect ? 'bg-[color:var(--accent)] text-[color:var(--accent-on)]' : 'bg-[#FFB4AB] text-[#561E18]'
                  }`}>{i + 1}</span>
                  <span className="text-[#E2E2E6] text-xs font-semibold flex-1">{trimmed}</span>
                  <span className={`text-xs font-extrabold ${isItemCorrect ? 'text-[color:var(--accent)]' : 'text-[#FFB4AB]'}`}>
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
          <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider block mb-2">Correct answers:</span>
          <div className="flex flex-wrap gap-2">
            {correctAnswer.map((item, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full border border-[color:var(--accent)]/30 bg-[color:var(--accent-container)]/30 text-[color:var(--accent)] text-xs font-bold font-mono">
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
      <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
        isSkipped ? 'border-[#FDE293]/30 bg-[#443600]/25' :
        isCorrect ? 'border-[color:var(--accent)]/30 bg-[color:var(--accent-container)]/25' :
        'border-[#FFB4AB]/30 bg-[#5C2822]/25'
      }`}>
        <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider shrink-0 w-24">Your answer:</span>
        <span className={`text-sm font-bold flex-1 ${
          isSkipped ? 'text-[#FDE293] italic' :
          userAnswer === 'True' ? 'text-[color:var(--accent)]' : 'text-[#FFB4AB]'
        }`}>
          {isSkipped ? '(No answer)' : userAnswer}
        </span>
        {!isSkipped && (
          <span className={`text-xs font-extrabold ${isCorrect ? 'text-[color:var(--accent)]' : 'text-[#FFB4AB]'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>
      {!isCorrect && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent-container)]/25">
          <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider shrink-0 w-24">Correct:</span>
          <span className="text-[color:var(--accent)] text-sm font-bold flex-1">{correctAnswer}</span>
        </div>
      )}
    </div>
  );
}

function ReviewItem({ result, index }) {
  const [expanded, setExpanded] = useState(false);
  const { question, type, isCorrect, isSkipped } = result;

  let statusIcon, statusBg, statusText, statusBadge;
  if (isSkipped) {
    statusIcon = <MinusCircle className="w-5 h-5 text-[#FDE293]" />;
    statusBg = 'border-[#FDE293]/20';
    statusText = 'Skipped';
    statusBadge = 'bg-[#443600] text-[#FDE293] border border-[#FDE293]/30';
  } else if (isCorrect) {
    statusIcon = <CheckCircle2 className="w-5 h-5 text-[color:var(--accent)]" />;
    statusBg = 'border-[color:var(--accent)]/20';
    statusText = 'Correct';
    statusBadge = 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30';
  } else {
    statusIcon = <XCircle className="w-5 h-5 text-[#FFB4AB]" />;
    statusBg = 'border-[#FFB4AB]/20';
    statusText = 'Incorrect';
    statusBadge = 'bg-[#5C2822] text-[#FFB4AB] border border-[#FFB4AB]/30';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 25 }}
      className={`study-panel overflow-hidden ${statusBg}`}
    >
      <button
        id={`review-item-${index + 1}`}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2 sm:gap-3.5 p-3.5 sm:p-5 text-left cursor-pointer hover:bg-white/5 focus-visible:outline-offset-[-3px] transition"
        onClick={() => setExpanded(!expanded)}
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[#8E9196] text-xs font-extrabold font-mono">Q{index + 1}</span>
            <TypeTag type={type} />
          </div>
          <span className="text-sm font-semibold break-words block">{question}</span>
        </div>
        <span className={`text-[11px] font-bold px-2 sm:px-3 py-1 rounded-full shrink-0 ${statusBadge}`}>
          {statusText}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-[#8E9196] shrink-0" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        aria-hidden={!expanded}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="px-3.5 sm:px-5 pb-4 pt-1 border-t border-white/10">
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
  const breakdown = [
    { label: 'Correct', count: score, color: 'var(--accent)' },
    { label: 'Incorrect', count: incorrect, color: '#FFB4AB' },
    { label: 'Skipped', count: skipped, color: '#FDE293' },
  ];

  useEffect(() => {
    playResultSound();

    // Confetti celebration for 85%+ scores, tinted with the active accent color
    if (percentage >= 0.85) {
      const colors = [getAccentColor(), '#A8C7FA', '#D0BCFF', '#FDE293', '#FFFFFF'];
      const burst = (originX, angle) =>
        confetti({
          particleCount: 70,
          spread: 70,
          angle,
          origin: { x: originX, y: 0.7 },
          colors,
          disableForReducedMotion: true,
        });
      const t1 = setTimeout(() => { burst(0.1, 60); burst(0.9, 120); }, 250);
      const t2 = setTimeout(() => confetti({
        particleCount: 90,
        spread: 100,
        origin: { x: 0.5, y: 0.55 },
        colors,
        disableForReducedMotion: true,
      }), 700);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let verdict, verdictColor;
  if (percentage >= 0.9) { verdict = 'Outstanding mastery'; verdictColor = 'text-[color:var(--accent)]'; }
  else if (percentage >= 0.7) { verdict = 'Great performance'; verdictColor = 'text-[color:var(--accent)]'; }
  else if (percentage >= 0.5) { verdict = 'Solid practice'; verdictColor = 'text-[#FDE293]'; }
  else { verdict = 'More practice needed'; verdictColor = 'text-[#FFB4AB]'; }

  return (
    <main className="study-page min-h-screen flex flex-col items-center px-4 pt-18 pb-24 sm:px-8 lg:pt-10">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 25 }}
        className="w-full max-w-5xl"
      >
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-white/10">
          <span className="study-icon text-[color:var(--accent)]"><Trophy aria-hidden="true" /></span>
          <span className="study-kicker">QuizForge / Exam report</span>
        </div>
        <section className="study-panel study-highlight mb-8 p-5 sm:p-8" aria-labelledby="exam-results-heading">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 sm:gap-8 text-center sm:text-left">
            <div>
              <p className={`text-sm font-semibold ${verdictColor} mb-2`}>{verdict}</p>
              <h1 id="exam-results-heading" className="text-3xl sm:text-5xl font-bold tracking-[-0.055em]">Exam completed</h1>
              <p className="mt-3 text-sm text-[#b8bac7]">{score} of {totalQuestions} questions answered correctly</p>
            </div>
            <ScoreRing score={score} total={totalQuestions} />
          </div>
          <div aria-hidden="true" className="flex h-1.5 mt-4 rounded-full bg-white/10 overflow-hidden">
            {breakdown.map(({ label, count, color }) => (
              <div key={label} style={{ flexGrow: count, backgroundColor: color }} />
            ))}
          </div>
          <dl className="grid grid-cols-3 divide-x divide-white/10 mt-5">
            {breakdown.map(({ label, count, color }) => (
              <div key={label} className="flex flex-col-reverse items-center gap-1 py-1">
                <dt className="study-kicker">{label}</dt>
                <dd className="text-2xl font-semibold tabular-nums" style={{ color }}>{count}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Question Review Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 tracking-tight">Question breakdown</h2>
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
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playNavSound();
              onReviewAgain();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#272A2F] text-[#E2E2E6] hover:bg-[#32353A] border border-white/10 font-bold text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[color:var(--accent)]" />
            <span>Review Flashcards</span>
          </motion.button>

          {onRetake && (
            <motion.button
              id="retake-exam-button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSubmitSound();
                onRetake();
              }}
              className="study-primary w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Retake Exam</span>
            </motion.button>
          )}

          <motion.button
            id="back-to-module-button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playNavSound();
              onReset();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#272A2F] text-[#E2E2E6] hover:bg-[#32353A] border border-white/10 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Module</span>
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
