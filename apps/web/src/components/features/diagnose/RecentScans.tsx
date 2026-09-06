/**
 * @file src/components/features/diagnose/RecentScans.tsx
 * @description Displays the farmer's recent crop diagnosis history, read from localStorage.
 */
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, AlertTriangle, ShieldCheck, Stethoscope } from 'lucide-react';

export const BADGE_STYLES: Record<string, string> = {
  Healthy: 'bg-green-100 text-green-700 border-green-200',
  'Action Required: Early Blight': 'bg-orange-100 text-orange-700 border-orange-200',
  'Monitoring: Thrips': 'bg-amber-100 text-amber-700 border-amber-200',
}

export const DEFAULT_SCANS = [
  { crop: 'Wheat - Plot A', date: 'Oct 26, 2024', badge: 'Healthy', img: '/images/diagnose/scan_wheat.jpg' },
  { crop: 'Tomato - Field 2', date: 'Oct 24, 2024', badge: 'Action Required: Early Blight', img: '/images/diagnose/scan_tomato.jpg' },
  { crop: 'Cotton - Plot C', date: 'Oct 22, 2024', badge: 'Monitoring: Thrips', img: '/images/diagnose/cotton_scan.jpg' },
];

export default function RecentScans() {
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<any | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kisanseva_recent_scans');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out any fake default scans that might have been saved previously
        const realScans = parsed.filter((s: any) => !s.img.includes('/images/diagnose/scan_') && !s.img.includes('unsplash'));
        setScans(realScans);
        localStorage.setItem('kisanseva_recent_scans', JSON.stringify(realScans));
      }
    } catch (e) {
      console.error('Failed to load recent scans', e);
    }
  }, []);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-5 tracking-tight">Recent Scans</h2>
        
        {scans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
            <div className="text-4xl mb-3">ðŸŒ±</div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No recent scans</h3>
            <p className="text-slate-500 text-sm">Upload a photo of your crop above to start diagnosing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {scans.map((scan, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedScan(scan)}
              className="group bg-white rounded-2xl border border-slate-200/60 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-green-900/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                <img 
                  src={scan.img} 
                  alt={scan.crop} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 bg-white relative z-10">
                <div className="font-semibold text-slate-900 mb-1">{scan.crop}</div>
                <div className="text-xs text-slate-500 mb-3 font-medium">{scan.date}</div>
                <span 
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${scan.badge.includes('Action Required') ? BADGE_STYLES['Action Required: Early Blight'] : scan.badge.includes('Monitoring') ? BADGE_STYLES['Monitoring: Thrips'] : BADGE_STYLES['Healthy']}`}
                >
                  {scan.badge}
                </span>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {selectedScan && selectedScan.diagnosis && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setSelectedScan(null)} 
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-full">
            {/* Modal Header Image */}
            <div className="relative w-full h-40 sm:h-56 bg-slate-100 shrink-0">
              <img 
                src={selectedScan.img} 
                alt={selectedScan.crop}
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <button 
                onClick={() => setSelectedScan(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <div className="text-sm font-medium opacity-80 mb-1">{selectedScan.date}</div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {selectedScan.diagnosis.disease}
                </h2>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto">
              
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="text-2xl">{selectedScan.diagnosis.severity === 'High' ? 'ðŸš¨' : selectedScan.diagnosis.severity === 'Moderate' ? 'âš ï¸' : 'âœ…'}</span>
                <div>
                  <div className="font-bold text-slate-900">Severity: {selectedScan.diagnosis.severity || 'Normal'}</div>
                  <div className="text-sm text-slate-500">{selectedScan.diagnosis.confidence}% AI Confidence Score</div>
                </div>
              </div>

              <div>
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  {selectedScan.diagnosis.description}
                </p>
              </div>

              {selectedScan.diagnosis.symptoms && selectedScan.diagnosis.symptoms.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                    <AlertTriangle size={16} className="text-amber-500" /> Key Symptoms
                  </h4>
                  <ul className="list-disc pl-5 text-slate-600 text-[15px] leading-relaxed space-y-1">
                    {selectedScan.diagnosis.symptoms.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              
              {selectedScan.diagnosis.treatmentSteps && selectedScan.diagnosis.treatmentSteps.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                    <Stethoscope size={16} className="text-blue-500" /> Action Plan
                  </h4>
                  <div className="flex flex-col gap-2">
                    {selectedScan.diagnosis.treatmentSteps.map((step: string, i: number) => (
                      <div key={i} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                        <div className="text-slate-600 text-[14px] leading-relaxed font-medium">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedScan.diagnosis.prevention && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                    <ShieldCheck size={16} className="text-[#2A854B]" /> Prevention
                  </h4>
                  <p className="text-slate-600 text-[15px] leading-relaxed bg-[#f3f9f5] p-4 rounded-xl border border-[#2A854B]/10">
                    {selectedScan.diagnosis.prevention}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}


