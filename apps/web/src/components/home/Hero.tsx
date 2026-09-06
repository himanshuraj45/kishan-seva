/**
 * @file src/components/home/Hero.tsx
 * @description Marketing landing page hero section with animated headline, CTA buttons, and a floating product screenshot.
 */
"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden flex flex-col items-center w-full min-h-screen pt-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, background: 'linear-gradient(135deg, #fef6dd 0%, #e8f9ed 50%, #c4ebd0 100%)' }} />

      {/* Text content */}
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative w-full flex flex-col items-center pt-16 lg:pt-24 pb-8"
        style={{ zIndex: 1 }}
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
          Empower your farm,<br />grow your future
        </h1>
        <p className="text-lg md:text-xl text-slate-800 font-medium leading-relaxed mb-10">
          Track prices, get weather updates, and manage crops all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/market"
            className="w-full sm:w-auto bg-transparent text-[#1f8742] font-semibold px-8 py-3.5 rounded-xl border-2 border-[#1f8742] hover:bg-[#1f8742]/5 transition-all text-[15px]"
          >
            Monitor Prices
          </Link>
          <Link
            href="/schedule"
            className="w-full sm:w-auto bg-[#1f8742] hover:bg-[#166534] text-white font-semibold px-8 py-3.5 rounded-xl shadow-sm transition-all text-[15px]"
          >
            Check Weather
          </Link>
        </div>
      </div>

      <div className="w-full relative flex-1 overflow-hidden flex justify-center items-end pb-8" style={{ zIndex: 1 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '64rem', paddingTop: '25%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', borderRadius: '12px' }}>
          <iframe 
            loading="lazy" 
            style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0 }}
            src="https://www.canva.com/design/DAHSFpDzthc/HGJ8JKUQ5pJmnfVrNm-62Q/view?embed" 
            allowFullScreen
            allow="fullscreen"
          />
        </div>
      </div>
    </section>
  );
}


