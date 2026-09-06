'use client'
import { Camera, Cpu, CheckCircle2 } from 'lucide-react'

// Copied EXACTLY from JanSuvidha HowItWorks.tsx
// Same: 30% left label column + 70% stacked step cards with huge faded numbers

export default function AgriHowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Take a Photo',
      description: 'Point your camera at any affected leaf or stem — works in field conditions, low light, even dusty lenses.',
      icon: Camera,
      badge: 'Step 1',
      softIconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      numberColor: 'text-amber-200',
      hoverBorder: 'hover:border-amber-300 hover:shadow-md',
    },
    {
      number: '02',
      title: 'AI Analyses',
      description: 'Our MobileNetV3 model identifies disease, severity, and affected crop area with 91%+ accuracy in under 5 seconds.',
      icon: Cpu,
      badge: 'Step 2',
      softIconBg: 'bg-slate-50 text-slate-600 border border-slate-200',
      numberColor: 'text-slate-200',
      hoverBorder: 'hover:border-slate-300 hover:shadow-md',
    },
    {
      number: '03',
      title: 'Get Treatment Plan',
      description: 'Receive step-by-step treatment, organic alternatives, prevention tips, and nearby agri-input shop locations.',
      icon: CheckCircle2,
      badge: 'Step 3',
      softIconBg: 'bg-[#65a30d]/10 text-[#65a30d] border border-[#65a30d]/20',
      numberColor: 'text-[#65a30d]/30',
      hoverBorder: 'hover:border-[#65a30d]/40 hover:shadow-md',
    },
  ]

  return (
    // Exact same wrapper as JanSuvidha HowItWorks
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-10 items-start">

        {/* Left: sticky label — 32% width, same as JanSuvidha */}
        <div className="lg:w-[32%] w-full">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
              SIMPLE 3-STEP PROCESS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              From Photo to Treatment Plan in Seconds
            </h2>
            <p className="text-slate-500 text-base leading-relaxed">
              Three verifiable steps to crop disease detection and personalised farm advisory.
            </p>
          </div>
        </div>

        {/* Right: cascading steps — 68% width, same as JanSuvidha */}
        <div className="lg:w-[68%] w-full flex flex-col gap-5">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              // Exact same card as JanSuvidha step cards
              <div
                key={step.number}
                className={`relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:-translate-y-1 transition-all duration-300 flex gap-5 group ${step.hoverBorder}`}
              >
                {/* Icon box — same as JanSuvidha */}
                <div className="flex-shrink-0">
                  <div className={`p-3.5 rounded-2xl border ${step.softIconBg} group-hover:scale-110 transition-transform duration-300 shadow-sm flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Content with huge faded number — same as JanSuvidha */}
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
            )
          })}
        </div>

      </div>
    </div>
  )
}

