import { motion } from 'framer-motion';

export default function QuestionNav({ questions, answers, currentIndex, onNavigate }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {questions.map((q, i) => {
        const raw = answers[q.id];
        // Determine if answered based on question type
        let isAnswered = false;
        if (raw !== undefined && raw !== null) {
          if (q.type === 'multiple_choice') {
            isAnswered = !!raw;
          } else if (q.type === 'identification') {
            isAnswered = raw.toString().trim().length > 0;
          } else if (q.type === 'enumeration') {
            isAnswered = Array.isArray(raw) && raw.some((s) => s.trim().length > 0);
          }
        }

        const isCurrent = i === currentIndex;

        let bgClass = 'bg-surface-800/60 text-surface-400 hover:bg-surface-700/80';
        if (isCurrent) {
          bgClass = 'bg-accent-500/30 text-accent-400 ring-2 ring-accent-500/50';
        } else if (isAnswered) {
          bgClass = 'bg-surface-600/50 text-surface-200';
        }

        return (
          <motion.button
            key={q.id}
            id={`nav-question-${i + 1}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-9 h-9 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-200 ${bgClass}`}
            onClick={() => onNavigate(i)}
          >
            {i + 1}
          </motion.button>
        );
      })}
    </div>
  );
}
