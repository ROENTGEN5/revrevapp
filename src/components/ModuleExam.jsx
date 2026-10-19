import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getModuleQuestions, saveAttempt } from '../services/firebaseService';
import QuizScreen from './QuizScreen';
import ResultsScreen from './ResultsScreen';

/**
 * Fisher-Yates shuffle — returns a new shuffled array without mutating the original.
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Wrapper that manages the Exam flow:
 *   1. Load questions from Firestore
 *   2. Shuffle and show QuizScreen
 *   3. On submit → save attempt to Firestore, show ResultsScreen
 */
export default function ModuleExam() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(null);
  const [shuffledQuestions, setShuffledQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'results'
  const [examResults, setExamResults] = useState(null);

  /** Shuffle questions and also randomize options within each multiple_choice question. */
  const prepareQuestions = useCallback((qs) => {
    return shuffleArray(qs).map((q) => {
      if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
        return { ...q, options: shuffleArray(q.options) };
      }
      return q;
    });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const qs = await getModuleQuestions(moduleId);
        setQuestions(qs);
        setShuffledQuestions(prepareQuestions(qs));
      } catch (err) {
        console.error('Error loading questions:', err);
        setError(err.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId, prepareQuestions]);

  const handleSubmit = useCallback(async (results, score, total) => {
    // Save attempt to Firestore
    try {
      await saveAttempt({
        moduleId,
        score,
        totalQuestions: total,
        answers: results,
      });
    } catch (err) {
      console.error('Error saving attempt:', err);
    }

    setExamResults({ results, score, total });
    setPhase('results');
  }, [moduleId]);

  const handleReviewAgain = useCallback(() => {
    navigate(`/module/${moduleId}/review`);
  }, [navigate, moduleId]);

  const handleReset = useCallback(() => {
    navigate(`/module/${moduleId}`);
  }, [navigate, moduleId]);

  const handleRetake = useCallback(() => {
    // Re-shuffle questions and randomize options again
    setShuffledQuestions(prepareQuestions(questions));
    setExamResults(null);
    setPhase('quiz');
  }, [questions, prepareQuestions]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#111318]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="p-4 rounded-3xl bg-[#1D2024] border border-white/10 shadow-2xl text-[#A8E8BC]"
        >
          <Loader2 className="w-8 h-8" />
        </motion.div>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8E9196]">
          Loading Exam...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#111318] text-[#E2E2E6]">
        <div className="p-8 sm:p-10 rounded-[32px] bg-[#1D2024] border border-white/10 text-center max-w-sm w-full shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#5C2822] text-[#FFB4AB] border border-[#FFB4AB]/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-[#E2E2E6] mb-2 tracking-tight">Error Loading Exam</h2>
          <p className="text-[#8E9196] text-xs mb-4">
            Could not load questions for this module.
          </p>
          <pre className="text-left text-[#FFB4AB] text-xs bg-[#16191D] p-3 rounded-2xl mb-6 overflow-auto max-h-32 border border-white/5 font-mono">
            {error}
          </pre>
          <button
            onClick={() => navigate(`/module/${moduleId}`)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#272A2F] hover:bg-[#32353A] border border-white/10 font-bold text-xs text-[#E2E2E6] cursor-pointer transition"
          >
            <span>Back to Module</span>
          </button>
        </div>
      </div>
    );
  }

  if (!shuffledQuestions || shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#111318] text-[#E2E2E6]">
        <div className="p-8 sm:p-10 rounded-[32px] bg-[#1D2024] border border-white/10 text-center max-w-sm w-full shadow-2xl">
          <h2 className="text-xl font-bold text-[#E2E2E6] mb-2 tracking-tight">No Questions Found</h2>
          <p className="text-[#8E9196] text-xs mb-6">
            This module does not have any questions available to take an exam.
          </p>
          <button
            onClick={() => navigate(`/module/${moduleId}`)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#272A2F] hover:bg-[#32353A] border border-white/10 font-bold text-xs text-[#E2E2E6] cursor-pointer transition"
          >
            <span>Back to Module</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results' && examResults) {
    return (
      <ResultsScreen
        results={examResults.results}
        score={examResults.score}
        totalQuestions={examResults.total}
        onReviewAgain={handleReviewAgain}
        onReset={handleReset}
        onRetake={handleRetake}
        moduleId={moduleId}
      />
    );
  }

  return (
    <QuizScreen
      questions={shuffledQuestions}
      onSubmit={handleSubmit}
      onReset={handleReset}
    />
  );
}

