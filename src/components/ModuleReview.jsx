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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#111318]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="p-4 rounded-3xl bg-[#1D2024] border border-white/10 shadow-2xl text-[#A8E8BC]"
        >
          <Loader2 className="w-8 h-8" />
        </motion.div>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8E9196]">
          Loading Flashcards...
        </span>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#111318] text-[#E2E2E6]">
        <div className="p-8 sm:p-10 rounded-[32px] bg-[#1D2024] border border-white/10 text-center max-w-sm w-full shadow-2xl">
          <h2 className="text-xl font-bold text-[#E2E2E6] mb-2 tracking-tight">No Questions Found</h2>
          <p className="text-[#8E9196] text-xs mb-6">
            This module does not have any questions available to review.
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

  return (
    <ReviewerScreen
      questions={questions}
      onStartExam={() => navigate(`/module/${moduleId}/exam`)}
      onBackToUpload={() => navigate(`/module/${moduleId}`)}
    />
  );
}
