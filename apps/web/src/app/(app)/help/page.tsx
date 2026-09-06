"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HelpCircle, ArrowLeft, MessageCircle, Search, ChevronDown, ChevronUp, Phone, Mail, Book, Sprout, Cloud, TrendingUp, AlertCircle, Settings } from "lucide-react";

const FAQS = [
  {
    q: "How do I diagnose a crop disease?",
    a: "Go to the Diagnose page from the sidebar, take or upload a clear photo of the affected plant leaf or stem, then tap 'Analyze'. Our AI will identify the disease and suggest treatment within seconds.",
    icon: Sprout,
    color: "emerald"
  },
  {
    q: "Why is my weather forecast not showing?",
    a: "Weather is fetched based on your farm location. Make sure you have set your farm location in Settings → Profile. Also ensure location permissions are granted to the browser.",
    icon: Cloud,
    color: "blue"
  },
  {
    q: "How accurate are the mandi prices?",
    a: "Prices are pulled from AGMARKNET (government data) and updated daily. There may be a 12–24 hour delay. Always confirm prices directly with your nearest mandi before selling.",
    icon: TrendingUp,
    color: "amber"
  },
  {
    q: "Can I use KisanSeva without internet?",
    a: "Core features require internet. However, your last-loaded crop plans and farm data are saved locally and readable offline.",
    icon: AlertCircle,
    color: "red"
  },
  {
    q: "How do I change my phone number or email?",
    a: "Email is linked to your auth account and cannot be changed directly. For phone or other profile details, go to Settings → Profile and update from there.",
    icon: Settings,
    color: "slate"
  },
  {
    q: "Is my farm data private?",
    a: "Yes. All your farm and profile data is protected by Row-Level Security — only you can see your records. Profile photos are stored only on your device.",
    icon: HelpCircle,
    color: "emerald"
  },
];

export default function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = FAQS.filter(f => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
          <p className="text-sm text-slate-500">Find answers or get in touch with us</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search help articles..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm transition-all"
        />
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Book className="w-4 h-4" /> Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">No results found for "{query}"</div>
          )}
          {filtered.map((faq, i) => {
            const Icon = faq.icon;
            const isOpen = openFaq === i;
            return (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg bg-${faq.color}-50 flex items-center justify-center text-${faq.color}-600 shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-slate-800">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-[3.75rem] text-sm text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact */}
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" /> Still Need Help?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="mailto:support@kisanseva.app" className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-emerald-300 hover:shadow-md transition-all group">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Email Support</div>
            <div className="text-xs text-slate-500 mt-0.5">support@kisanseva.app</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Reply within 24hrs</div>
          </div>
        </a>
        <a href="tel:18001234567" className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Kisan Helpline</div>
            <div className="text-xs text-slate-500 mt-0.5">1800-123-4567 (Toll Free)</div>
            <div className="text-xs text-blue-600 font-medium mt-1">Mon–Sat, 9AM–6PM</div>
          </div>
        </a>
      </div>
    </div>
  );
}
