import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, MinusCircle, ChevronDown, Type, ListOrdered, CheckSquare, ToggleLeft } from 'lucide-react';
import { playResultSound, playNavSound, playSubmitSound } from '../utils/soundEffects';

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

  let ringColor = '#A8E8BC'; // Pixel Mint default
  if (percentage >= 0.8) ringColor = '#A8E8BC'; // Pixel Mint
  else if (percentage >= 0.5) ringColor = '#FDE293'; // Pixel Gold
  else ringColor = '#FFB4AB'; // Pixel Coral

  return (
    <div className="relative inline-flex items-center justify-center my-4">
      <svg width="160" height="160" className="score-ring">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="10" />
        <motion.circle
          cx="80" cy="80" r={radius} fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.2, 0, 0, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 12px ${ringColor}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-[#E2E2E6] tracking-tight font-mono">{animatedScore}/{total}</span>
        <span className="text-xs font-bold text-[#8E9196] uppercase tracking-widest mt-0.5">{Math.round(percentage * 100)}%</span>
      </div>
    </div>
  );
}

function TypeTag({ type }) {
  const config = {
    multiple_choice: { label: 'MC', icon: CheckSquare, color: 'bg-[#4A4458]/40 text-[#D0BCFF] border-[#D0BCFF]/30' },
    identification: { label: 'ID', icon: Type, color: 'bg-[#1E4378]/40 text-[#A8C7FA] border-[#A8C7FA]/30' },
    enumeration: { label: 'ENUM', icon: ListOrdered, color: 'bg-[#443600]/40 text-[#FDE293] border-[#FDE293]/30' },
    true_false: { label: 'T/F', icon: ToggleLeft, color: 'bg-[#16251E] text-[#A8E8BC] border-[#A8E8BC]/30' },
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
          optionClass = 'border-[#A8E8BC]/40 bg-[#1B5238]/30';
          labelClass = 'bg-[#A8E8BC] text-[#003822]';
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
          <div key={opt.label} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${optionClass}`}>
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-bold font-mono shrink-0 ${labelClass}`}>
              {opt.label}
            </span>
            <span className="text-[#E2E2E6] text-xs font-medium flex-1">{opt.text}</span>
            {suffix && (
              <span className={`text-xs font-bold shrink-0 ${isCorrectOption ? 'text-[#A8E8BC]' : 'text-[#FFB4AB]'}`}>
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
        isCorrect ? 'border-[#A8E8BC]/30 bg-[#1B5238]/25' :
        'border-[#FFB4AB]/30 bg-[#5C2822]/25'
      }`}>
        <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider shrink-0 w-24">Your answer:</span>
        <span className={`text-xs font-bold font-mono flex-1 ${isSkipped ? 'text-[#FDE293] italic' : 'text-[#E2E2E6]'}`}>
          {isSkipped ? '(No answer)' : userAnswer}
        </span>
        {!isSkipped && (
          <span className={`text-xs font-extrabold ${isCorrect ? 'text-[#A8E8BC]' : 'text-[#FFB4AB]'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>
      {!isCorrect && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#A8E8BC]/30 bg-[#1B5238]/25">
          <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider shrink-0 w-24">Correct:</span>
          <span className="text-[#A8E8BC] text-xs font-bold font-mono flex-1">{correctAnswer}</span>
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
                  isItemCorrect ? 'border-[#A8E8BC]/30 bg-[#1B5238]/25' : 'border-[#FFB4AB]/30 bg-[#5C2822]/25'
                }`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold font-mono shrink-0 ${
                    isItemCorrect ? 'bg-[#A8E8BC] text-[#003822]' : 'bg-[#FFB4AB] text-[#561E18]'
                  }`}>{i + 1}</span>
                  <span className="text-[#E2E2E6] text-xs font-semibold flex-1">{trimmed}</span>
                  <span className={`text-xs font-extrabold ${isItemCorrect ? 'text-[#A8E8BC]' : 'text-[#FFB4AB]'}`}>
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
              <span key={i} className="px-3 py-1.5 rounded-full border border-[#A8E8BC]/30 bg-[#1B5238]/30 text-[#A8E8BC] text-xs font-bold font-mono">
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
        isCorrect ? 'border-[#A8E8BC]/30 bg-[#1B5238]/25' :
        'border-[#FFB4AB]/30 bg-[#5C2822]/25'
      }`}>
        <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider shrink-0 w-24">Your answer:</span>
        <span className={`text-sm font-bold flex-1 ${
          isSkipped ? 'text-[#FDE293] italic' :
          userAnswer === 'True' ? 'text-[#A8E8BC]' : 'text-[#FFB4AB]'
        }`}>
          {isSkipped ? '(No answer)' : userAnswer}
        </span>
        {!isSkipped && (
          <span className={`text-xs font-extrabold ${isCorrect ? 'text-[#A8E8BC]' : 'text-[#FFB4AB]'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>
      {!isCorrect && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#A8E8BC]/30 bg-[#1B5238]/25">
          <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider shrink-0 w-24">Correct:</span>
          <span className="text-[#A8E8BC] text-sm font-bold flex-1">{correctAnswer}</span>
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
    statusBg = 'border-[#FDE293]/20 bg-[#1D2024]';
    statusText = 'Skipped';
    statusBadge = 'bg-[#443600] text-[#FDE293] border border-[#FDE293]/30';
  } else if (isCorrect) {
    statusIcon = <CheckCircle2 className="w-5 h-5 text-[#A8E8BC]" />;
    statusBg = 'border-[#A8E8BC]/20 bg-[#1D2024]';
    statusText = 'Correct';
    statusBadge = 'bg-[#1B5238] text-[#A8E8BC] border border-[#A8E8BC]/30';
  } else {
    statusIcon = <XCircle className="w-5 h-5 text-[#FFB4AB]" />;
    statusBg = 'border-[#FFB4AB]/20 bg-[#1D2024]';
    statusText = 'Incorrect';
    statusBadge = 'bg-[#5C2822] text-[#FFB4AB] border border-[#FFB4AB]/30';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 25 }}
      className={`rounded-[24px] border overflow-hidden shadow-lg ${statusBg}`}
    >
      <button
        id={`review-item-${index + 1}`}
        className="w-full flex items-center gap-3.5 p-4 sm:p-5 text-left cursor-pointer hover:bg-white/5 transition"
        onClick={() => setExpanded(!expanded)}
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[#8E9196] text-xs font-extrabold font-mono">Q{index + 1}</span>
            <TypeTag type={type} />
          </div>
          <span className="text-[#E2E2E6] text-sm font-bold block">{question}</span>
        </div>
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full shrink-0 ${statusBadge}`}>
          {statusText}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-[#8E9196] shrink-0" />
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

  useEffect(() => {
    playResultSound();
  }, []);

  let verdict, verdictColor;
  if (percentage >= 0.9) { verdict = 'Outstanding Mastery! 🎉'; verdictColor = 'text-[#A8E8BC]'; }
  else if (percentage >= 0.7) { verdict = 'Great Performance! 👏'; verdictColor = 'text-[#A8E8BC]'; }
  else if (percentage >= 0.5) { verdict = 'Solid Practice! 💪'; verdictColor = 'text-[#FDE293]'; }
  else { verdict = 'Needs Additional Study 📚'; verdictColor = 'text-[#FFB4AB]'; }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-14 bg-[#111318] text-[#E2E2E6]">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 25 }}
        className="w-full max-w-3xl"
      >
        {/* Score Header Card */}
        <div className="p-8 sm:p-10 rounded-[32px] bg-[#1D2024] border border-white/[0.06] text-center mb-8 shadow-2xl">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 15 }}
            className="w-16 h-16 rounded-3xl bg-[#443600] text-[#FDE293] border border-[#FDE293]/30 flex items-center justify-center mx-auto mb-4 shadow-xl"
          >
            <Trophy className="w-8 h-8 text-[#FDE293]" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#E2E2E6] tracking-tight mb-2">Exam Completed</h1>
          <p className={`text-base font-extrabold ${verdictColor} mb-6`}>{verdict}</p>

          <ScoreRing score={score} total={totalQuestions} />

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-[#A8E8BC] font-mono">{score}</p>
              <p className="text-xs text-[#8E9196] font-bold uppercase tracking-wider">Correct</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-[#FFB4AB] font-mono">{incorrect}</p>
              <p className="text-xs text-[#8E9196] font-bold uppercase tracking-wider">Incorrect</p>
            </div>
            {skipped > 0 && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-[#FDE293] font-mono">{skipped}</p>
                  <p className="text-xs text-[#8E9196] font-bold uppercase tracking-wider">Skipped</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Question Review Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-[#E2E2E6] mb-4 tracking-tight">Question Breakdown</h2>
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
            <RotateCcw className="w-4 h-4 text-[#A8E8BC]" />
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-xs bg-[#A8E8BC] text-[#003822] shadow-xl shadow-[#A8E8BC]/20 hover:bg-[#B9F2CB] transition-all cursor-pointer border-0"
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
    </div>
  );
}
