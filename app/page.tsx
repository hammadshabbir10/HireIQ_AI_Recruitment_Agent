'use client';

import { useState } from 'react';
import SplashScreen from '@/components/landing/SplashScreen';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/FAQSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-500/30">
        <Navbar />
        
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <FAQSection />
        </main>
        
        <Footer />
      </div>
    </>
  );
}
