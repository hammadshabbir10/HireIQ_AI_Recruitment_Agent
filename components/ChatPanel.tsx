'use client';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Message } from '@/types';
import { Bot, User, Send, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import AgentProgress from '@/components/AgentProgress';
import type { StepEvent } from '@/app/dashboard/page';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  agentSteps: StepEvent[];
  currentPercent: number;
}

// Smart message bubble — collapses long user messages (e.g. JD + CV dumps)
function MessageBubble({ msg }: { msg: Message }) {
  const [expanded, setExpanded] = useState(false);
  const isUser = msg.role === 'user';

  // Extract a clean label for long user messages (screening requests)
  const getShortLabel = (content: string) => {
    if (content.includes('JOB DESCRIPTION:') && content.includes('CANDIDATE CV:')) {
      const jdMatch = content.match(/Job Title:\s*(.+)/);
      const cvMatch = content.match(/^(.+?)\s+Software|^(.+?)\s+Engineer|^([A-Z][a-z]+ [A-Z][a-z]+)/m);
      const jobTitle = jdMatch ? jdMatch[1].trim() : 'Role';
      return `📋 Screening request submitted for "${jobTitle}"`;
    }
    if (content.includes('INTERVIEW NOTES:')) {
      const nameMatch = content.match(/candidate: (.+)\n/);
      return `🗒️ Interview summary request${nameMatch ? ` for ${nameMatch[1]}` : ''}`;
    }
    return null;
  };

  const COLLAPSE_THRESHOLD = 300;
  const isLong = msg.content.length > COLLAPSE_THRESHOLD;
  const shortLabel = isUser ? getShortLabel(msg.content) : null;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
        isUser ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-indigo-100 text-indigo-600'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] rounded-2xl text-sm leading-relaxed shadow-sm ${
        isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-600/20 px-4 py-3'
          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm px-4 py-3'
      }`}>
        {/* User messages: show short label if it's a long structured request */}
        {isUser && shortLabel && !expanded ? (
          <div>
            <p className="font-medium">{shortLabel}</p>
            <button
              onClick={() => setExpanded(true)}
              className="mt-2 flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors"
            >
              <ChevronDown className="h-3 w-3" /> View full content
            </button>
          </div>
        ) : isUser && isLong && !shortLabel && !expanded ? (
          <div>
            <p className="whitespace-pre-wrap">{msg.content.slice(0, 200)}…</p>
            <button
              onClick={() => setExpanded(true)}
              className="mt-2 flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors"
            >
              <ChevronDown className="h-3 w-3" /> Show more
            </button>
          </div>
        ) : (
          <div>
            <p className="whitespace-pre-wrap">{msg.content}</p>
            {isUser && (isLong || shortLabel) && (
              <button
                onClick={() => setExpanded(false)}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors"
              >
                <ChevronUp className="h-3 w-3" /> Collapse
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  isLoading,
  onSend,
  inputValue,
  setInputValue,
  agentSteps,
  currentPercent,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        onSend(inputValue);
        setInputValue('');
      }
    }
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none rounded-none bg-white">
      {/* Header */}
      <CardHeader className="pb-4 border-b border-slate-100 px-6 pt-6 shrink-0">
        <CardTitle className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          HireIQ Agent
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Provide inputs on the left, or ask me anything directly.
        </p>
      </CardHeader>

      {/* Messages area — internal scroll only */}
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 border border-indigo-100">
                <Bot className="h-8 w-8 text-indigo-500" />
              </div>
              <p className="font-semibold text-slate-700 text-base mb-2">HireIQ is ready</p>
              <p className="text-sm text-slate-400 max-w-[260px] leading-relaxed">
                Fill in the Job Description and CV on the left, then click <strong>Start Screening Process</strong>.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Agent Progress — shows in-place while loading */}
          {isLoading && agentSteps.length > 0 && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                <AgentProgress
                  steps={agentSteps}
                  currentPercent={currentPercent}
                  isComplete={false}
                />
              </div>
            </div>
          )}

          {isLoading && agentSteps.length === 0 && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-slate-400 ml-1">Agent is processing…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Chat Input — always pinned to bottom */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0">
          <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask HireIQ anything…"
              rows={1}
              disabled={isLoading}
              className="flex-1 max-h-[120px] min-h-[44px] text-sm resize-none bg-transparent px-4 py-3 focus:outline-none disabled:opacity-50 custom-scrollbar text-slate-700 placeholder:text-slate-400"
            />
            <Button
              onClick={() => {
                if (inputValue.trim() && !isLoading) {
                  onSend(inputValue);
                  setInputValue('');
                }
              }}
              disabled={isLoading || !inputValue.trim()}
              size="icon"
              variant="ghost"
              className="mr-2 h-9 w-9 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-300 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </CardContent>
    </Card>
  );
}
