export default function Footer() {
  return (
    <footer className="bg-slate-50 py-12 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <img 
            src="/zikra_infotech_logo.png" 
            alt="Zikra Info Tech Logo" 
            className="h-8 w-auto object-contain opacity-70" 
          />
          <span className="text-slate-600 font-medium text-sm border-l border-slate-300 pl-3">HireIQ Agent</span>
        </div>
        
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Zikra Info Tech Assessment. All rights reserved.
        </p>
        
        <div className="flex space-x-6">
          <a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Privacy Policy</a>
          <a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
