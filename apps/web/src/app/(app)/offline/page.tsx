'use client';

import React, { useEffect, useState } from 'react';
import { useOfflineStore } from '@/lib/offlineStore';
import { Download, Map, TrendingUp, FileText, Activity, Clock, Trash2, CloudOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflineHubPage() {
  const { savedItems, removeItem } = useOfflineStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
              <CloudOff size={20} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Offline Hub</h1>
          </div>
          <p className="text-slate-500">Access your saved schedules, market prices, and downloaded PDFs without an internet connection.</p>
        </header>

        {savedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Download size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Nothing saved yet</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              When you're online, you can save crop schedules, market prices, and scheme PDFs to view them later when you have no signal in the field.
            </p>
            <Link 
              href="/agent" 
              className="px-6 py-2.5 bg-[#65a30d] text-white font-semibold rounded-xl shadow-sm hover:bg-[#4d7c0f] transition-colors"
            >
              Ask KisanSeva AI
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {savedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                      {item.type === 'schedule' && <Clock size={16} className="text-blue-600" />}
                      {item.type === 'price' && <TrendingUp size={16} className="text-emerald-600" />}
                      {item.type === 'pdf' && <FileText size={16} className="text-red-600" />}
                      {item.type === 'diagnosis' && <Activity size={16} className="text-amber-600" />}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {item.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove saved item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                
                <div className="flex-1">
                  {/* Render content based on type */}
                  {item.type === 'price' && item.data && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <p className="text-xl font-bold text-emerald-800">{item.data.price}</p>
                      <p className="text-sm text-emerald-600 font-medium">{item.data.market}</p>
                    </div>
                  )}
                  {item.type === 'schedule' && item.data && (
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><strong>Next action:</strong> {item.data.nextAction}</p>
                      <p><strong>Date:</strong> {item.data.date}</p>
                    </div>
                  )}
                  {item.type === 'diagnosis' && item.data && (
                    <div className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <p className="font-bold text-amber-800">{item.data.disease}</p>
                      <p className="text-amber-700 mt-1">{item.data.treatment}</p>
                    </div>
                  )}
                  {item.type === 'pdf' && item.data && (
                    <div className="text-sm">
                      <a href={item.data.url} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                        Open Document <Download size={14} />
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Saved on {new Date(item.savedAt).toLocaleDateString()}</span>
                  <span>Available Offline</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
