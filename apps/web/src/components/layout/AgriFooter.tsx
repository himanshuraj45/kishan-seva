"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowUp } from "lucide-react";

export default function AgriFooter() {
  const scrollToTop = () => {
    const isFullPage = document.getElementById("fullpage-scroller-root");
    if (isFullPage) {
      window.dispatchEvent(new CustomEvent("kisanseva-scroll-to-top"));
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full flex flex-col relative z-20 bg-white overflow-hidden">
      
      {/* Image Farm Background Illustration */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <Image
          src="/footer-image.jpg"
          alt="Farm Landscape"
          fill
          className="object-cover object-center mix-blend-darken opacity-[0.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white z-10" />
      </div>

      {/* Footer Body */}
      <div className="w-full relative z-10 px-6 sm:px-12 pt-20 pb-8 sm:pt-28 sm:pb-12 max-w-[1400px] mx-auto flex-1 flex flex-col justify-between">
        
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 lg:gap-12 mb-16 sm:mb-24">
          
          {/* Left Side: Headline & Subscribe */}
          <div className="max-w-xl w-full">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.1] mb-8">
              Join the movement for<br />smarter farming
            </h2>
            
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center gap-2 border border-slate-300 rounded-full px-5 py-3 max-w-sm hover:border-slate-400 transition-colors bg-white/50 backdrop-blur-sm shadow-sm focus-within:border-[#2A854B] focus-within:ring-1 focus-within:ring-[#2A854B]"
            >
              <input
                type="email"
                placeholder="Enter email for crop updates..."
                className="bg-transparent outline-none w-full text-sm placeholder-slate-500 text-slate-900"
                required
              />
              <button type="submit" aria-label="Subscribe" className="shrink-0 hover:scale-110 transition-transform">
                <Mail className="w-5 h-5 text-[#2A854B]" />
              </button>
            </form>
          </div>

          {/* Right Side: Grid of Links & Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-12 w-full lg:w-auto text-sm text-slate-900 font-medium">
            
            {/* Column 1: AI Engine & Data */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="mb-2 text-slate-900 font-bold">🌿 KisanSeva Engine</div>
                <div className="text-slate-600 text-xs leading-relaxed">
                  Google Gemini 2.5 & MobileNetV3<br />
                  Groq LPU™ AI Inference
                </div>
              </div>
              <div>
                <div className="mb-2 text-slate-900 font-bold">Live Data Sources</div>
                <div className="text-slate-600 text-xs leading-relaxed">
                  AGMARKNET Mandi Prices<br />
                  OpenWeather Forecasts<br />
                  MapTiler Cloud Imagery
                </div>
              </div>
            </div>

            {/* Column 2: Features */}
            <div className="flex flex-col gap-4 text-slate-600">
              <div className="text-slate-900 font-bold mb-1">Features</div>
              <Link href="/diagnose" className="hover:text-[#2A854B] transition-colors">AI Crop Diagnosis</Link>
              <Link href="/market" className="hover:text-[#2A854B] transition-colors">Live Mandi Prices</Link>
              <Link href="/topography" className="hover:text-[#2A854B] transition-colors">Live AI Crop Maps</Link>
              <Link href="/schedule" className="hover:text-[#2A854B] transition-colors">Smart Irrigation</Link>
            </div>

            {/* Column 3: Resources */}
            <div className="flex flex-col gap-4 text-slate-600">
              <div className="text-slate-900 font-bold mb-1">Resources</div>
              <Link href="/disease-library" className="hover:text-[#2A854B] transition-colors">Disease Library</Link>
              <Link href="/price-guide" className="hover:text-[#2A854B] transition-colors">Price Guide</Link>
              <Link href="/privacy" className="hover:text-[#2A854B] transition-colors">Privacy Policy</Link>
              <Link href="/govt-schemes" className="hover:text-[#2A854B] transition-colors">Govt Schemes</Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
            <span>© 2026 KisanSeva.</span>
            <span className="hidden sm:inline">·</span>
            <span>Built for India's Farmers.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-slate-900 hover:text-[#2A854B] transition-colors ml-4 font-bold"
            >
              Back To Top <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

