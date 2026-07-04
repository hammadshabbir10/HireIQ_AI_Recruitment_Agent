'use client';

import { useState, useEffect } from 'react';
import InputPanel from '@/components/InputPanel';
import ChatPanel from '@/components/ChatPanel';
import PipelineTable from '@/components/PipelineTable';
import PreScreenPanel from '@/components/PreScreenPanel';
import { Candidate, Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Bot, KanbanSquare, BarChart3, ArrowLeft, Users, UserCheck, UserX, Clock, Trophy, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface StepEvent {
  type: 'step_start' | 'step_complete';
  tool: string;
  label: string;
  step: number;
  total: number;
  percent: number;
  result?: any;
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState('agent');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState<StepEvent[]>([]);
  const [currentPercent, setCurrentPercent] = useState(0);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setIsTabLoading(true);
    setActiveTab(tab);
    setTimeout(() => setIsTabLoading(false), 400);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error('Failed to fetch candidates', error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleStatusChange = async (id: string, status: Candidate['status']) => {
    try {
      const res = await fetch('/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchCandidates();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this candidate from the pipeline?')) return;
    try {
      const res = await fetch('/api/candidates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id));
      } else {
        alert('Failed to delete candidate.');
      }
    } catch (error) {
      console.error('Failed to delete candidate', error);
      alert('Failed to delete candidate.');
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { id: uuidv4(), role: 'user', content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setAgentSteps([]);
    setCurrentPercent(0);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: messages }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect to agent');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'step_start' || event.type === 'step_complete') {
              setAgentSteps((prev) => [...prev, event as StepEvent]);
              setCurrentPercent(event.percent ?? 0);
            } else if (event.type === 'response') {
              const aiMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: event.message,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, aiMessage]);
              setCurrentPercent(100);
              if (content.toLowerCase().includes('screen') || content.toLowerCase().includes('summarize')) {
                fetchCandidates();
              }
            } else if (event.type === 'error') {
              const errMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: `⚠️ ${event.message}`,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errMessage]);
            }
          } catch {}
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), role: 'assistant', content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR / TOP NAV ON MOBILE */}
      <aside className="w-full md:w-64 h-auto md:h-full bg-[#111827] flex flex-col shrink-0 border-b md:border-r border-slate-800 z-20 transition-all duration-300">
        <div className="p-4 md:p-6 flex justify-between items-center md:items-start md:flex-col">
          <div className="flex items-center gap-3 md:mb-4">
            <Link href="/">
              <img
                src="/hireiq_logo.png"
                alt="HireIQ Logo"
                className="h-8 md:h-10 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer rounded-lg"
              />
            </Link>
            <div className="hidden md:block">
              <h1 className="font-bold text-2xl leading-none text-white tracking-tight">HireIQ</h1>
              <p className="text-xs uppercase font-semibold text-indigo-400 tracking-wider mt-1.5">Agent Dashboard</p>
            </div>
            <div className="md:hidden block">
               <h1 className="font-bold text-xl leading-none text-white tracking-tight">HireIQ</h1>
            </div>
          </div>
          <div className="mt-0 md:mt-5">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-400 hover:text-white transition-colors bg-slate-800/50 md:bg-transparent px-3 py-1.5 md:px-0 md:py-0 rounded-lg">
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden md:inline">Back to Landing Page</span><span className="inline md:hidden">Back</span>
            </Link>
          </div>
        </div>
        
        <nav className="px-2 pb-3 md:pb-0 md:px-4 md:flex-1 flex justify-between md:flex-col gap-1 md:space-y-2 mt-0 md:mt-2 shrink-0">
          <button 
            onClick={() => handleTabChange('agent')} 
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all flex-1 md:flex-none ${
              activeTab === 'agent' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 bg-transparent'
            }`}
          >
            <Bot className="w-5 h-5 md:w-5 md:h-5" />
            <span className="font-medium text-[10px] md:text-sm">Workflow</span>
          </button>
          
          <button 
            onClick={() => handleTabChange('pipeline')} 
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all flex-1 md:flex-none ${
              activeTab === 'pipeline' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 bg-transparent'
            }`}
          >
            <KanbanSquare className="w-5 h-5 md:w-5 md:h-5" />
            <span className="font-medium text-[10px] md:text-sm">Pipeline</span>
          </button>

          <button 
            onClick={() => handleTabChange('prescreen')} 
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all flex-1 md:flex-none ${
              activeTab === 'prescreen' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 bg-transparent'
            }`}
          >
            <ClipboardList className="w-5 h-5 md:w-5 md:h-5" />
            <span className="font-medium text-[10px] md:text-sm">Forms</span>
          </button>

          <button 
            onClick={() => handleTabChange('analytics')} 
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all flex-1 md:flex-none ${
              activeTab === 'analytics' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 bg-transparent'
            }`}
          >
            <BarChart3 className="w-5 h-5 md:w-5 md:h-5" />
            <span className="font-medium text-[10px] md:text-sm">Analytics</span>
          </button>
        </nav>
        
        {user && (
          <div className="hidden md:block p-4 border-t border-slate-800/60 bg-slate-900/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 shadow-inner">
                <UserIcon className="w-5 h-5 text-slate-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white leading-tight truncate">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Recruiter</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-400 bg-slate-800/50 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50 hover:border-rose-900/50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto md:overflow-hidden bg-slate-50/50">
        <div className="flex-1 p-3 md:p-6 lg:max-w-[1400px] lg:mx-auto w-full flex flex-col min-h-0 relative">
          
          {/* Loading Overlay */}
          {isTabLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm transition-all rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Loading view...</p>
              </div>
            </div>
          )}

          <div className={`flex-1 h-full flex flex-col transition-opacity duration-300 ${activeTab === 'agent' && !isTabLoading ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
              {/* Left: Input Panel */}
              <div className="h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                <InputPanel onSubmit={handleSendMessage} isLoading={isLoading} />
              </div>
              {/* Right: Chat / Results Panel */}
              <div className="h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                <ChatPanel
                  messages={messages}
                  isLoading={isLoading}
                  onSend={handleSendMessage}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  agentSteps={agentSteps}
                  currentPercent={currentPercent}
                />
              </div>
            </div>
          </div>

          {/* Pre-Screen Tab */}
          <div className={`flex-1 h-full flex flex-col transition-opacity duration-300 ${activeTab === 'prescreen' && !isTabLoading ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <PreScreenPanel />
          </div>

          {/* Pipeline Tab */}
          <div className={`flex-1 h-full flex flex-col transition-opacity duration-300 ${activeTab === 'pipeline' && !isTabLoading ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-6 py-5 flex-1 flex flex-col overflow-hidden">
              <div className="mb-6 border-b border-slate-100 pb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Candidate Pipeline</h2>
                <p className="text-sm text-slate-500 mt-1.5">Manage and track candidates through the hiring process. Remove them when no longer needed.</p>
              </div>
              <PipelineTable candidates={candidates} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            </div>
          </div>

          {/* Analytics Tab (Enhanced UI) */}
          <div className={`flex-1 h-full flex flex-col transition-opacity duration-300 ${activeTab === 'analytics' && !isTabLoading ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-8 py-8 flex-1 overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                    Hiring Analytics
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Overview of your recruitment pipeline and candidate conversion rates.</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100 flex items-center gap-2 shadow-sm">
                  <Clock className="w-4 h-4" /> Last 30 Days
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="bg-slate-100 p-3 rounded-lg"><Users className="w-6 h-6 text-slate-700" /></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Sourced</p>
                    <p className="text-3xl font-bold text-slate-900">{candidates.length}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white to-indigo-50/50 p-5 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-4">
                  <div className="bg-indigo-100 p-3 rounded-lg"><Trophy className="w-6 h-6 text-indigo-700" /></div>
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Shortlisted</p>
                    <p className="text-3xl font-bold text-slate-900">{candidates.filter(c => c.status === 'shortlisted').length}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white to-emerald-50/50 p-5 rounded-xl border border-emerald-100 shadow-sm flex items-start gap-4">
                  <div className="bg-emerald-100 p-3 rounded-lg"><UserCheck className="w-6 h-6 text-emerald-700" /></div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Contacted</p>
                    <p className="text-3xl font-bold text-slate-900">{candidates.filter(c => c.status === 'contacted').length}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white to-rose-50/50 p-5 rounded-xl border border-rose-100 shadow-sm flex items-start gap-4">
                  <div className="bg-rose-100 p-3 rounded-lg"><UserX className="w-6 h-6 text-rose-700" /></div>
                  <div>
                    <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Rejected</p>
                    <p className="text-3xl font-bold text-slate-900">{candidates.filter(c => c.status === 'rejected').length}</p>
                  </div>
                </div>
              </div>

              {/* Funnel Visualization */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 mb-8">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">Pipeline Funnel</h3>
                
                {candidates.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No data available. Add candidates to see the funnel.</div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {/* Sourced */}
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-600">Sourced</span>
                        <span className="text-slate-900">{candidates.length} (100%)</span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                    
                    {/* Evaluated (Not Pending) */}
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-indigo-600">Evaluated by AI</span>
                        <span className="text-indigo-900">{candidates.filter(c => c.status !== 'pending').length} ({Math.round((candidates.filter(c => c.status !== 'pending').length / candidates.length) * 100)}%)</span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${Math.round((candidates.filter(c => c.status !== 'pending').length / candidates.length) * 100)}%` }}></div>
                      </div>
                    </div>

                    {/* Shortlisted + Contacted */}
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-emerald-600">Passed Screening (Shortlisted/Contacted)</span>
                        <span className="text-emerald-900">{candidates.filter(c => c.status === 'shortlisted' || c.status === 'contacted').length} ({Math.round((candidates.filter(c => c.status === 'shortlisted' || c.status === 'contacted').length / candidates.length) * 100)}%)</span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${Math.round((candidates.filter(c => c.status === 'shortlisted' || c.status === 'contacted').length / candidates.length) * 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Evaluation Scores Comparison */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Evaluation Scores Comparison</h3>
                  <p className="text-sm text-slate-500">Comparing initial AI CV screening score vs candidate's pre-screen questionnaire performance.</p>
                </div>
                
                {candidates.filter(c => c.questionnaires && c.questionnaires.length > 0 && c.questionnaires[0].status === 'submitted').length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-slate-500 text-sm">No pre-screen forms submitted yet. Once candidates submit their forms, the analysis will appear here.</p>
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={candidates
                          .filter(c => c.questionnaires && c.questionnaires.length > 0 && c.questionnaires[0].status === 'submitted')
                          .map(c => ({
                            name: (c.name || 'Candidate').split(' ')[0], // First name for axis
                            fullName: c.name || 'Candidate',
                            'CV Score': c.score,
                            'Pre-Screen Score': c.questionnaires![0].pre_screen_score || 0,
                          }))
                        }
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="CV Score" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="Pre-Screen Score" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
