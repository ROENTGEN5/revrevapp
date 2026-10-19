import { motion } from 'framer-motion';

export default function ProgressBar({ progress, totalAnswered, totalQuestions }) {
  const percentage = Math.round(progress * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#8E9196] text-xs font-semibold uppercase tracking-wider">
          Progress
        </span>
        <span className="text-[#E2E2E6] text-xs font-bold font-mono">
          {totalAnswered}/{totalQuestions} answered ({percentage}%)
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-[#272A2F] overflow-hidden p-0.5 border border-white/5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent)]"
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
