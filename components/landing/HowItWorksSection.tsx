import { Bot, FileText, Users } from 'lucide-react';

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 bg-slate-50 border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div className="text-center mb-24 relative z-10">
          <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">The Agent Workflow</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">How HireIQ processes candidates</h3>
          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
            Our multi-agent system reads unstructured data, reasons like a human recruiter, and outputs structured, actionable intelligence.
          </p>
        </div>

        {/* Workflow Diagram */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-emerald-200 -translate-y-1/2 rounded-full z-0 opacity-50"></div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative z-10 items-center">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 mx-auto md:mx-0 ring-4 ring-blue-50">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-3 text-center md:text-left">1. Raw Input</h4>
              <p className="text-slate-600 leading-relaxed text-center md:text-left">
                Paste the Job Description and the Candidate's Resume. The AI immediately begins extracting key skills, experience, and requirements.
              </p>
            </div>

            {/* Step 2 (Agent) */}
            <div className="bg-[#111827] rounded-3xl p-8 border border-slate-800 shadow-2xl shadow-indigo-900/40 hover:-translate-y-2 transition-transform duration-300 relative transform md:scale-110 z-20">
              {/* Pulse Effect */}
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-indigo-500 rounded-full border-2 border-[#111827]"></div>
              
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 mx-auto md:mx-0 border border-indigo-500/30 ring-4 ring-[#111827]">
                <Bot className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-3 text-center md:text-left">2. AI Reasoning</h4>
              <p className="text-slate-400 leading-relaxed text-center md:text-left">
                The LangGraph agent scores the candidate, identifies missing skills, and drafts a personalized outreach email based on its findings.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 mx-auto md:mx-0 ring-4 ring-emerald-50">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-3 text-center md:text-left">3. Pipeline Setup</h4>
              <p className="text-slate-600 leading-relaxed text-center md:text-left">
                The candidate is automatically saved to your Supabase database and appears in your Kanban pipeline ready for review.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
