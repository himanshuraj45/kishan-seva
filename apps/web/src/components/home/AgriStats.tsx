"use client";
import { Users, TrendingUp, Microscope, Clock } from "lucide-react";
import { ScrollReveal, StaggerReveal, StaggerChild } from "@/components/ui/ScrollReveal";

export default function AgriStats() {
  const stats = [
    { label: "Farmers Served", value: "12,000+", icon: Users, iconBg: "bg-[#FFB932]/10 text-amber-500" },
    { label: "Avg Yield Increase", value: "18%", icon: TrendingUp, iconBg: "bg-[#65a30d]/10 text-[#65a30d]" },
    { label: "Disease Accuracy", value: "93.2%", icon: Microscope, iconBg: "bg-[#FFB932]/10 text-amber-500" },
    { label: "Diagnosis Time", value: "<5 sec", icon: Clock, iconBg: "bg-slate-50 text-slate-500" },
  ];

  return (
    <div className="space-y-5">
      <ScrollReveal preset="fade-down" className="text-left">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Impact</span>
        <h3 className="text-xl font-bold text-slate-900 mt-1">Farmer Success Metrics</h3>
      </ScrollReveal>

      <StaggerReveal className="grid grid-cols-2 gap-4" delay={0.1}>
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <StaggerChild key={i} preset="stagger-child-scale">
              <div className="p-5 rounded-3xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center shadow-sm hover:scale-[1.02] transition-transform">
                <div className={`w-9 h-9 rounded-full ${st.iconBg} flex items-center justify-center mb-2.5 shadow`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="text-2xl font-black tracking-tight text-slate-900">{st.value}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{st.label}</div>
              </div>
            </StaggerChild>
          );
        })}
      </StaggerReveal>
    </div>
  );
}

