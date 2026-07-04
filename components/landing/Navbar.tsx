'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { LayoutDashboard, LogOut, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="fixed top-0 w-full z-40 bg-[#111827] border-b border-slate-800">
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Left: Logo */}
          <div className="flex-1 flex items-center gap-3">
            <img
              src="/hireiq_logo.png"
              alt="HireIQ Logo"
              className="h-14 w-14 object-contain rounded-xl shadow-lg shadow-indigo-500/20"
            />
            <span className="text-white font-bold text-2xl tracking-tight">
              Hire<span className="text-indigo-400">IQ</span>
            </span>
          </div>

          {/* Middle: Links */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-10 pl-8">
            <a href="#features" className="relative text-base font-medium text-slate-300 hover:text-white transition-colors group py-2">
              Features
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full"></span>
            </a>
            <a href="#how-it-works" className="relative text-base font-medium text-slate-300 hover:text-white transition-colors group py-2">
              How it Works
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full"></span>
            </a>
            <a href="#faq" className="relative text-base font-medium text-slate-300 hover:text-white transition-colors group py-2">
              FAQ
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full"></span>
            </a>
          </div>

          {/* Right: Auth */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-4">
            {!loading && (
              user ? (
                /* ── Logged-in state ── */
                <>
                  <Link href="/dashboard">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm shadow-md shadow-indigo-500/30 gap-1.5 mr-2">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Launch App
                    </Button>
                  </Link>
                  <div className="text-right hidden lg:block border-l border-slate-700 pl-4">
                    <p className="text-sm font-medium text-white leading-tight">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-indigo-400">Recruiter</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800 ml-1"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                /* ── Logged-out state ── */
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full px-4">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm shadow-md shadow-indigo-500/30">
                      Launch App
                    </Button>
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile Nav */}
          <div className="flex md:hidden items-center gap-2">
            {!loading && (
              user ? (
                <>
                  <Link href="/dashboard">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </Button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">Sign In</Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">Launch App</Button>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
