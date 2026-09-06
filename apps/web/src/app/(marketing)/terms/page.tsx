import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, Gavel, Handshake, Ban, Phone } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-sm text-slate-500">Last updated: August 2026</p>
        </div>
      </div>

      <div className="space-y-6">

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              By using KisanSeva, you agree to these terms. Please read them carefully before using the platform.
            </p>
          </div>
        </div>

        {[
          {
            icon: Handshake,
            color: "blue",
            title: "Acceptance of Terms",
            content: [
              "By registering or using KisanSeva, you agree to be bound by these Terms of Service.",
              "If you do not agree, please do not use the platform.",
              "We reserve the right to update these terms at any time with prior notice.",
            ]
          },
          {
            icon: CheckCircle2,
            color: "emerald",
            title: "Permitted Use",
            content: [
              "KisanSeva is designed for individual farmers and agricultural workers.",
              "You may use the platform to access crop advisories, mandi prices, weather data, and farm management tools.",
              "You are responsible for keeping your account credentials secure.",
              "One account per user — do not share your login with others.",
            ]
          },
          {
            icon: AlertTriangle,
            color: "amber",
            title: "Advisory Disclaimer",
            content: [
              "Crop disease diagnoses and advisories are AI-generated suggestions — not certified agronomic advice.",
              "Always consult a licensed agronomist before making significant decisions based on app recommendations.",
              "Weather forecasts are sourced from third parties; KisanSeva is not liable for forecast inaccuracies.",
              "Market prices are indicative and may differ from actual mandi rates at the time of sale.",
            ]
          },
          {
            icon: Ban,
            color: "red",
            title: "Prohibited Activities",
            content: [
              "Do not attempt to reverse-engineer, scrape, or misuse any part of the platform.",
              "Do not upload harmful, misleading, or illegal content.",
              "Do not impersonate other users or government entities.",
              "Misuse may result in immediate account termination.",
            ]
          },
          {
            icon: Gavel,
            color: "slate",
            title: "Limitation of Liability",
            content: [
              "KisanSeva is provided 'as is' without warranty of any kind.",
              "We are not responsible for crop losses resulting from following app recommendations.",
              "Our liability is limited to the amount paid for any premium services (if applicable).",
              "These terms are governed by Indian law and disputes fall under the jurisdiction of Indian courts.",
            ]
          },
          {
            icon: Phone,
            color: "emerald",
            title: "Contact",
            content: [
              "For questions about these terms, contact us at: legal@kisanseva.app",
            ]
          },
        ].map(({ icon: Icon, color, title, content }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl bg-${color}-50 flex items-center justify-center text-${color}-600`}>
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
            </div>
            <ul className="space-y-2">
              {content.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
