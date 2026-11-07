import { motion } from 'framer-motion';

export default function ProgressBar({ progress, totalAnswered, totalQuestions }) {
  const percentage = Math.round(progress * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="study-kicker">
          Progress
        </span>
        <span className="text-[#E2E2E6] text-xs font-bold font-mono">
          {totalAnswered}/{totalQuestions} answered ({percentage}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Exam progress"
        aria-valuenow={percentage}
        className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full bg-[color:var(--accent)]"
          initial={{ width: 0 }}
          animate={{
            width: `${percentage}%`,
          }}
          transition={{
            width: { duration: 0.4, ease: [0.2, 0, 0, 1] },
          }}
        />
      </div>
    </div>
  );
}
