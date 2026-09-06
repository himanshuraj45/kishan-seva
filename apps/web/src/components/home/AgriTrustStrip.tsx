"use client";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Wheat, Droplets, Sun, Landmark, CloudSun, Bug, Sprout } from "lucide-react";
import { ScrollReveal, StaggerReveal, StaggerChild } from "@/components/ui/ScrollReveal";

export default function AgriTrustStrip() {
  const schemes = [
    { name: "PM-KISAN", desc: "₹6,000 Income Support", icon: Wheat, color: "bg-white text-emerald-600 border-slate-200" },
    { name: "Fasal Bima", desc: "PM Crop Insurance", icon: ShieldCheck, color: "bg-white text-blue-600 border-slate-200" },
    { name: "Soil Health Card", desc: "Free Soil Testing", icon: Sprout, color: "bg-white text-amber-600 border-slate-200" },
    { name: "Drip Irrigation", desc: "Jal Shakti Subsidy", icon: Droplets, color: "bg-white text-cyan-600 border-slate-200" },
    { name: "Kisan Credit", desc: "Low-Interest Loans", icon: Landmark, color: "bg-white text-[#65a30d] border-slate-200" },
    { name: "Solar Pump", desc: "PM-KUSUM Scheme", icon: Sun, color: "bg-white text-[#FFB932] border-slate-200" },
    { name: "Pest Control", desc: "Free Advisory Service", icon: Bug, color: "bg-white text-rose-600 border-slate-200" },
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col">
      {/* Header */}
      <ScrollReveal preset="fade-up" className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#65a30d]" />
          <h3 className="text-lg font-bold text-slate-900">Government Schemes</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          For Eligible Farmers
        </span>
      </ScrollReveal>

      <p className="text-xs text-slate-500 mb-4">
        Matching against official central &amp; state agriculture schemes:
      </p>

      {/* Scheme badges — staggered spring-pop */}
      <StaggerReveal className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" delay={0.08} threshold={0.05}>
        {schemes.map((scheme) => {
          const Icon = scheme.icon;
          return (
            <StaggerChild key={scheme.name} preset="stagger-child-scale">
              <div className={`p-2.5 rounded-2xl border ${scheme.color} flex flex-col items-center text-center group hover:shadow-sm transition-all`}>
                <div className="p-1.5 rounded-xl bg-slate-50 shadow-sm mb-1.5 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">{scheme.name}</div>
                <div className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">{scheme.desc}</div>
              </div>
            </StaggerChild>
          );
        })}

        <StaggerChild preset="stagger-child-scale">
          <Link
            href="/govt-schemes"
            className="p-2.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 text-slate-700 flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="text-[11px] font-bold flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="text-[9px] text-slate-500">200+ Schemes</div>
          </Link>
        </StaggerChild>
      </StaggerReveal>

      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <Link href="/govt-schemes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          <span>Check Your Eligibility</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

