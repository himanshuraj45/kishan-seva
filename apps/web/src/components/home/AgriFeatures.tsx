"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Microscope,
  BrainCircuit,
  Lock,
  MapPin,
  Zap,
  CloudSun,
  TrendingUp,
  Bell,
  Leaf,
} from "lucide-react";

interface FeatureCard {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: any;
  accentColor: string;
  iconBg: string;
  badgeText: string;
  revealBadges: string[];
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: "disease-detection",
    title: "AI Disease Detection",
    category: "Computer Vision · MobileNetV3",
    description: "Upload a photo of your crop and get instant disease identification with 90%+ accuracy, treatment steps, and organic alternatives.",
    icon: Microscope,
    accentColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-200/80 text-blue-600",
    badgeText: "CROP SCANNER",
    revealBadges: ["90%+ Accuracy", "38 Diseases", "Real-Time"],
  },
  {
    id: "mandi-prices",
    title: "Live Mandi Prices",
    category: "AGMARKNET API · Live Data",
    description: "Compare real-time prices across 500+ mandis nationwide. Find the best market for your harvest before you load the truck.",
    icon: TrendingUp,
    accentColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-200/80 text-emerald-600",
    badgeText: "PRICE INTEL",
    revealBadges: ["500+ Mandis", "15-min Updates", "Price Alerts"],
  },
  {
    id: "smart-schedule",
    title: "Smart Irrigation Schedule",
    category: "OpenWeather · Soil Science",
    description: "AI-generated personalized irrigation and fertilizer schedules based on live weather, soil type, crop stage, and local conditions.",
    icon: CloudSun,
    accentColor: "text-cyan-600",
    iconBg: "bg-cyan-50 border-cyan-200/80 text-cyan-600",
    badgeText: "ADVISORY ENGINE",
    revealBadges: ["7-Day Forecast", "Soil-Aware", "Plot-Specific"],
  },
  {
    id: "ai-chatbot",
    title: "Krishi AI Assistant",
    category: "Gemini 2.5 · Multilingual",
    description: "Ask farming questions in Hindi, Telugu, Marathi, or English. Get expert agronomic advice available 24/7 — no internet expert needed.",
    icon: BrainCircuit,
    accentColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-200/80 text-purple-600",
    badgeText: "KRISHI AGENT",
    revealBadges: ["10+ Languages", "Gemini AI", "Voice Ready"],
  },
  {
    id: "price-alerts",
    title: "Price Alert System",
    category: "Push Notifications · SMS",
    description: "Set target prices and receive instant alerts via SMS or push notification when any mandi crosses your threshold.",
    icon: Bell,
    accentColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-200/80 text-amber-600",
    badgeText: "VIGILANCE GRID",
    revealBadges: ["SMS + Push", "Multi-Mandi", "Auto-Escalate"],
  },
  {
    id: "geo-plots",
    title: "Geo Plot Manager",
    category: "Spatial Coordinates · GPS",
    description: "Map your plots with GPS precision. Manage multiple fields independently with per-plot crop tracking, history, and schedules.",
    icon: MapPin,
    accentColor: "text-teal-600",
    iconBg: "bg-teal-50 border-teal-200/80 text-teal-600",
    badgeText: "FIELD MAPPING",
    revealBadges: ["GPS Pinned", "Multi-Plot", "History Log"],
  },
  {
    id: "scheme-match",
    title: "Government Scheme Matcher",
    category: "PM-KISAN · Fasal Bima",
    description: "Find every central and state government scheme you qualify for — PM-KISAN, crop insurance, subsidies — matched to your profile.",
    icon: Zap,
    accentColor: "text-indigo-600",
    iconBg: "bg-indigo-50 border-indigo-200/80 text-indigo-600",
    badgeText: "WELFARE ENGINE",
    revealBadges: ["200+ Schemes", "Explainable AI", "Instant Match"],
  },
  {
    id: "privacy-first",
    title: "Farmer Data Privacy",
    category: "Zero-Knowledge · Secure",
    description: "Your land records, crop data, and location are encrypted and never sold. Farmer privacy is a fundamental right, not a feature.",
    icon: Lock,
    accentColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-200/80 text-rose-600",
    badgeText: "PRIVACY VAULT",
    revealBadges: ["Encrypted", "No PII Sold", "DPDP Compliant"],
  },
];

export default function AgriFeatures() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section
      id="agri-features"
      className="relative py-20 overflow-hidden bg-slate-50 text-slate-900"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ─── HEADER ─── */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#65a30d]/30 bg-[#65a30d]/10 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#65a30d] shadow-sm">
            <Leaf className="w-3.5 h-3.5 text-[#65a30d] animate-pulse" />
            <span>● KRISHI INTELLIGENCE PLATFORM</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Engineered for Farmer Prosperity &amp; Crop Resilience
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI-driven tools purpose-built for India's smallholder farmers — from seed to sale.
          </p>
        </div>

        {/* ─── FEATURE CARDS GRID ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURE_CARDS.map((card) => {
            const IconComponent = card.icon;
            const isHovered = hoveredCard === card.id;

            return (
              <motion.div
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={{ y: -4 }}
                className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {card.badgeText}
                    </span>
                    <div className={`p-3 rounded-2xl border ${card.iconBg} group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 shadow-2xs`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className={`text-lg font-bold text-slate-900 transition-colors ${isHovered ? card.accentColor : ""}`}>
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 mb-1 font-mono">{card.category}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 font-sans font-normal">
                    {card.description}
                  </p>
                </div>

                {/* Hover Reveal Indicators */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {card.revealBadges.map((badge, idx) => (
                    <span
                      key={idx}
                      className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded transition-all ${
                        isHovered
                          ? "bg-slate-100 text-slate-800 border border-slate-200"
                          : "bg-slate-50 text-slate-500 border border-slate-100"
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

