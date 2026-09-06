import React from 'react';
import { Landmark, FileText, CheckCircle2 } from 'lucide-react';

export default function GovtSchemesPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6 sm:px-12 max-w-[1400px] mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 text-sky-600 mb-6">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Government Schemes & Subsidies
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover official agricultural schemes, apply for subsidies, and learn about financial support available for your farm.
          </p>
        </div>

        <div className="space-y-6">
          {[
            { 
              title: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)", 
              desc: "Direct income support of ₹6,000 per year provided to all landholding farmer families across the country in three equal installments.",
              eligibility: "All landholding farmers subject to certain exclusion criteria." 
            },
            { 
              title: "PMFBY (Pradhan Mantri Fasal Bima Yojana)", 
              desc: "Comprehensive crop insurance scheme protecting farmers against non-preventable natural risks from pre-sowing to post-harvest.",
              eligibility: "Farmers growing notified crops in notified areas." 
            },
            { 
              title: "Kisan Credit Card (KCC)", 
              desc: "Provides farmers with timely access to credit for agricultural expenses at concessional interest rates.",
              eligibility: "Farmers, tenant farmers, and sharecroppers." 
            }
          ].map((scheme, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="shrink-0 mt-1">
                <FileText className="w-8 h-8 text-sky-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{scheme.title}</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">{scheme.desc}</p>
                <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sm text-slate-900 block mb-1">Eligibility</strong>
                    <span className="text-sm text-slate-600">{scheme.eligibility}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <button className="w-full md:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors">
                  Check Eligibility
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
