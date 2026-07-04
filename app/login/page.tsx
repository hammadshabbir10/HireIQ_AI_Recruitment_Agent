'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Mail, Lock, User, Loader2, Brain, Zap, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Screening',
    description: 'Score every candidate against your job description automatically in seconds.',
  },
  {
    icon: Zap,
    title: 'Instant Outreach',
    description: 'Generate personalised emails for every shortlisted candidate with one click.',
  },
  {
    icon: ShieldCheck,
    title: 'Private Pipeline',
    description: 'Your candidate data is isolated per recruiter account. Always secure.',
  },
];

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Dark branding panel ── */}
      <div className="hidden lg:flex w-1/2 bg-[#0f1117] flex-col justify-center px-16 xl:px-24 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute top-0 right-0 w-[420px] h-[420px] bg-indigo-600 rounded-full blur-[180px] opacity-20" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Hire<span className="text-indigo-400">IQ</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
            Your AI{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
              Recruiting
            </span>
            <br />Partner
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-14 max-w-md">
            Screen CVs, score candidates, send outreach emails, and manage your entire hiring pipeline, all powered by AI.
          </p>

          {/* Feature list */}
          <div className="space-y-7">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <f.icon className="text-indigo-400" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed mt-0.5">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom stats bar */}
          <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-3 gap-6">
            {[
              { value: '10×', label: 'Faster Screening' },
              { value: '98%', label: 'AI Accuracy' },
              { value: '100%', label: 'Secure & Private' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: White auth panel ── */}
      <div className="flex-1 bg-white flex flex-col justify-center items-center px-8 sm:px-12 xl:px-20">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Hire<span className="text-indigo-600">IQ</span></span>
        </div>

        <div className="w-full max-w-[460px]">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="mt-3 text-base text-slate-500">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleAuth}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ width: 17, height: 17 }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 pl-11 pr-4 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ width: 17, height: 17 }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-11 pr-4 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ width: 17, height: 17 }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-11 pr-4 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50"
                  placeholder="Min. 8 characters"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5">
                <p className="text-sm font-medium text-rose-600">{error}</p>
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 flex items-center justify-center gap-2 rounded-xl font-semibold text-base text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 mt-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : isLogin ? (
                  'Sign in to HireIQ'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

    </div>
  );
}
