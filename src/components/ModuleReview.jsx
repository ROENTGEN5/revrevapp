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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-apple-card p-8 rounded-3xl text-center max-w-sm w-full">
          <h2 className="text-xl font-bold text-white mb-2">No Questions Found</h2>
          <p className="text-white/60 text-xs mb-6">
            This module does not have any questions available to review.
          </p>
          <button
            onClick={() => navigate(`/module/${moduleId}`)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl glass-apple-btn font-bold text-xs text-white cursor-pointer"
          >
            <span>Back to Module</span>
          </button>
        </div>
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
