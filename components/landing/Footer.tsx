import Link from 'next/link';
import { Mail } from 'lucide-react';

// I use inline SVGs for brand icons since this version of lucide-react doesn't include them
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/hammadshabbir10', icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hammadshabbir10/', icon: LinkedinIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/hammadx_10/', icon: InstagramIcon },
  {
    label: 'Email',
    href: 'mailto:hammadshabbir507@gmail.com',
    icon: Mail,
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0f1117] border-t border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Top Row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">

          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/hireiq_logo.png"
                alt="HireIQ Logo"
                className="h-16 w-16 object-contain rounded-xl shadow-lg shadow-indigo-500/20"
              />
              <span className="text-2xl font-bold tracking-tight">
                Hire<span className="text-indigo-400">IQ</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              The AI-powered recruitment assistant that screens CVs, scores candidates, and drafts personalized outreach emails — all in seconds.
            </p>
          </div>

          {/* Nav Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Navigation</p>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Get Started</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Open Dashboard →
            </Link>
            <p className="text-slate-500 text-xs mt-3">No credit card required.</p>
          </div>

        </div>

        {/* Divider + Bottom Row */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} Zikra Info Tech Assessment. Built by{' '}
            <span className="text-indigo-400 font-medium">Hammad Shabbir</span>.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 transition-all duration-200 cursor-pointer"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
