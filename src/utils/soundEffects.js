/**
 * Centralized Sound Effects Manager for QuizForge
 * Uses audio assets located in public/sounds/
 */

const SOUND_PATHS = {
  choice: '/sounds/choice.mp3',
  nav: '/sounds/nav.mp3',
  result: '/sounds/result.mp3',
  submit: '/sounds/submit.mp3',
};

// Check if sound is muted by user preference
export function isSoundEnabled() {
  try {
    const pref = localStorage.getItem('quizforge_sound_enabled');
    return pref === null ? true : pref === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem('quizforge_sound_enabled', String(enabled));
    window.dispatchEvent(new CustomEvent('quizforge_sound_change', { detail: enabled }));
  } catch (err) {
    console.debug('Failed to save sound preference:', err);
  }
}

export function toggleSound() {
  const current = isSoundEnabled();
  setSoundEnabled(!current);
  return !current;
}

/**
 * Safely play an audio effect
 */
function playAudio(path, volume = 0.5) {
  if (!isSoundEnabled()) return;

  try {
    const audio = new Audio(path);
    audio.volume = Math.max(0, Math.min(1, volume));
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        // Browser autoplay policy or sound interruption
        console.debug('Audio playback skipped:', err);
      });
    }
  } catch (err) {
    console.debug('Error creating Audio:', err);
  }
}

/**
 * Triggered on choice/option clicks (multiple choice, true/false, rating)
 */
export function playChoiceSound() {
  playAudio(SOUND_PATHS.choice, 0.6);
}

/**
 * Triggered on navigation (next/prev buttons, arrow keys, tabs, question numbers)
 */
export function playNavSound() {
  playAudio(SOUND_PATHS.nav, 0.55);
}

/**
 * Triggered on major actions (submit exam, publish module, start exam)
 */
export function playSubmitSound() {
  playAudio(SOUND_PATHS.submit, 0.7);
}

/**
 * Triggered when viewing results / exam completion fanfare
 */
export function playResultSound() {
  playAudio(SOUND_PATHS.result, 0.75);
}
