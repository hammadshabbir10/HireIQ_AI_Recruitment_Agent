'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, ExternalLink, ChevronDown, ChevronUp, CheckCircle, Clock, Trash2, Star } from 'lucide-react';

interface ScoredAnswer {
  id: number;
  question: string;
  expected_answer: string;
  candidate_answer: string;
  ai_score: number;
  feedback: string;
}

interface Questionnaire {
  id: string;
  job_title: string;
  form_token: string;
  status: 'pending' | 'submitted';
  pre_screen_score: number | null;
  submitted_at: string | null;
  created_at: string;
  questions: any[];
  answers: ScoredAnswer[] | null;
  candidates: { name: string; email: string; score: number; status: string };
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}><Star className="w-3 h-3" />{score}/100</span>;
}

function AnswerRow({ ans, idx }: { ans: ScoredAnswer; idx: number }) {
  const scoreColor = ans.ai_score >= 7 ? 'text-emerald-600' : ans.ai_score >= 4 ? 'text-amber-500' : 'text-rose-500';
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-slate-800">Q{idx + 1}. {ans.question}</p>
        <span className={`text-sm font-bold shrink-0 ${scoreColor}`}>{ans.ai_score}/10</span>
      </div>
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-semibold text-slate-500 uppercase tracking-wide">Candidate Answer</span>
          <p className="mt-1 text-slate-700 leading-relaxed">{ans.candidate_answer || '(No answer)'}</p>
        </div>
        <div>
          <span className="font-semibold text-slate-500 uppercase tracking-wide">Expected Answer</span>
          <p className="mt-1 text-slate-400 leading-relaxed">{ans.expected_answer}</p>
        </div>
        {ans.feedback && (
          <div className={`px-3 py-2 rounded-lg ${ans.ai_score >= 7 ? 'bg-emerald-50 text-emerald-700' : ans.ai_score >= 4 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
            <span className="font-semibold">AI Feedback: </span>{ans.feedback}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionnaireRow({ q, onDelete }: { q: Questionnaire; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const formUrl = `${baseUrl}/pre-screen/${q.form_token}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Row header */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-indigo-700">{q.candidates?.name?.[0] ?? '?'}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{q.candidates?.name}</p>
          <p className="text-xs text-slate-400 truncate">{q.job_title} · CV Score: {q.candidates?.score}/100</p>
        </div>

        {/* Status */}
        <div className="shrink-0 flex items-center gap-3">
          {q.status === 'submitted' ? (
            <>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Submitted
              </span>
              {q.pre_screen_score !== null && <ScoreBadge score={q.pre_screen_score} />}
            </>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
              <Clock className="w-3.5 h-3.5" /> Awaiting
            </span>
          )}

          {/* Actions */}
          <a href={formUrl} target="_blank" rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Open form link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          {q.status === 'submitted' && (
            <button onClick={() => setExpanded(e => !e)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button onClick={() => onDelete(q.id)}
            className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title="Delete questionnaire"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded answers */}
      {expanded && q.answers && q.answers.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-5 space-y-3 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-700">Answer Sheet</h4>
            {q.pre_screen_score !== null && (
              <div className="text-sm font-semibold text-slate-600">
                Overall: <ScoreBadge score={q.pre_screen_score} />
              </div>
            )}
          </div>
          {q.answers.map((ans, i) => <AnswerRow key={i} ans={ans} idx={i} />)}
          {q.submitted_at && (
            <p className="text-xs text-slate-400 text-right pt-2">
              Submitted: {new Date(q.submitted_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PreScreenPanel() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'pending'>('all');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/questionnaires');
    const d = await res.json();
    setQuestionnaires(d.questionnaires || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this questionnaire?')) return;
    await fetch('/api/questionnaires', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setQuestionnaires(q => q.filter(x => x.id !== id));
  };

  const filtered = questionnaires.filter(q => filter === 'all' || q.status === filter);
  const submitted = questionnaires.filter(q => q.status === 'submitted').length;
  const pending = questionnaires.filter(q => q.status === 'pending').length;
  const avgScore = questionnaires.filter(q => q.pre_screen_score !== null).length > 0
    ? Math.round(questionnaires.filter(q => q.pre_screen_score !== null).reduce((s, q) => s + (q.pre_screen_score ?? 0), 0) / questionnaires.filter(q => q.pre_screen_score !== null).length)
    : null;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-6 py-6 flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            Pre-Screen Forms
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track candidate questionnaire responses</p>
        </div>
        <button onClick={load} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Sent', value: questionnaires.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Submitted', value: submitted, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Avg Score', value: avgScore !== null ? `${avgScore}/100` : 'N/A', color: 'bg-violet-50 text-violet-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-5 gap-1">
        {(['all', 'submitted', 'pending'] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all capitalize ${filter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {f} {f === 'all' ? `(${questionnaires.length})` : f === 'submitted' ? `(${submitted})` : `(${pending})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading questionnaires…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No forms yet</p>
            <p className="text-xs text-slate-400">Screen a shortlisted candidate to auto-generate a form</p>
          </div>
        ) : (
          filtered.map(q => <QuestionnaireRow key={q.id} q={q} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  );
}
