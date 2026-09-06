'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Copied from JanSuvidha's inline PillarCard in page.tsx — same exact card structure

function PillarCard({
  title, description, href, cardStyle, iconBg, hoverColor, badgeColor, badgeText, emoji,
}: {
  title: string; description: string; href: string
  cardStyle: string; iconBg: string; hoverColor: string; badgeColor: string; badgeText: string; emoji: string
}) {
  return (
    <Link
      href={href}
      // Exact same classes as JanSuvidha PillarCard
      className={`group p-7 rounded-2xl bg-white border border-slate-200 shadow-sm hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full ${cardStyle}`}
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            {emoji}
          </div>
          <div className="p-2 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
            <ArrowRight className={`w-4 h-4 ${hoverColor} group-hover:translate-x-1 transition-transform duration-300`} />
          </div>
        </div>
        <h3 className={`text-xl font-bold text-slate-900 ${hoverColor} transition-colors duration-300`}>{title}</h3>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        <span className={`px-2.5 py-1 rounded-full border ${badgeColor}`}>{badgeText}</span>
        <span className="text-slate-400 group-hover:text-slate-600 flex items-center gap-1 transition-colors">
          Explore <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}

export default function AgriPillarCards() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Same "Choose Your Path" heading as JanSuvidha */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-300" />
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-wide text-center">
          Choose Your Path
        </h2>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-300" />
      </div>

      {/* Same 3-col grid as JanSuvidha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PillarCard
          title="Diagnose Crop"
          description="Upload a leaf photo and get AI-powered disease detection with treatment plan in under 5 seconds."
          href="/diagnose"
          cardStyle="hover:border-blue-300"
          iconBg="bg-blue-50 text-blue-600 border border-blue-100"
          hoverColor="group-hover:text-blue-600"
          badgeColor="bg-blue-50 text-blue-700 border-blue-100"
          badgeText="AI Diagnosis"
          emoji="🔬"
        />
        <PillarCard
          title="Check Mandi Prices"
          description="Live Agmarknet prices from 500+ mandis ranked by net value to your farm gate."
          href="/market"
          cardStyle="hover:border-[#65a30d]/40"
          iconBg="bg-[#65a30d]/10 text-[#65a30d] border border-[#65a30d]/20"
          hoverColor="group-hover:text-emerald-600"
          badgeColor="bg-emerald-50 text-emerald-700 border-emerald-100"
          badgeText="Live Market"
          emoji="📈"
        />
        <PillarCard
          title="My Plots"
          description="Get personalised weekly irrigation and fertilizer schedules based on soil health and weather."
          href="/schedule"
          cardStyle="hover:border-amber-300"
          iconBg="bg-amber-50 text-amber-600 border border-amber-100"
          hoverColor="group-hover:text-amber-600"
          badgeColor="bg-amber-50 text-amber-700 border-amber-100"
          badgeText="Smart Advisory"
          emoji="📅"
        />
      </div>
    </div>
  )
}

