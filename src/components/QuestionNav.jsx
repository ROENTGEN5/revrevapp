import { motion } from 'framer-motion';
import { playNavSound } from '../utils/soundEffects';

export default function QuestionNav({ questions, answers, currentIndex, onNavigate }) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q, i) => {
        const raw = answers[q.id];
        let isAnswered = false;
        if (raw !== undefined && raw !== null) {
          if (q.type === 'multiple_choice') {
            isAnswered = !!raw;
          } else if (q.type === 'identification') {
            isAnswered = raw.toString().trim().length > 0;
          } else if (q.type === 'enumeration') {
            isAnswered = Array.isArray(raw) && raw.some((s) => s.trim().length > 0);
          } else if (q.type === 'true_false') {
            isAnswered = !!raw;
          }
        }

        const isCurrent = i === currentIndex;

        let bgClass = 'bg-[#0e0f14] text-[#a9abb9] hover:bg-[#191b24] hover:text-[#E2E2E6] border border-white/10';
        if (isCurrent) {
          bgClass = 'bg-[color:var(--accent)] text-[color:var(--accent-on)] font-bold shadow-md shadow-[color:var(--accent)]/25 ring-2 ring-[color:var(--accent)]/50';
        } else if (isAnswered) {
          bgClass = 'bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 font-bold';
        }

        return (
          <motion.button
            key={q.id}
            id={`nav-question-${i + 1}`}
            aria-label={`Question ${i + 1}, ${isAnswered ? 'answered' : 'unanswered'}`}
            aria-current={isCurrent ? 'step' : undefined}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className={`w-9 h-9 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors duration-150 flex items-center justify-center ${bgClass}`}
            onClick={() => {
              playNavSound();
              onNavigate(i);
            }}
          >
            {i + 1}
          </motion.button>
        );
      })}
    </div>
  );
}
