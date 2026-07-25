import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, FileJson, AlertCircle, Sparkles, ChevronDown, PenLine } from 'lucide-react';
import { parseFile } from '../utils/parseFile';
import ManualEntryForm from './ManualEntryForm';

export default function UploadScreen({ onQuizReady }) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'manual'
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);

    try {
      const questions = await parseFile(file);
      // Small delay for the loading animation
      await new Promise((r) => setTimeout(r, 600));
      onQuizReady(questions);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl"
      >
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-8 h-8 text-accent-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text tracking-tight">
              QuizForge
            </h1>
          </motion.div>
          <p className="text-surface-400 text-lg max-w-md mx-auto">
            Upload a questions file or create your own to generate an interactive, gradable exam.
          </p>
        </div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center justify-center mb-8"
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

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-danger-bg border border-danger-border"
                >
                  <AlertCircle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
                  <p className="text-danger-400 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Format Instructions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-8"
              >
                <FormatGuide />
              </motion.div>
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
                <ManualEntryForm onQuizReady={onQuizReady} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


function FormatGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        id="format-guide-toggle"
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <FileJson className="w-5 h-5 text-accent-400" />
          <span className="text-surface-200 font-medium">File Format Guide</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 text-surface-400" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 space-y-5">
          {/* Supported Types */}
          <div>
            <span className="text-surface-200 text-sm font-semibold block mb-2">Supported Question Types</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-accent-500/15 text-accent-400 text-xs font-semibold">multiple_choice</span>
              <span className="px-3 py-1.5 rounded-lg bg-[oklch(0.72_0.18_200/0.15)] text-[oklch(0.72_0.18_200)] text-xs font-semibold">identification</span>
              <span className="px-3 py-1.5 rounded-lg bg-[oklch(0.78_0.16_80/0.15)] text-[oklch(0.78_0.16_80)] text-xs font-semibold">enumeration</span>
            </div>
          </div>

          {/* CSV Example */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-surface-400" />
              <span className="text-surface-300 text-sm font-semibold uppercase tracking-wide">CSV Format</span>
            </div>
            <pre className="text-xs sm:text-sm bg-surface-950/60 rounded-xl p-4 overflow-x-auto text-surface-300 font-mono leading-relaxed">
{`type,question,optionA,optionB,optionC,optionD,correctAnswer
"multiple_choice","Capital of France?","Berlin","Madrid","Paris","Rome","C"
"identification","Powerhouse of the cell?","","","","","Mitochondria"
"enumeration","List the 3 primary colors","","","","","Red|Blue|Yellow"`}
            </pre>
          </div>

          {/* JSON Example */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileJson className="w-4 h-4 text-surface-400" />
              <span className="text-surface-300 text-sm font-semibold uppercase tracking-wide">JSON Format</span>
            </div>
            <pre className="text-xs sm:text-sm bg-surface-950/60 rounded-xl p-4 overflow-x-auto text-surface-300 font-mono leading-relaxed">
{`[
  {
    "type": "multiple_choice",
    "question": "Capital of France?",
    "optionA": "Berlin", "optionB": "Madrid",
    "optionC": "Paris", "optionD": "Rome",
    "correctAnswer": "C"
  },
  {
    "type": "identification",
    "question": "Powerhouse of the cell?",
    "correctAnswer": "Mitochondria"
  },
  {
    "type": "enumeration",
    "question": "List the 3 primary colors",
    "correctAnswer": "Red|Blue|Yellow"
  }
]`}
            </pre>
          </div>

          <div className="space-y-1.5">
            <p className="text-surface-500 text-xs">
              <strong className="text-surface-400">Multiple Choice:</strong> <code className="bg-surface-800 px-1.5 py-0.5 rounded text-accent-400">correctAnswer</code> = A, B, C, or D.
            </p>
            <p className="text-surface-500 text-xs">
              <strong className="text-surface-400">Identification:</strong> <code className="bg-surface-800 px-1.5 py-0.5 rounded text-accent-400">correctAnswer</code> = the exact text answer (case-insensitive).
            </p>
            <p className="text-surface-500 text-xs">
              <strong className="text-surface-400">Enumeration:</strong> <code className="bg-surface-800 px-1.5 py-0.5 rounded text-accent-400">correctAnswer</code> = items separated by <code className="bg-surface-800 px-1.5 py-0.5 rounded text-accent-400">|</code> (order doesn't matter).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
