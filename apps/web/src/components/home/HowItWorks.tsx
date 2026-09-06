"use client";
import { Camera, Cpu, CheckCircle2 } from "lucide-react";
import { ScrollReveal, StaggerReveal, StaggerChild } from "@/components/ui/ScrollReveal";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Capture Your Crop",
      description: "Snap a photo of the affected leaf or plant — or drag-and-drop an image from your gallery.",
      icon: Camera,
      badge: "Step 1",
      softIconBg: "bg-amber-50 text-amber-600 border-amber-100",
      numberColor: "text-amber-200",
      hoverBorder: "hover:border-amber-300 hover:shadow-md",
    },
    {
      number: "02",
      title: "AI Analysis",
      description: "Our MobileNetV3 model classifies the disease from 38 crop conditions in under 5 seconds.",
      icon: Cpu,
      badge: "Step 2",
      softIconBg: "bg-slate-50 text-slate-600 border-slate-200",
      numberColor: "text-slate-200",
      hoverBorder: "hover:border-slate-300 hover:shadow-md",
    },
    {
      number: "03",
      title: "Act & Track",
      description: "Get treatment steps, organic alternatives, and mandi prices — all tailored to your crop and location.",
      icon: CheckCircle2,
      badge: "Step 3",
      softIconBg: "bg-[#65a30d]/10 text-[#65a30d] border border-[#65a30d]/20",
      numberColor: "text-[#65a30d]/30",
      hoverBorder: "hover:border-[#65a30d]/40 hover:shadow-md",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-10 items-start">

        {/* Left: sticky label — slides in from left */}
        <ScrollReveal preset="fade-left" className="lg:w-[32%] w-full">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
              SIMPLE 3-STEP PROCESS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              From Field to Treatment in Seconds
            </h2>
            <p className="text-slate-500 text-base leading-relaxed">
              No agronomist, no clinic, no waiting — just point your camera and get expert-level advice.
            </p>
          </div>
        </ScrollReveal>

        {/* Right: cascading steps */}
        <StaggerReveal
          className="lg:w-[68%] w-full flex flex-col gap-5"
          delay={0.2}
          threshold={0.05}
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <StaggerChild key={step.number} preset="stagger-child-left">
                <div
                  className={`relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:-translate-y-1 transition-all duration-300 flex gap-5 group ${step.hoverBorder}`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className={`p-3.5 rounded-2xl border ${step.softIconBg} group-hover:scale-110 transition-transform duration-300 shadow-sm flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow relative overflow-hidden">
                    <span className="uppercase tracking-wider font-mono text-[10px] font-bold text-slate-400">
                      {step.badge}
                    </span>
                    <span className={`text-5xl font-black ${step.numberColor} absolute right-2 top-0 pointer-events-none opacity-70`}>
                      {step.number}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5 mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm">{step.description}</p>
                  </div>
                </div>
              </StaggerChild>
            );
          })}
        </StaggerReveal>

      </div>
    </div>
  );
}

