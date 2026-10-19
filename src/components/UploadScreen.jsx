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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#111318] text-[#E2E2E6]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
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
            <Sparkles className="w-8 h-8 text-[color:var(--accent)]" />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#E2E2E6] tracking-tight">
              QuizForge
            </h1>
          </motion.div>
          <p className="text-[#8E9196] text-lg max-w-md mx-auto">
            Upload a questions file or create your own to generate an interactive, gradable exam.
          </p>
        </div>

        {/* Pixel Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="inline-flex rounded-full p-1.5 gap-1.5 bg-[#1D2024] border border-white/10 shadow-lg">
            <button
              id="toggle-upload-mode"
              onClick={() => { setMode('upload'); setError(null); }}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mode === 'upload' ? 'bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-md' : 'text-[#8E9196] hover:text-[#E2E2E6]'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
            <button
              id="toggle-manual-mode"
              onClick={() => { setMode('manual'); setError(null); }}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mode === 'manual' ? 'bg-[color:var(--accent)] text-[color:var(--accent-on)] shadow-md' : 'text-[#8E9196] hover:text-[#E2E2E6]'
              }`}
            >
              <PenLine className="w-4 h-4" />
              <span>Create Manually</span>
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
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            >
              {/* Upload Zone */}
              <div
                id="upload-drop-zone"
                className={`drop-zone rounded-[32px] p-10 sm:p-14 text-center cursor-pointer ${isDragOver ? 'drag-over' : ''}`}
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
                      className="p-4 rounded-3xl bg-[color:var(--accent-container)] text-[color:var(--accent)]"
                    >
                      <FileText className="w-12 h-12" />
                    </motion.div>
                    <p className="text-[#E2E2E6] font-semibold text-sm">
                      Parsing <span className="text-[color:var(--accent)]">{fileName}</span>...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={isDragOver ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="p-4 rounded-3xl bg-white/5 text-[color:var(--accent)] border border-white/10 shadow-xl"
                    >
                      <Upload className="w-12 h-12" />
                    </motion.div>
                    <div>
                      <p className="text-[#E2E2E6] font-bold text-lg mb-1">
                        Drop your file here, or <span className="text-[color:var(--accent)] underline underline-offset-4">browse</span>
                      </p>
                      <p className="text-[#8E9196] text-xs">
                        Supports <span className="font-mono text-[#E2E2E6] font-bold">.csv</span> and <span className="font-mono text-[#E2E2E6] font-bold">.json</span> formats
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
                  className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-[#5C2822]/40 border border-[#FFB4AB]/30 text-[#FFB4AB]"
                >
                  <AlertCircle className="w-5 h-5 text-[#FFB4AB] shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{error}</p>
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
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            >
              <div className="p-7 sm:p-9 rounded-[32px] bg-[#1D2024] border border-white/[0.06] shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-[color:var(--accent-container)] text-[color:var(--accent)] border border-[color:var(--accent)]/30">
                    <PenLine className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-[#E2E2E6]">
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
    <div className="rounded-[28px] bg-[#1D2024] border border-white/[0.06] overflow-hidden shadow-lg">
      <button
        id="format-guide-toggle"
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-white/5 transition"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <FileJson className="w-5 h-5 text-[color:var(--accent)]" />
          <span className="text-[#E2E2E6] font-semibold text-sm">File Format Guide</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 text-[#8E9196]" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 space-y-5">
          {/* Supported Types */}
          <div>
            <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider block mb-2">Supported Question Types</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[#4A4458]/40 text-[#D0BCFF] border border-[#D0BCFF]/30 text-xs font-semibold">multiple_choice</span>
              <span className="px-3.5 py-1 rounded-full bg-[#1E4378]/40 text-[#A8C7FA] border border-[#A8C7FA]/30 text-xs font-semibold">identification</span>
              <span className="px-3.5 py-1 rounded-full bg-[#443600]/40 text-[#FDE293] border border-[#FDE293]/30 text-xs font-semibold">enumeration</span>
              <span className="px-3.5 py-1 rounded-full bg-[color:var(--accent-surface)] text-[color:var(--accent)] border border-[color:var(--accent)]/30 text-xs font-semibold">true_false</span>
            </div>
          </div>

          {/* CSV Example */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-[#8E9196]" />
              <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider">CSV Format</span>
            </div>
            <pre className="text-xs bg-[#16191D] rounded-2xl p-4 overflow-x-auto text-[#C4C7C5] font-mono leading-relaxed border border-white/5">
{`type,question,optionA,optionB,optionC,optionD,correctAnswer
"multiple_choice","Capital of France?","Berlin","Madrid","Paris","Rome","C"
"identification","Powerhouse of the cell?","","","","","Mitochondria"
"enumeration","List the 3 primary colors","","","","","Red|Blue|Yellow"`}
            </pre>
          </div>

          {/* JSON Example */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileJson className="w-4 h-4 text-[#8E9196]" />
              <span className="text-[#8E9196] text-xs font-bold uppercase tracking-wider">JSON Format</span>
            </div>
            <pre className="text-xs bg-[#16191D] rounded-2xl p-4 overflow-x-auto text-[#C4C7C5] font-mono leading-relaxed border border-white/5">
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

          <div className="space-y-1.5 text-xs text-[#8E9196]">
            <p>
              <strong className="text-[#E2E2E6]">Multiple Choice:</strong> <code className="bg-[#16191D] px-1.5 py-0.5 rounded text-[color:var(--accent)]">correctAnswer</code> = A, B, C, or D.
            </p>
            <p>
              <strong className="text-[#E2E2E6]">Identification:</strong> <code className="bg-[#16191D] px-1.5 py-0.5 rounded text-[color:var(--accent)]">correctAnswer</code> = the exact text answer (case-insensitive).
            </p>
            <p>
              <strong className="text-[#E2E2E6]">Enumeration:</strong> <code className="bg-[#16191D] px-1.5 py-0.5 rounded text-[color:var(--accent)]">correctAnswer</code> = items separated by <code className="bg-[#16191D] px-1.5 py-0.5 rounded text-[color:var(--accent)]">|</code> (order doesn't matter).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
