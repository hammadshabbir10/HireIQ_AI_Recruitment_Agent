'use client';
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText, User, MessageSquare, Sparkles, Upload, ClipboardPaste, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface InputPanelProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export default function InputPanel({ onSubmit, isLoading }: InputPanelProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [cvText, setCvText] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [mode, setMode] = useState<'screen' | 'interview'>('screen');
  // CV input mode: 'paste' or 'upload'
  const [cvMode, setCvMode] = useState<'paste' | 'upload'>('paste');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    // Strict PDF validation
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      setUploadError('Only .pdf files are accepted. Please upload a valid PDF.');
      setUploadState('error');
      return;
    }

    setUploadedFile(file);
    setUploadState('loading');
    setUploadError('');
    setCvText('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to parse PDF');
      }

      setCvText(data.text);
      setUploadState('success');
    } catch (err: any) {
      setUploadState('error');
      setUploadError(err.message || 'Failed to extract text from PDF.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndUpload(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const clearFile = () => {
    setUploadedFile(null);
    setUploadState('idle');
    setUploadError('');
    setCvText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScreenSubmit = () => {
    if (!jobDescription.trim() || !cvText.trim()) return;
    const message = `Please screen this candidate for the following role.\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CV:\n${cvText}\n\nPlease parse their CV, score them against the job description, draft an outreach email, and save them to the pipeline.`;
    onSubmit(message);
  };

  const handleInterviewSubmit = () => {
    if (!interviewNotes.trim() || !candidateName.trim()) return;
    const message = `Please summarize the following interview for candidate: ${candidateName}\n\nINTERVIEW NOTES:\n${interviewNotes}\n\nPlease provide a structured summary with strengths, weaknesses, and a recommendation, then save it to the pipeline.`;
    onSubmit(message);
    setInterviewNotes('');
    setCandidateName('');
  };

  const canSubmitScreen = !isLoading && !!jobDescription.trim() && !!cvText.trim();

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Agent Inputs
        </h2>
        {/* Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mt-4 gap-1">
          <button
            onClick={() => setMode('screen')}
            className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all ${
              mode === 'screen' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Screen Candidate
          </button>
          <button
            onClick={() => setMode('interview')}
            className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all ${
              mode === 'interview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Summarize Interview
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
        {mode === 'screen' ? (
          <>
            {/* ── Job Description ── */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                Job Description
              </label>
              <textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full text-sm h-36 resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all leading-relaxed"
              />
            </div>

            {/* ── Candidate CV ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Candidate CV
                </label>
                {/* Paste / Upload Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => { setCvMode('paste'); clearFile(); }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                      cvMode === 'paste' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    Paste
                  </button>
                  <button
                    onClick={() => setCvMode('upload')}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                      cvMode === 'upload' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    Upload PDF
                  </button>
                </div>
              </div>

              {/* Paste Mode */}
              {cvMode === 'paste' && (
                <textarea
                  placeholder="Paste the candidate's CV or resume text here..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  className="w-full text-sm h-48 resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all leading-relaxed"
                />
              )}

              {/* Upload Mode */}
              {cvMode === 'upload' && (
                <div>
                  {/* Drop zone — only show if no file uploaded yet */}
                  {uploadState === 'idle' || uploadState === 'error' ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center gap-3 h-48 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                        isDragging
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        <Upload className={`w-5 h-5 transition-colors ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">
                          {isDragging ? 'Drop PDF here' : 'Click or drag & drop'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PDF files only (.pdf)</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : null}

                  {/* Loading State */}
                  {uploadState === 'loading' && (
                    <div className="flex flex-col items-center justify-center gap-3 h-48 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">Extracting CV text...</p>
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{uploadedFile?.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Success State */}
                  {uploadState === 'success' && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">PDF parsed successfully</p>
                            <p className="text-xs text-emerald-600 mt-0.5 truncate max-w-[200px]">{uploadedFile?.name}</p>
                            <p className="text-xs text-emerald-500 mt-0.5">{cvText.length.toLocaleString()} characters extracted</p>
                          </div>
                        </div>
                        <button onClick={clearFile} className="text-emerald-400 hover:text-emerald-700 transition-colors mt-0.5">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {uploadState === 'error' && (
                    <div className="mt-2 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700 font-medium">{uploadError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Interview Mode ── */
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <User className="w-4 h-4 text-indigo-500" />
                Candidate Name
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Interview Notes
              </label>
              <textarea
                placeholder="Paste raw interview notes or transcript here..."
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                className="w-full text-sm h-64 resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer / Submit */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white">
        {mode === 'screen' ? (
          <Button
            onClick={handleScreenSubmit}
            disabled={!canSubmitScreen}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] text-base disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Screening Candidate...</>
            ) : uploadState === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Parsing PDF...</>
            ) : (
              'Start Screening'
            )}
          </Button>
        ) : (
          <Button
            onClick={handleInterviewSubmit}
            disabled={isLoading || !interviewNotes.trim() || !candidateName.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] text-base disabled:opacity-50"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Summarizing...</> : 'Summarize Interview'}
          </Button>
        )}
      </div>
    </div>
  );
}
