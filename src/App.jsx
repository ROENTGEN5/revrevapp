import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Dashboard from './components/Dashboard';
import CreateModule from './components/CreateModule';
import ModuleDetail from './components/ModuleDetail';
import ModuleReview from './components/ModuleReview';
import ModuleExam from './components/ModuleExam';
import PomodoroTimer from './components/PomodoroTimer';
import ErrorBoundary from './components/ErrorBoundary';
import { signInAnonymous } from './services/firebaseService';

const pageVariants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -8 },
};

const pageTransition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateModule />} />
          <Route path="/create/:moduleId" element={<CreateModule />} />
          <Route path="/module/:moduleId" element={<ModuleDetail />} />
          <Route path="/module/:moduleId/review" element={<ModuleReview />} />
          <Route path="/module/:moduleId/exam" element={<ModuleExam />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    signInAnonymous()
      .then(() => setAuthReady(true))
      .catch((err) => {
        console.error('Auth initialization failed:', err);
        setAuthReady(true); // Still allow app to render with fallback
      });
  }, []);

  if (!authReady) {
    return (
      <>
        <div className="ambient-glow">
          <div className="ambient-glow-orb-3" />
        </div>
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
          <div className="p-4 rounded-2xl glass-apple-pill text-purple-400 animate-spin">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Initializing...
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Ambient background glow mesh */}
      <div className="ambient-glow">
        <div className="ambient-glow-orb-3" />
      </div>

      <BrowserRouter>
        <ErrorBoundary>
          <AnimatedRoutes />
          {/* Global Floating Glassmorphic Pomodoro Timer */}
          <PomodoroTimer />
        </ErrorBoundary>
      </BrowserRouter>
    </>
  );
}

