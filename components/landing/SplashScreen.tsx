'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<'initial' | 'expanded' | 'fading'>('initial');

  useEffect(() => {
    // 1. After a short delay, expand the logo and show text
    const t1 = setTimeout(() => {
      setStage('expanded');
    }, 400);

    // 2. After 2.5s total, start fading out the whole screen
    const t2 = setTimeout(() => {
      setStage('fading');
    }, 2500);

    // 3. After 3s total, complete the splash screen
    const t3 = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1120] transition-opacity duration-500 ease-in-out ${
        stage === 'fading' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Single subtle background ring, expands with the logo */}
        <div 
          className={`absolute rounded-full border border-indigo-500/20 transition-all duration-1000 ease-out ${
            stage !== 'initial' ? 'w-[32rem] h-[32rem] opacity-100' : 'w-32 h-32 opacity-0'
          }`}
        ></div>
        
        {/* Logo scaling up */}
        <div 
          className={`relative z-10 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col items-center justify-center ${
            stage !== 'initial' ? 'scale-100 translate-y-0' : 'scale-50 translate-y-10'
          }`}
        >
          <img 
            src="/zikra_infotech_logo.png" 
            alt="Zikra Info Tech Logo" 
            className="h-28 w-auto object-contain drop-shadow-[0_0_35px_rgba(59,130,246,0.25)]"
          />
          
          <div className={`transition-all duration-1000 delay-300 text-center mt-6 ${
            stage !== 'initial' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">HireIQ</h1>
            <p className="text-blue-300 mt-2 text-xs font-bold tracking-[0.2em] uppercase">By Zikra Info Tech</p>
          </div>
        </div>
      </div>
    </div>
  );
}
