import { FileSearch, Sparkles, Send } from 'lucide-react';

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
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">What it does</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900">Built around how recruiters actually work</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bgColor}`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
