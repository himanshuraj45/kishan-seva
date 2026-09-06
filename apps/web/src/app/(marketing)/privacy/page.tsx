import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck, Globe, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: August 2026</p>
        </div>
      </div>

      <div className="space-y-6">

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-sm text-emerald-800 font-medium">
            KisanSeva is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
          </p>
        </div>

        {[
          {
            icon: Database,
            title: "Information We Collect",
            content: [
              "Personal details: name, phone number, and email address provided during registration.",
              "Farm data: location, farm size, crop types, and irrigation schedules you enter.",
              "Usage data: pages visited, features used, and device information for improving the app.",
              "Crop images: photos you upload for disease diagnosis — processed by AI and not stored permanently.",
            ]
          },
          {
            icon: Eye,
            title: "How We Use Your Information",
            content: [
              "To provide personalized crop advisories, weather alerts, and mandi price notifications.",
              "To improve AI-based disease detection and recommendation accuracy.",
              "To send SMS or push alerts you have opted into (e.g., irrigation reminders).",
              "We never sell your data to third parties or advertisers.",
            ]
          },
          {
            icon: Lock,
            title: "Data Security",
            content: [
              "All data is encrypted in transit using TLS 1.3.",
              "Your profile data is stored in Supabase with Row-Level Security (RLS) — only you can access your records.",
              "Profile photos are stored locally on your device and never uploaded to our servers.",
              "We conduct regular security reviews to protect your information.",
            ]
          },
          {
            icon: UserCheck,
            title: "Your Rights",
            content: [
              "Access: request a copy of all data we hold about you.",
              "Correction: update your profile and farm data at any time via the Profile tab.",
              "Deletion: request complete deletion of your account and associated data.",
              "Opt-out: disable notifications and SMS alerts at any time in Settings.",
            ]
          },
          {
            icon: Globe,
            title: "Third-Party Services",
            content: [
              "Weather data is sourced from public meteorological APIs — no personal data is shared.",
              "Mandi prices are fetched from government AGMARKNET data.",
              "AI crop diagnosis may use anonymised image data to improve model accuracy.",
            ]
          },
          {
            icon: Mail,
            title: "Contact Us",
            content: [
              "For any privacy concerns, write to us at: privacy@kisanseva.app",
              "We will respond within 7 business days.",
            ]
          },
        ].map(({ icon: Icon, title, content }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
            </div>
            <ul className="space-y-2">
              {content.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
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
