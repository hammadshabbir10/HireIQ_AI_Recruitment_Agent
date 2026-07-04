import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Text */}
          <div className="max-w-xl">
            <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6">
              For Talent Acquisition Teams
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
              Every candidate's potential, <br className="hidden md:block" />
              <span className="text-indigo-600">evaluated in seconds.</span>
            </h1>
            
            <p className="text-xl text-slate-500 mb-10 leading-relaxed">
              HireIQ gives recruiters an instant snapshot of each applicant's qualifications, matching score, and customized outreach so nothing falls through the cracks.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Link href="/dashboard">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-7 h-14 text-lg font-medium shadow-lg shadow-indigo-600/30 group">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none group cursor-default perspective-1000 mt-10 lg:mt-0">
            {/* Soft background blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-50/50 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100/50 transition-colors duration-700"></div>
            
            {/* Faux Card UI */}
            <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100 p-8 lg:p-10 relative z-10 transition-all duration-500 transform group-hover:-translate-y-3 group-hover:shadow-[0_40px_80px_rgba(79,70,229,0.15)] group-hover:rotate-1">
              {/* Fake window controls */}
              <div className="flex items-center gap-2 mb-8">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-400"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
              </div>

              {/* Candidate Header */}
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    HS
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl">Hammad Shabbir</h3>
                    <p className="text-base text-slate-500">Software Engineer • 92/100 Score</p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-sm">
                  Strong Match
                </span>
              </div>

              {/* AI Evaluation Summary */}
              <div className="mb-10 border-y border-slate-100 py-6">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-sm">AI Evaluation Summary</span>
                </div>
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl"></div>
                  <p className="text-sm text-slate-600 leading-relaxed italic pl-2">
                    "Candidate is a strong match for the role. They completed the automated pre-screen questionnaire with a score of <strong>84/100</strong>, demonstrating excellent problem-solving capabilities and system design knowledge."
                  </p>
                </div>
              </div>

              {/* Faux Checklist */}
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <span className="text-base text-slate-700 font-semibold">Parsed CV and scored</span>
                  </div>
                  <span className="text-xs font-extrabold tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-md">DONE</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <span className="text-base text-slate-700 font-semibold">Drafted outreach email</span>
                  </div>
                  <span className="text-xs font-extrabold tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-md">DONE</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50/50 border border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full border-2 border-slate-300" />
                    <span className="text-base text-slate-700 font-semibold">Review pending</span>
                  </div>
                  <span className="text-xs font-extrabold tracking-wider text-rose-600 bg-rose-100 px-3 py-1.5 rounded-md">URGENT</span>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
