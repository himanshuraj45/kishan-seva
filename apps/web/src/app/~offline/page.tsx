'use client';

import { WifiOff, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <WifiOff size={48} />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">You are offline</h1>
      <p className="text-slate-600 mb-8 max-w-md">
        It looks like you've lost your internet connection. Some features of KisanSeva require an active connection, but you can still access cached data like the Disease Library.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => window.location.reload()} 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#84cc16] text-white font-semibold rounded-xl shadow-lg shadow-lime-500/30 hover:bg-[#65a30d] transition-all"
        >
          <RotateCcw size={18} />
          Try Again
        </button>
        <Link 
          href="/disease-library" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
        >
          Go to Disease Library
        </Link>
      </div>
    </div>
  );
}
