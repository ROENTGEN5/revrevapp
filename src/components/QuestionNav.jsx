import { motion } from 'framer-motion';

export default function QuestionNav({ questions, answers, currentIndex, onNavigate }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
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

        let bgClass = 'bg-[#272A2F] text-[#8E9196] hover:bg-[#32353A] hover:text-[#E2E2E6] border border-white/5';
        if (isCurrent) {
          bgClass = 'bg-[#A8E8BC] text-[#003822] font-bold shadow-md shadow-[#A8E8BC]/25 ring-2 ring-[#A8E8BC]/50';
        } else if (isAnswered) {
          bgClass = 'bg-[#1B5238] text-[#A8E8BC] border border-[#A8E8BC]/30 font-bold';
        }

        return (
          <motion.button
            key={q.id}
            id={`nav-question-${i + 1}`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className={`w-9 h-9 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all duration-150 flex items-center justify-center ${bgClass}`}
            onClick={() => onNavigate(i)}
          >
            {i + 1}
          </motion.button>
        );
      })}
    </div>
  );
}
