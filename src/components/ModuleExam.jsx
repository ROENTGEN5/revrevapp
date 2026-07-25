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
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'results'
  const [examResults, setExamResults] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const qs = await getModuleQuestions(moduleId);
        setQuestions(qs);
        setShuffledQuestions(shuffleArray(qs));
      } catch (err) {
        console.error('Error loading questions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId]);

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
    // Re-shuffle and restart
    setShuffledQuestions(shuffleArray(questions));
    setExamResults(null);
    setPhase('quiz');
  }, [questions]);

  if (loading || !shuffledQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-accent-400" />
        </motion.div>
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
