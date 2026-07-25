import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Dashboard from './components/Dashboard';
import CreateModule from './components/CreateModule';
import ModuleDetail from './components/ModuleDetail';
import ModuleReview from './components/ModuleReview';
import ModuleExam from './components/ModuleExam';
import PomodoroTimer from './components/PomodoroTimer';

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
  return (
    <>
      {/* Ambient background glow mesh */}
      <div className="ambient-glow">
        <div className="ambient-glow-orb-3" />
      </div>

      <BrowserRouter>
        <AnimatedRoutes />
        {/* Global Floating Glassmorphic Pomodoro Timer */}
        <PomodoroTimer />
      </BrowserRouter>
    </>
  );
}

