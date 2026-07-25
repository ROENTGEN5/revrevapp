import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Upload, PenLine, Sparkles, FileText, FileJson,
  AlertCircle, Loader2, BookOpen, Save, Cloud, CloudOff
} from 'lucide-react';
import { parseFile } from '../utils/parseFile';
import {
  createModule,
  createDraftModule,
  updateDraftModule,
  saveDraftQuestions,
  publishModule,
  getModule,
  getModuleQuestions,
} from '../services/firebaseService';
import ManualEntryForm from './ManualEntryForm';

/**
 * CreateModule page — supports both fresh creation and resuming a draft.
 * Route: /create (new) or /create/:moduleId (resume draft)
 */
export default function CreateModule() {
  const navigate = useNavigate();
  const { moduleId: existingDraftId } = useParams();

  const [mode, setMode] = useState('upload'); // 'upload' | 'manual'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(!!existingDraftId);
  const fileInputRef = useRef(null);

  // ─── Draft state ─────────────────────────────────────────
  const [draftId, setDraftId] = useState(existingDraftId || null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const saveTimerRef = useRef(null);
  const titleSaveTimerRef = useRef(null);
  const [draftQuestions, setDraftQuestions] = useState([]);

  // Load existing draft if resuming
  useEffect(() => {
    if (!existingDraftId) return;

    async function loadDraft() {
      try {
        const mod = await getModule(existingDraftId);
        setTitle(mod.title || '');
        setDescription(mod.description || '');

        const qs = await getModuleQuestions(existingDraftId);
        // Convert Firestore questions back to ManualEntryForm format
        const formattedQs = qs.map((q) => {
          const formatted = {
            _tempId: Date.now() + Math.random(),
            type: q.type,
            question: q.question,
            correctAnswer: q.correctAnswer,
          };
          if (q.type === 'multiple_choice') {
            formatted.options = q.options;
          }
          if (q.type === 'enumeration') {
            formatted.itemCount = q.itemCount;
          }
          return formatted;
        });
        setDraftQuestions(formattedQs);

        // If module has questions, switch to manual mode to show them
        if (formattedQs.length > 0) {
          setMode('manual');
        }
      } catch (err) {
        console.error('Error loading draft:', err);
      } finally {
        setLoadingDraft(false);
      }
    }
    loadDraft();
  }, [existingDraftId]);

  // ─── Auto-save title/description (debounced) ─────────────
  useEffect(() => {
    if (!draftId || !title.trim()) return;

    clearTimeout(titleSaveTimerRef.current);
    titleSaveTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        await updateDraftModule(draftId, {
          title: title.trim(),
          description: description.trim(),
        });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Error auto-saving title:', err);
        setAutoSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(titleSaveTimerRef.current);
  }, [draftId, title, description]);

  // ─── Create draft on first title input ────────────────────
  const ensureDraft = useCallback(async () => {
    if (draftId) return draftId;

    try {
      setAutoSaveStatus('saving');
      const newId = await createDraftModule({
        title: title.trim() || 'Untitled Module',
        description: description.trim(),
      });
      setDraftId(newId);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
      return newId;
    } catch (err) {
      console.error('Error creating draft:', err);
      setAutoSaveStatus('error');
      return null;
    }
  }, [draftId, title, description]);

  // ─── Auto-save questions (debounced) ──────────────────────
  const handleQuestionsChange = useCallback(async (questions) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      let currentDraftId = draftId;

      // Create draft if it doesn't exist yet
      if (!currentDraftId) {
        try {
          setAutoSaveStatus('saving');
          currentDraftId = await createDraftModule({
            title: title.trim() || 'Untitled Module',
            description: description.trim(),
          });
          setDraftId(currentDraftId);
        } catch (err) {
          console.error('Error creating draft:', err);
          setAutoSaveStatus('error');
          return;
        }
      }

      try {
        setAutoSaveStatus('saving');
        await saveDraftQuestions(currentDraftId, questions);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Error auto-saving questions:', err);
        setAutoSaveStatus('error');
      }
    }, 1500);
  }, [draftId, title, description]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      clearTimeout(titleSaveTimerRef.current);
    };
  }, []);

  // ─── File handling ────────────────────────────────────────
  const handleFile = async (file) => {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);

    try {
      const questions = await parseFile(file);
      await new Promise((r) => setTimeout(r, 400));
      setParsedQuestions(questions);

      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.(csv|json)$/i, '');
        setTitle(nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      }

      // Auto-save uploaded questions as draft
      let currentDraftId = draftId;
      if (!currentDraftId) {
        const autoTitle = title.trim() || file.name.replace(/\.(csv|json)$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        currentDraftId = await createDraftModule({
          title: autoTitle,
          description: description.trim(),
        });
        setDraftId(currentDraftId);
      }
      await saveDraftQuestions(currentDraftId, questions);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err) {
      setError(err.message);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  // ─── Publish (finalize) ───────────────────────────────────
  const handlePublish = async (questions) => {
    if (!title.trim()) {
      setError('Please enter a module title.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (draftId) {
        // Publish existing draft
        await updateDraftModule(draftId, {
          title: title.trim(),
          description: description.trim(),
        });
        await saveDraftQuestions(draftId, questions);
        await publishModule(draftId);
        navigate(`/module/${draftId}`);
      } else {
        // Create and publish in one go
        const moduleId = await createModule({
          title: title.trim(),
          description: description.trim(),
          questions,
        });
        navigate(`/module/${moduleId}`);
      }
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  const handleManualSubmit = (questions) => {
    handlePublish(questions);
  };

  const handleUploadSave = () => {
    if (!parsedQuestions) return;
    handlePublish(parsedQuestions);
  };

  if (loadingDraft) {
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
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl"
      >
        {/* Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            id="back-to-dashboard-create"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-surface-400 hover:text-surface-200 text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>

          {/* Auto-save indicator */}
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-7 h-7 text-accent-400" />
            <h1 className="text-3xl sm:text-4xl font-extrabold gradient-text tracking-tight">
              {existingDraftId ? 'Edit Module' : 'Create Module'}
            </h1>
          </motion.div>
          <p className="text-surface-400 text-base max-w-md mx-auto">
            {existingDraftId
              ? 'Continue building your module. Questions are auto-saved.'
              : 'Upload a questions file or create your own. Your progress is auto-saved.'}
          </p>
        </div>

        {/* Module Info Fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 sm:p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-accent-400" />
            <span className="text-surface-200 text-sm font-semibold">Module Details</span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="module-title" className="block text-surface-400 text-xs font-semibold mb-1.5">
                Title <span className="text-danger-400">*</span>
              </label>
              <input
                id="module-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Biology 101"
                className="w-full px-4 py-3 rounded-xl border border-surface-700/50 bg-surface-900/40 text-surface-100 text-sm font-medium placeholder:text-surface-600 focus:outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="module-description" className="block text-surface-400 text-xs font-semibold mb-1.5">
                Description <span className="text-surface-600">(optional)</span>
              </label>
              <input
                id="module-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Cell biology, genetics, and evolution"
                className="w-full px-4 py-3 rounded-xl border border-surface-700/50 bg-surface-900/40 text-surface-100 text-sm font-medium placeholder:text-surface-600 focus:outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/20 transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex items-center justify-center mb-6"
        >
          <div className="view-toggle-pill inline-flex rounded-xl p-1 gap-1">
            <button
              id="toggle-upload-mode"
              onClick={() => { setMode('upload'); setError(null); }}
              className={`view-toggle-option inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${
                mode === 'upload' ? 'active' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
            <button
              id="toggle-manual-mode"
              onClick={() => { setMode('manual'); setError(null); }}
              className={`view-toggle-option inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${
                mode === 'manual' ? 'active' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <PenLine className="w-4 h-4" />
              Create Manually
            </button>
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {mode === 'upload' ? (
            <motion.div
              key="upload-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Upload Zone */}
              <div
                id="upload-drop-zone"
                className={`drop-zone glass rounded-2xl p-10 sm:p-14 text-center cursor-pointer ${isDragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  id="file-upload-input"
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={handleInputChange}
                />

                {isLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <FileText className="w-12 h-12 text-accent-400" />
                    </motion.div>
                    <p className="text-surface-300 font-medium">
                      Parsing <span className="text-accent-400">{fileName}</span>...
                    </p>
                  </div>
                ) : parsedQuestions ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-success-bg flex items-center justify-center">
                      <FileText className="w-7 h-7 text-success-400" />
                    </div>
                    <div>
                      <p className="text-surface-200 font-semibold text-lg mb-1">
                        {fileName}
                      </p>
                      <p className="text-success-400 text-sm font-medium">
                        {parsedQuestions.length} questions loaded ✓
                      </p>
                      <p className="text-surface-500 text-xs mt-1">
                        Click to choose a different file
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={isDragOver ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Upload className="w-12 h-12 text-surface-400" />
                    </motion.div>
                    <div>
                      <p className="text-surface-200 font-semibold text-lg mb-1">
                        Drop your file here, or <span className="text-accent-400 underline underline-offset-4">browse</span>
                      </p>
                      <p className="text-surface-500 text-sm">
                        Supports <span className="font-mono text-surface-300">.csv</span> and <span className="font-mono text-surface-300">.json</span> formats
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button (when questions are loaded) */}
              {parsedQuestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex justify-center"
                >
                  <motion.button
                    id="save-module-button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUploadSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-500 to-[oklch(0.62_0.24_310)] text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-shadow cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Publish Module
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="manual-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="glass rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <PenLine className="w-5 h-5 text-accent-400" />
                  <h2 className="text-lg font-semibold text-surface-100">
                    Create Your Questions
                  </h2>
                </div>
                <ManualEntryForm
                  onQuizReady={handleManualSubmit}
                  submitLabel={isSaving ? 'Publishing...' : 'Publish Module'}
                  disabled={isSaving || !title.trim()}
                  onQuestionsChange={handleQuestionsChange}
                  initialQuestions={draftQuestions}
                />
                {!title.trim() && (
                  <p className="text-warning-400 text-xs mt-3">
                    ↑ Please fill in the module title above before publishing.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-danger-bg border border-danger-border"
            >
              <AlertCircle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
              <p className="text-danger-400 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


// ─── Auto-save status indicator ──────────────────────────────────
function AutoSaveIndicator({ status }) {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="inline-flex items-center gap-1.5"
      >
        {status === 'saving' && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-surface-500 animate-spin" />
            <span className="text-surface-500 text-xs font-medium">Saving...</span>
          </>
        )}
        {status === 'saved' && (
          <>
            <Cloud className="w-3.5 h-3.5 text-success-400" />
            <span className="text-success-400 text-xs font-medium">Saved</span>
          </>
        )}
        {status === 'error' && (
          <>
            <CloudOff className="w-3.5 h-3.5 text-danger-400" />
            <span className="text-danger-400 text-xs font-medium">Save failed</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
