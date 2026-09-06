'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center text-slate-400">
        <MapPin className="w-8 h-8 mb-2 animate-bounce" />
        <p className="font-medium text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

export default function AgriMapVisualization() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col pt-8 pb-4">
      <ScrollReveal preset="fade-down" className="flex items-center gap-4 mb-4 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[#65a30d]/10 text-[#65a30d] flex items-center justify-center border border-[#65a30d]/20 shrink-0">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
            Live Regional Visualizations
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Crop health &amp; activity across India</p>
        </div>
      </ScrollReveal>


      <ScrollReveal preset="fade-up" delay={0.2} className="w-full flex-1 rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white p-2 min-h-0">
        <MapClient />
      </ScrollReveal>
    </div>
  );
}
