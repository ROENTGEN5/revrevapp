import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getModuleQuestions } from '../services/firebaseService';
import ReviewerScreen from './ReviewerScreen';

/**
 * Wrapper that loads questions from Firestore, then renders ReviewerScreen.
 */
export default function ModuleReview() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const qs = await getModuleQuestions(moduleId);
        setQuestions(qs);
      } catch (err) {
        console.error('Error loading questions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId]);

  if (loading || !questions) {
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

  return (
    <ReviewerScreen
      questions={questions}
      onStartExam={() => navigate(`/module/${moduleId}/exam`)}
      onBackToUpload={() => navigate(`/module/${moduleId}`)}
    />
  );
}
