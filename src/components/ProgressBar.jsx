import { motion } from 'framer-motion';

export default function ProgressBar({ progress, totalAnswered, totalQuestions }) {
  const percentage = Math.round(progress * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-surface-400 text-sm font-medium">
          Progress
        </span>
        <span className="text-surface-300 text-sm font-semibold tabular-nums">
          {totalAnswered}/{totalQuestions} answered
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-surface-800/80 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, oklch(0.65 0.25 280), oklch(0.72 0.22 310), oklch(0.65 0.25 280))',
            backgroundSize: '200% 100%',
          }}
          initial={{ width: 0 }}
          animate={{
            width: `${percentage}%`,
            backgroundPosition: ['0% 0%', '100% 0%'],
          }}
          transition={{
            width: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
          }}
        />
      </div>
    </div>
  );
}
