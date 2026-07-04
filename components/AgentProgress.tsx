'use client';

import { Bot, CheckCircle2, Circle, Loader2, Zap, FileSearch, Mail, Database } from 'lucide-react';

interface StepEvent {
  type: 'step_start' | 'step_complete';
  tool: string;
  label: string;
  step: number;
  total: number;
  percent: number;
  result?: any;
}

interface AgentProgressProps {
  steps: StepEvent[];
  currentPercent: number;
  isComplete: boolean;
}

const TOOL_META: Record<string, { icon: React.ElementType; color: string; bg: string; title: string }> = {
  parse_and_score_tool:     { icon: FileSearch, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',    title: 'CV Analysis & Scoring'     },
  draft_outreach_tool:      { icon: Mail,       color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', title: 'Drafting Outreach Email'   },
  summarize_interview_tool: { icon: FileSearch, color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',  title: 'Interview Summarization'   },
  save_to_pipeline_tool:    { icon: Database,   color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200',title: 'Saving to Pipeline'       },
};

export default function AgentProgress({ steps, currentPercent, isComplete }: AgentProgressProps) {
  // Build a deduplicated list of step statuses
  const stepMap = new Map<string, { started: boolean; done: boolean; event: StepEvent }>();
  for (const s of steps) {
    const existing = stepMap.get(s.tool);
    if (!existing) {
      stepMap.set(s.tool, { started: s.type === 'step_start', done: s.type === 'step_complete', event: s });
    } else {
      if (s.type === 'step_complete') existing.done = true;
    }
  }
  const stepList = Array.from(stepMap.values());

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto py-4 px-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">HireIQ Agent Running</p>
          <p className="text-xs text-slate-400">Processing candidate in real-time…</p>
        </div>
        {!isComplete && (
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin ml-auto" />
        )}
        {isComplete && (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${isComplete ? 100 : currentPercent}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
          }}
        />
        {/* Shimmer */}
        {!isComplete && (
          <div
            className="absolute inset-y-0 w-20 rounded-full animate-pulse opacity-50"
            style={{
              left: `${Math.max(0, currentPercent - 10)}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
            }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] font-semibold text-slate-400 -mt-2 px-0.5">
        <span>0%</span>
        <span className="text-indigo-600">{isComplete ? '100%' : `${currentPercent}%`}</span>
        <span>100%</span>
      </div>

      {/* Step Cards */}
      <div className="flex flex-col gap-3 mt-1">
        {stepList.map(({ started, done, event }) => {
          const meta = TOOL_META[event.tool];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <div
              key={event.tool}
              className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-300 ${
                done
                  ? 'bg-white border-slate-200 opacity-100'
                  : started
                  ? `${meta.bg} border opacity-100`
                  : 'bg-slate-50 border-slate-100 opacity-50'
              }`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                done ? 'bg-emerald-100' : started ? meta.bg : 'bg-slate-100'
              } border ${done ? 'border-emerald-200' : 'border-transparent'}`}>
                {done
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : started
                  ? <Loader2 className={`w-5 h-5 ${meta.color} animate-spin`} />
                  : <Icon className="w-5 h-5 text-slate-300" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${done ? 'text-slate-700' : started ? 'text-slate-800' : 'text-slate-400'}`}>
                    {meta.title}
                  </p>
                  {done && event.result?.score !== undefined && (
                    <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Score: {event.result.score}/100
                    </span>
                  )}
                  {done && event.result?.success === true && event.tool === 'save_to_pipeline_tool' && (
                    <span className="ml-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      Saved ✓
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${done ? 'text-emerald-600' : started ? meta.color : 'text-slate-400'}`}>
                  {done ? event.result?.message || 'Completed' : started ? event.label : 'Waiting…'}
                </p>
              </div>

              {/* Step badge */}
              <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                done ? 'text-emerald-600 bg-emerald-50' : started ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 bg-slate-100'
              }`}>
                {event.step}/{event.total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
