"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Microscope,
  Clock,
} from "lucide-react";

export default function AgriImpact() {
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  return (
    <section
      id="agri-impact"
      className="relative py-20 overflow-hidden bg-slate-50 text-slate-900 flex flex-col justify-center h-full"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* ─── PLATFORM IMPACT HEADER ─── */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            MEASURABLE RESULTS
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Farmer Income &amp; Crop Success
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto font-sans font-normal">
            Real impact delivered to smallholder farmers across India every harvest season.
          </p>
        </div>

        {/* ─── IMPACT STATISTICS CARDS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              id: "stat-farmers",
              value: "12,000+",
              label: "Farmers Served",
              icon: Users,
              bg: "bg-blue-50/80 border-blue-200 text-blue-900",
              iconBg: "bg-blue-600 text-white",
            },
            {
              id: "stat-yield",
              value: "18%",
              label: "Avg. Yield Increase",
              icon: TrendingUp,
              bg: "bg-emerald-50/80 border-emerald-200 text-emerald-900",
              iconBg: "bg-emerald-600 text-white",
            },
            {
              id: "stat-diagnose",
              value: "91%+",
              label: "Disease Detection Accuracy",
              icon: Microscope,
              bg: "bg-purple-50/80 border-purple-200 text-purple-900",
              iconBg: "bg-purple-600 text-white",
            },
            {
              id: "stat-time",
              value: "<5 sec",
              label: "Diagnosis Time",
              icon: Clock,
              bg: "bg-amber-50/80 border-amber-200 text-amber-900",
              iconBg: "bg-amber-500 text-white",
            },
          ].map((stat) => {
            const IconComp = stat.icon;
            const isHovered = hoveredStat === stat.id;

            return (
              <motion.div
                key={stat.id}
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`p-6 rounded-3xl border text-center shadow-xs transition-all duration-300 cursor-pointer ${stat.bg} ${
                  isHovered ? "border-[#65a30d] shadow-md" : "border-slate-200/90"
                }`}
              >
                <div className={`w-12 h-12 mx-auto rounded-2xl ${stat.iconBg} flex items-center justify-center mb-3 shadow-xs`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-bold opacity-80 mt-1">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── STATE COVERAGE ─── */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { state: "Maharashtra", crops: "Cotton · Soybean · Onion", emoji: "🌾" },
            { state: "Punjab", crops: "Wheat · Rice · Maize", emoji: "🌾" },
            { state: "Madhya Pradesh", crops: "Soybean · Wheat · Pulses", emoji: "🌿" },
            { state: "Andhra Pradesh", crops: "Rice · Cotton · Chilli", emoji: "🌶️" },
          ].map((item) => (
            <motion.div
              key={item.state}
              whileHover={{ y: -2 }}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">{item.emoji}</div>
              <div className="text-sm font-bold text-slate-900">{item.state}</div>
              <div className="text-[11px] text-slate-500 mt-1">{item.crops}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

