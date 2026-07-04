'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show splash for 2 seconds, then start fading out
    const timer1 = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // After 2.5 seconds (allowing 500ms for fade out), unmount splash
    const timer2 = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!showSplash) return <>{children}</>;

  return (
    <>
      <div 
        className={`fixed inset-0 z-[100] bg-[#111827] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${
          isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="relative flex flex-col items-center">
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full w-64 h-64 animate-pulse"></div>
          
          {/* Icon */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-bounce mb-6">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>

          {/* Title */}
          <h1 className="relative text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Hire<span className="text-indigo-400">IQ</span>
          </h1>
          <p className="relative text-indigo-200/60 mt-3 tracking-widest text-sm font-semibold uppercase animate-pulse">
            Agent Initializing...
          </p>

          {/* Loading bar */}
          <div className="relative mt-12 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full" style={{ left: '-100%' }}></div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading {
          0% { transform: translateX(0); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
      
      {/* Hide children underneath the splash until it's completely gone to prevent scrolling/interaction */}
      <div className={isFadingOut ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}>
        {children}
      </div>
    </>
  );
}
