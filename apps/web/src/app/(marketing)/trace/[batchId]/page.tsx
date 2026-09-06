"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, Leaf, Truck, Store, MapPin, Factory, Hash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TraceabilityPublicPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data from the blockchain ledger
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [batchId]);

  const originDate = '12 Aug 2026, 09:30 AM';
  
  const ledger = [
    { timestamp: originDate, stage: 'Origin (Harvest)', location: 'Farmer\'s Field', actor: '0x3F2A...9C11', hash: '0x8f3c4b9d2e1a76f50c8d1e2f3a4b5c6d', details: 'Fertilizer: 100% Bio-Compost' },
    { timestamp: '14 Aug 2026, 11:15 AM', stage: 'Processing & Quality Check', location: 'AgriCorp Mill, Punjab', actor: '0x7E1B...2A44', hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', details: 'Quality Grade: Premium A+' },
    { timestamp: 'Pending', stage: 'Logistics / Transit', location: 'Highway Transit', actor: '0x9D4C...5F22', hash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c', details: 'Temperature Controlled: Yes' },
    { timestamp: 'Pending', stage: 'Retail Arrival', location: 'Supermarket', actor: '0x1A2B...3C4D', hash: '0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f', details: 'Ready for Sale' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-slate-800">Verifying Ledger...</h2>
        <p className="text-slate-500 mt-2">Querying blockchain for Batch {batchId}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-sm">KisanSeva</span>
          </Link>
          <div className="flex items-center gap-2 text-[#10b981] font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <ShieldCheck className="w-4 h-4" />
            Blockchain Verified
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        
        {/* SUMMARY CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-md">Organic Certified</span>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider rounded-md">Grade A+</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Premium Basmati Rice</h1>
              <p className="text-slate-500 font-medium">Seed Variety: Pusa-1121</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center sm:items-end shrink-0">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Batch ID
              </span>
              <span className="font-mono text-lg font-bold text-slate-800">{batchId}</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            This product's journey has been cryptographically secured and verified on the KisanSeva distributed ledger.
          </div>
        </motion.div>

        {/* TIMELINE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            Journey Timeline
          </h2>
          
          <div className="relative flex flex-col gap-6 pl-4 sm:pl-0">
            {/* Vertical Line */}
            <div className="absolute left-[23px] sm:left-[39px] top-6 bottom-6 w-0.5 bg-slate-200 z-0"></div>

            {ledger.map((block, idx) => {
              const isPending = block.timestamp === 'Pending';
              
              let Icon = Leaf;
              let iconColor = 'text-emerald-500';
              let bgColor = 'bg-emerald-50';
              let borderColor = 'border-emerald-200';
              
              if (idx === 1) { Icon = Factory; iconColor = 'text-amber-500'; bgColor = 'bg-amber-50'; borderColor = 'border-amber-200'; }
              if (idx === 2) { Icon = Truck; iconColor = 'text-blue-500'; bgColor = 'bg-blue-50'; borderColor = 'border-blue-200'; }
              if (idx === 3) { Icon = Store; iconColor = 'text-purple-500'; bgColor = 'bg-purple-50'; borderColor = 'border-purple-200'; }

              if (isPending) {
                iconColor = 'text-slate-300';
                bgColor = 'bg-slate-50';
                borderColor = 'border-slate-200';
              }

              return (
                <div key={idx} className={`relative z-10 flex gap-4 sm:gap-6 ${isPending ? 'opacity-60' : ''}`}>
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full border-2 ${borderColor} ${bgColor} flex items-center justify-center shrink-0 ${isPending ? 'border-dashed' : ''}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-slate-900">{block.stage}</h3>
                      <span className={`text-sm font-medium ${isPending ? 'text-amber-500' : 'text-slate-500'}`}>
                        {block.timestamp}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-4">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {block.location}
                    </div>
                    
                    {!isPending && (
                      <>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-lg border border-emerald-100 mb-4">
                          <ShieldCheck className="w-4 h-4" />
                          {block.details}
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-500 border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-600">Actor Sign:</span>
                            <span>{block.actor}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-600">Block Hash:</span>
                            <span className="truncate ml-4 max-w-[200px] sm:max-w-xs">{block.hash}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {isPending && (
                      <div className="text-sm text-slate-500 italic">
                        Awaiting blockchain confirmation for this stage...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
