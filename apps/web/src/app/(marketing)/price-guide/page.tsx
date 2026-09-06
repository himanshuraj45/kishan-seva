import React from 'react';
import { IndianRupee, TrendingUp } from 'lucide-react';

export default function PriceGuidePage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6 sm:px-12 max-w-[1400px] mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <IndianRupee className="w-10 h-10 text-[#2A854B]" />
            Market Price Guide
          </h1>
          <p className="text-lg text-slate-600">
            Historical pricing data, MSP (Minimum Support Price) guidelines, and market trend analysis.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Current MSP Rates (2026 Season)</h2>
            <button className="text-sm font-semibold text-[#2A854B] flex items-center gap-1">
              Download PDF <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Commodity</th>
                  <th className="p-4 font-semibold">Season</th>
                  <th className="p-4 font-semibold text-right">MSP (₹ / Quintal)</th>
                  <th className="p-4 font-semibold text-right">YoY Change</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-800 divide-y divide-slate-100">
                {[
                  { name: "Paddy (Common)", season: "Kharif", price: "2,183", change: "+7%" },
                  { name: "Wheat", season: "Rabi", price: "2,275", change: "+5.5%" },
                  { name: "Cotton (Medium Staple)", season: "Kharif", price: "6,620", change: "+8%" },
                  { name: "Soybean", season: "Kharif", price: "4,600", change: "+6%" },
                  { name: "Mustard", season: "Rabi", price: "5,650", change: "+4%" },
                ].map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 text-slate-500">{item.season}</td>
                    <td className="p-4 text-right font-bold text-slate-900">₹{item.price}</td>
                    <td className="p-4 text-right font-semibold text-emerald-600">{item.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
