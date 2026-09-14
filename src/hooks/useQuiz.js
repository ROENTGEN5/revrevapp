import { useState, useCallback, useMemo } from 'react';

/**
 * Check if an answer is correct based on question type.
 */
function checkAnswer(question, userAnswer) {
  if (userAnswer === null || userAnswer === undefined) return false;

  switch (question.type) {
    case 'multiple_choice':
      return userAnswer === question.correctAnswer;

    case 'identification': {
      // Case-insensitive, trimmed comparison
      const normalize = (s) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
      return normalize(userAnswer) === normalize(question.correctAnswer);
    }

    case 'enumeration': {
      // User provides an array of strings. Check if all correct items are present (order-independent).
      if (!Array.isArray(userAnswer)) return false;
      const normalizeItem = (s) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
      const correctSet = new Set(question.correctAnswer.map(normalizeItem));
      const userSet = new Set(userAnswer.map(normalizeItem).filter(Boolean));
      if (userSet.size !== correctSet.size) return false;
      for (const item of correctSet) {
        if (!userSet.has(item)) return false;
      }
      return true;
    }

    case 'true_false':
      return userAnswer === question.correctAnswer;

    default:
      return false;
  }
}

/**
 * Check if a question has been answered (non-empty).
 */
function isAnswered(question, userAnswer) {
  if (userAnswer === null || userAnswer === undefined) return false;

  switch (question.type) {
    case 'multiple_choice':
      return !!userAnswer;
    case 'identification':
      return userAnswer.toString().trim().length > 0;
    case 'enumeration':
      return Array.isArray(userAnswer) && userAnswer.some((s) => s.trim().length > 0);
    case 'true_false':
      return userAnswer === 'True' || userAnswer === 'False';
    default:
      return false;
  }
}

/**
 * Custom hook that encapsulates all quiz state and logic.
 * Supports multiple_choice, identification, and enumeration question types.
 *
 * @param {Array} questions - Normalized question objects from parseFile
 * @returns Quiz state and action functions
 */
export function useQuiz(questions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalQuestions = questions.length;

  // Set answer for any question type
  // For multiple_choice: answerValue is a string like 'A', 'B', 'C', 'D'
  // For identification: answerValue is a string
  // For enumeration: answerValue is an array of strings
  const selectAnswer = useCallback((questionId, answerValue) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answerValue }));
  }, [isSubmitted]);

  // Navigation
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  }, [totalQuestions]);

  // Submit the quiz
  const submitQuiz = useCallback(() => {
    setIsSubmitted(true);
  }, []);

  // Compute results
  const results = useMemo(() => {
    return questions.map((q) => {
      const userAnswer = answers[q.id] !== undefined ? answers[q.id] : null;
      const wasAnswered = isAnswered(q, userAnswer);
      const isCorrect = wasAnswered ? checkAnswer(q, userAnswer) : false;
      return {
        ...q,
        userAnswer,
        isCorrect,
        isSkipped: !wasAnswered,
      };
    });
  }, [questions, answers]);

  const score = useMemo(() => {
    return results.filter((r) => r.isCorrect).length;
  }, [results]);

  const totalAnswered = useMemo(() => {
    return questions.filter((q) => isAnswered(q, answers[q.id])).length;
  }, [questions, answers]);

  const progress = totalQuestions > 0 ? totalAnswered / totalQuestions : 0;

  return {
    // State
    currentIndex,
    answers,
    isSubmitted,
    totalQuestions,
    totalAnswered,
    progress,
    score,
    results,

    // Current question shortcut
    currentQuestion: questions[currentIndex] || null,

    // Actions
    selectAnswer,
    goNext,
    goPrev,
    goToQuestion,
    submitQuiz,
  };
}
