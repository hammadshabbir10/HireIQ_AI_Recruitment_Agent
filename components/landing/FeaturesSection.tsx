'use client';

import { FileSearch, Sparkles, Send, ClipboardList, BarChart3 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const features = [
  {
    title: 'Instant CV Parsing',
    description: 'Automatically extracts skills, experience, and education from unstructured resumes in milliseconds.',
    icon: FileSearch,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    title: 'AI Suitability Scoring',
    description: 'Ranks candidates against your specific Job Description with detailed, transparent reasoning.',
    icon: Sparkles,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    title: 'Automated Outreach',
    description: 'Drafts highly personalized emails tailored to each candidate\'s unique strengths and background.',
    icon: Send,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    title: 'Pre Screening Questionnaires',
    description: 'Generates dynamic technical and behavioral questions unique to each candidate. Candidates fill them via a secure public form and the AI scores every answer automatically.',
    icon: ClipboardList,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50'
  },
  {
    title: 'Hiring Analytics Dashboard',
    description: 'Visualize your pipeline conversion rates, compare CV scores against pre screen performance, and track every candidate from sourced to hired in one place.',
    icon: BarChart3,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  }
];

// I animate each feature card with a staggered fade in when scrolled into view
function FeatureCard({ feature, delay }: { feature: typeof features[0]; delay: number }) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
      }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bgColor}`}>
        <feature.icon className={`w-6 h-6 ${feature.color}`} />
      </div>
      <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
      <p className="text-slate-600 leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

export default function FeaturesSection() {
  const { ref: headingRef, isVisible: headingVisible } = useScrollReveal();

  return (
    <section id="features" className="py-24 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headingRef}
          className="text-center mb-16 transition-all duration-700"
          style={{
            opacity: headingVisible ? 1 : 0,
            transform: headingVisible ? 'translateY(0)' : 'translateY(30px)',
          }}
        >
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">What it does</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900">Built around how recruiters actually work</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.slice(0, 3).map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} delay={idx * 150} />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-8 mt-8 max-w-3xl mx-auto">
          {features.slice(3).map((feature, idx) => (
            <FeatureCard key={idx + 3} feature={feature} delay={(idx + 3) * 150} />
          ))}
        </div>
      </div>
    </section>
  );
}
