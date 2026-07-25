import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Upload, PenLine, Sparkles, FileText,
  AlertCircle, Loader2, BookOpen, Cloud, CloudOff, CheckCircle2
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

  // Draft state
  const [draftId, setDraftId] = useState(existingDraftId || null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
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
        const formattedQs = qs.map((q) => {
          const formatted = {
            _tempId: Date.now() + Math.random(),
            type: q.type,
            question: q.question,
            correctAnswer: q.correctAnswer,
          };
          if (q.type === 'multiple_choice') formatted.options = q.options;
          if (q.type === 'enumeration') formatted.itemCount = q.itemCount;
          return formatted;
        });
        setDraftQuestions(formattedQs);

        if (formattedQs.length > 0) setMode('manual');
      } catch (err) {
        console.error('Error loading draft:', err);
      } finally {
        setLoadingDraft(false);
      }
    }
    loadDraft();
  }, [existingDraftId]);

  // Debounced auto-save for title & description
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

  // Ensure draft exists
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

  // Debounced auto-save questions
  const handleQuestionsChange = useCallback(async (questions) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      let currentDraftId = draftId;

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

  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      clearTimeout(titleSaveTimerRef.current);
    };
  }, []);

  // File parsing & handling
  const handleFile = async (file) => {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);

    try {
      const questions = await parseFile(file);
      await new Promise((r) => setTimeout(r, 400));
      setParsedQuestions(questions);

      if (!title) {
        const nameWithoutExt = file.name.replace(/\.(csv|json)$/i, '');
        setTitle(nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      }

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

  // Publish module
  const handlePublish = async (questions) => {
    if (!title.trim()) {
      setError('Please enter a module title.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (draftId) {
        await updateDraftModule(draftId, {
          title: title.trim(),
          description: description.trim(),
        });
        await saveDraftQuestions(draftId, questions);
        await publishModule(draftId);
        navigate(`/module/${draftId}`);
      } else {
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

  if (loadingDraft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="p-4 rounded-2xl glass-apple-pill text-purple-400"
        >
          <Loader2 className="w-8 h-8" />
        </motion.div>
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Loading Draft...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 25 }}
        className="w-full max-w-3xl"
      >
        {/* Navigation & Auto-Save Indicator */}
        <div className="flex items-center justify-between mb-8">
          <button
            id="back-to-dashboard-create"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-apple-btn text-xs font-semibold hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <AutoSaveIndicator status={autoSaveStatus} />
        </div>

        {/* Hero Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="inline-flex items-center gap-2 mb-3"
          >
            <Sparkles className="w-7 h-7 text-purple-400" />
            <h1 className="text-3xl sm:text-4xl font-extrabold gradient-text tracking-tight">
              {existingDraftId ? 'Edit Module' : 'Create Module'}
            </h1>
          </motion.div>
          <p className="text-white/60 text-sm sm:text-base max-w-md mx-auto">
            {existingDraftId
              ? 'Continue crafting your module. Questions save automatically.'
              : 'Upload a CSV/JSON file or write questions manually. Auto-saved live.'}
          </p>
        </div>

        {/* Module Title & Description Inset Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-apple-card p-6 sm:p-8 mb-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-bold tracking-tight">Module Information</span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="module-title" className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="module-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Computer Science Fundamentals"
                className="w-full px-4 py-3 rounded-xl glass-apple-input text-sm font-semibold placeholder:text-white/30 focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label htmlFor="module-description" className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Description <span className="text-white/40 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="module-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Data structures, algorithms, and logic gates"
                className="w-full px-4 py-3 rounded-xl glass-apple-input text-sm font-semibold placeholder:text-white/30 focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Apple Segmented Mode Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="glass-apple-pill inline-flex rounded-2xl p-1.5 gap-2 border border-white/10">
            <button
              id="toggle-upload-mode"
              onClick={() => { setMode('upload'); setError(null); }}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                mode === 'upload' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
            <button
              id="toggle-manual-mode"
              onClick={() => { setMode('manual'); setError(null); }}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                mode === 'manual' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              <PenLine className="w-4 h-4" />
              <span>Create Manually</span>
            </button>
          </div>
        </motion.div>

        {/* Content Mode Container */}
        <AnimatePresence mode="wait">
          {mode === 'upload' ? (
            <motion.div
              key="upload-mode"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
            >
              {/* Drop Zone */}
              <div
                id="upload-drop-zone"
                className={`drop-zone rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
                  isDragOver ? 'drag-over' : ''
                }`}
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
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      className="p-4 rounded-2xl bg-purple-500/20 text-purple-300"
                    >
                      <FileText className="w-10 h-10" />
                    </motion.div>
                    <p className="text-white/80 font-semibold text-sm">
                      Parsing <span className="text-purple-400">{fileName}</span>...
                    </p>
                  </div>
                ) : parsedQuestions ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg mb-1">{fileName}</p>
                      <p className="text-emerald-300 text-sm font-extrabold font-mono">
                        {parsedQuestions.length} Questions Loaded ✓
                      </p>
                      <p className="text-white/40 text-xs mt-2">
                        Click to select a different file
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={isDragOver ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="p-4 rounded-2xl bg-white/5 text-purple-300 border border-white/10 shadow-xl"
                    >
                      <Upload className="w-10 h-10" />
                    </motion.div>
                    <div>
                      <p className="text-white font-bold text-lg mb-1">
                        Drop your quiz file here, or <span className="text-purple-400 underline underline-offset-4">browse</span>
                      </p>
                      <p className="text-white/50 text-xs">
                        Supports <span className="font-mono text-white/80 font-bold">.csv</span> and <span className="font-mono text-white/80 font-bold">.json</span> files
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Publish Button */}
              {parsedQuestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex justify-center"
                >
                  <motion.button
                    id="save-module-button"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePublish(parsedQuestions)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all cursor-pointer border border-white/20 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Publishing Module...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Publish Module</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="manual-mode"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
            >
              <div className="glass-apple-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <PenLine className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-extrabold text-white tracking-tight">
                    Add Questions Manually
                  </h2>
                </div>
                <ManualEntryForm
                  onQuizReady={(qs) => handlePublish(qs)}
                  submitLabel={isSaving ? 'Publishing...' : 'Publish Module'}
                  disabled={isSaving || !title.trim()}
                  onQuestionsChange={handleQuestionsChange}
                  initialQuestions={draftQuestions}
                />
                {!title.trim() && (
                  <p className="text-amber-300 text-xs font-semibold mt-4">
                    ↑ Please fill in the module title above before publishing.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 shadow-xl"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Auto-save Indicator Badge
function AutoSaveIndicator({ status }) {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="glass-apple-pill px-3 py-1.5 rounded-full inline-flex items-center gap-2 border border-white/10"
      >
        {status === 'saving' && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span className="text-white/70 text-xs font-semibold">Auto-saving...</span>
          </>
        )}
        {status === 'saved' && (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 text-xs font-semibold">Auto-saved</span>
          </>
        )}
        {status === 'error' && (
          <>
            <CloudOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-300 text-xs font-semibold">Save error</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
