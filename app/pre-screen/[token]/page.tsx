'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, ClipboardList, Loader2, Send, ChevronRight } from 'lucide-react';

interface Question {
  id: number;
  type: 'technical' | 'behavioural' | 'gap-probe';
  question: string;
  expected_answer: string;
}

interface Questionnaire {
  id: string;
  job_title: string;
  questions: Question[];
  status: 'pending' | 'submitted';
  submitted_at: string | null;
  candidates: { name: string };
}

const TYPE_STYLES: Record<string, string> = {
  technical: 'bg-blue-50 text-blue-700 border-blue-200',
  behavioural: 'bg-violet-50 text-violet-700 border-violet-200',
  'gap-probe': 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function PreScreenForm({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('');
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetch(`/api/questionnaires/${t}`)
        .then(r => r.json())
        .then(d => {
          if (d.error) { setError(d.error); setLoading(false); return; }
          setQuestionnaire(d.questionnaire);
          setAnswers(new Array(d.questionnaire.questions.length).fill(''));
          if (d.questionnaire.status === 'submitted') setSubmitted(true);
          setLoading(false);
        })
        .catch(() => { setError('Could not load form. Please check your link.'); setLoading(false); });
    });
  }, [params]);

  const handleSubmit = async () => {
    if (answers.some(a => !a.trim())) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/questionnaires/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setScore(d.pre_screen_score);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading your form…</p>
        </div>
      </div>
    );
  }

  if (error && !questionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Form Not Found</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Form Submitted!</h2>
          <p className="text-slate-500 mb-6">
            Thank you, <strong>{questionnaire?.candidates?.name}</strong>! Your answers have been received
            and will be reviewed by the recruitment team.
          </p>
          <p className="text-xs text-slate-400">You'll hear back from the recruiter shortly. Good luck!</p>
        </div>
      </div>
    );
  }

  const q = questionnaire!;
  const questions = q.questions;
  const progress = Math.round(((current + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">HireIQ Pre-Screen</p>
              <p className="text-sm font-bold text-slate-800">{q.job_title}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400">{current + 1} / {questions.length}</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-100">
          <div
            className="h-1 bg-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Welcome banner */}
        {current === 0 && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 mb-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Welcome, {q.candidates?.name}!
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Please answer all <strong>{questions.length} questions</strong> below for the{' '}
              <strong>{q.job_title}</strong> role. Be honest and specific. Your answers will be
              reviewed by the recruiter. This should take about <strong>10–15 minutes</strong>.
            </p>
          </div>
        )}

        {/* Current question */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-7 mb-6 transition-all">
          <div className="flex items-start justify-between mb-5">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${TYPE_STYLES[questions[current].type] || 'bg-slate-100 text-slate-600'}`}>
              {questions[current].type}
            </span>
            <span className="text-xs text-slate-400">Question {current + 1}</span>
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-5 leading-relaxed">
            {questions[current].question}
          </h2>
          <textarea
            value={answers[current]}
            onChange={e => {
              const updated = [...answers];
              updated[current] = e.target.value;
              setAnswers(updated);
            }}
            placeholder="Type your answer here…"
            rows={5}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all leading-relaxed"
          />
          <p className="text-xs text-slate-400 mt-2 text-right">{answers[current].length} characters</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 font-medium">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-indigo-600 w-5' : answers[i] ? 'bg-indigo-300' : 'bg-slate-200'}`}
              />
            ))}
          </div>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/25"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-md shadow-emerald-500/25"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit All</>}
            </button>
          )}
        </div>

        {/* All questions mini-list */}
        <div className="mt-10 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">All Questions</h3>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${i === current ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${answers[i] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {answers[i] ? '✓' : i + 1}
                </span>
                <span className="text-xs text-slate-600 line-clamp-1">{q.question}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
