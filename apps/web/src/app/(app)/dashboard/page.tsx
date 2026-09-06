// @ts-nocheck
'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  Leaf, TrendingUp, Landmark, Loader2, AlertTriangle, Droplets,
  ThermometerSun, Sprout, Clock, Activity, FlaskConical, CheckCircle2,
  Microscope
} from 'lucide-react'

const PAGE_BG = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at 80% 10%, rgba(255,210,80,0.4) 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, rgba(80,190,130,0.35) 0%, transparent 50%), #f0f7ee',
}
const DEFAULT_PLOTS = [
  { id: 'plot2a', name: 'Plot 2A', crop: 'Tomato', area: '1.2 ac', city: 'Ludhiana' },
]
const CROP_STAGES = {
  wheat:['Sowing','Vegetative','Flowering','Harvest'],
  rice:['Nursery','Transplanting','Flowering','Harvest'],
  tomato:['Seedling','Vegetative','Fruiting','Harvest'],
  onion:['Sowing','Bulbing','Maturation','Harvest'],
  cotton:['Sowing','Vegetative','Boll Formation','Harvest'],
  potato:['Planting','Vegetative','Tuber Init.','Harvest'],
  default:['Sowing','Vegetative','Flowering','Harvest'],
}
const CROP_DAYS = { wheat:120, rice:130, tomato:90, onion:110, cotton:150, potato:80, default:100 }

function getStageInfo(crop) {
  const cKey = Object.keys(CROP_STAGES).find(k => crop.toLowerCase().includes(k)) || 'default'
  const dKey = Object.keys(CROP_DAYS).find(k => crop.toLowerCase().includes(k)) || 'default'
  const stages = CROP_STAGES[cKey]
  const totalDays = CROP_DAYS[dKey]
  const daysSinceSowing = Math.floor(totalDays * 0.4)
  const daysToHarvest = totalDays - daysSinceSowing
  const stageIndex = Math.min(Math.floor((daysSinceSowing / totalDays) * stages.length), stages.length - 2)
  return { stages, stageIndex, daysToHarvest }
}

function greeting(name) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${time}, ${name} 🌾`
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [plots, setPlots] = useState(DEFAULT_PLOTS)
  const [plotWeather, setPlotWeather] = useState({})
  const [marketData, setMarketData] = useState({})
  const [lastDiagnosis, setLastDiagnosis] = useState(null)
  const [lastSoilScan, setLastSoilScan] = useState(null)
  const [notes, setNotes] = useState({})
  const [checklists, setChecklists] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Load ALL localStorage data
  useEffect(() => {
    try {
      const savedPlots = localStorage.getItem('kisanseva_plots')
      if (savedPlots) { const p = JSON.parse(savedPlots); if (p.length > 0) setPlots(p) }
      const savedNotes = localStorage.getItem('kisanseva_notes')
      if (savedNotes) setNotes(JSON.parse(savedNotes))
      const savedChecklists = localStorage.getItem('kisanseva_checklists')
      if (savedChecklists) setChecklists(JSON.parse(savedChecklists))
      const savedDiagnosis = localStorage.getItem('kisanseva_last_diagnosis')
      if (savedDiagnosis) setLastDiagnosis(JSON.parse(savedDiagnosis))
      const savedSoil = localStorage.getItem('kisanseva_last_soil')
      if (savedSoil) setLastSoilScan(JSON.parse(savedSoil))
    } catch (e) {}
  }, [])

  // Fetch live weather + market for all plots
  useEffect(() => {
    if (!plots.length) return
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        const weatherResults = await Promise.all(
          plots.map(plot =>
            fetch(`/api/weather?city=${encodeURIComponent(plot.city)}&crop=${encodeURIComponent(plot.crop)}&stage=flowering`)
              .then(r => r.json()).catch(() => null)
          )
        )
        const wMap = {}
        plots.forEach((plot, i) => { if (weatherResults[i]?.success) wMap[plot.id] = weatherResults[i] })
        setPlotWeather(wMap)

        const uniqueCrops = [...new Set(plots.map(p => p.crop))]
        const mktResults = await Promise.all(
          uniqueCrops.map(crop =>
            fetch(`/api/v1/market?commodity=${encodeURIComponent(crop)}`)
              .then(r => r.json()).catch(() => null)
          )
        )
        const mMap = {}
        uniqueCrops.forEach((crop, i) => { if (mktResults[i]?.success) mMap[crop] = mktResults[i] })
        setMarketData(mMap)
      } catch (e) { console.error(e) }
      finally { setIsLoading(false); setLastRefresh(new Date()) }
    }
    fetchAll()
  }, [plots])

  const userName = isLoaded && user ? (user.firstName || user.username || 'Farmer') : 'Farmer'
  const totalArea = plots.reduce((sum, p) => { const n = parseFloat(p.area.replace(/[^\d.]/g, '')); return sum + (isNaN(n) ? 0 : n) }, 0)
  const firstPlot = plots[0]
  const firstWeather = plotWeather[firstPlot?.id]
  const worstRiskPlot = plots.find(p => plotWeather[p.id]?.advisory?.diseaseRisk?.startsWith('⚠')) || null
  const allChecklistItems = Object.values(checklists).flat()
  const pendingTasks = allChecklistItems.filter(t => !t.completed).length
  const doneTasks = allChecklistItems.filter(t => t.completed).length
  const bestMarket = Object.entries(marketData).find(([, v]) => v?.highestPrice)
  const projectedRevenue = bestMarket
    ? Math.round(bestMarket[1].highestPrice * totalArea * 18)
    : Math.round(totalArea * 18 * 2200)

  return (
    <div style={PAGE_BG}>
      <main style={{ flex: 1, paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '28px 28px 16px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.025em' }}>
              {greeting(userName)}
            </h1>
            <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: '5px 0 0', fontWeight: 500 }}>
              Tracking <strong>{plots.length} plots</strong> · <strong>{totalArea.toFixed(1)} acres</strong>
              {' — '}{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#166534', color: '#fff', borderRadius: 9999, padding: '8px 16px', fontSize: '0.875rem', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, background: '#86efac', borderRadius: '50%', display: 'inline-block' }} />
              All Systems Online
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', gap: 16 }}>
            <Loader2 size={36} color="#166534" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Syncing live data for {plots.length} plots…</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* PLATFORM IMPACT STRIP */}
            <div style={{ padding: '0 28px', marginBottom: 18 }}>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', borderRadius: 14, padding: '14px 20px', display: 'flex', gap: 0, flexWrap: 'wrap', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: '100%', background: 'radial-gradient(circle at 80% 50%, rgba(34,197,94,0.15) 0%, transparent 70%)' }} />
                {[
                  { value: '140M+', label: 'Target Farmers', icon: '👨‍🌾' },
                  { value: '38', label: 'Disease Classes', icon: '🧬' },
                  { value: '93.2%', label: 'AI Accuracy', icon: '🎯' },
                  { value: '5', label: 'Indian Languages', icon: '🗣️' },
                  { value: '<5s', label: 'Diagnosis Time', icon: '⚡' },
                  { value: '₹0', label: 'Cost to Farmer', icon: '🆓' },
                ].map((stat, i) => (
                  <div key={stat.label} style={{ flex: '1 1 100px', padding: '6px 12px', borderRight: i < 5 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem' }}>{stat.icon}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f0fdf4', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{stat.value}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 1: 4 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: '0 28px', marginBottom: 20 }}>
              {[
                { href: '/schedule', label: 'My Plots', value: `${plots.length} Plots`, sub: `${totalArea.toFixed(1)} acres · ${plots.map(p => p.crop).join(', ')}`, color: '#166534', icon: <Sprout size={18} color="#166534" /> },
                { href: '/schedule', label: `Weather · ${firstPlot?.city}`, value: firstWeather ? `${firstWeather.current.temp}°C` : '—', sub: firstWeather ? `${firstWeather.current.description}, ${firstWeather.current.humidity}% humidity` : 'Loading…', color: '#0369a1', icon: <ThermometerSun size={18} color="#0369a1" /> },
                { href: '/diagnose', label: 'Pest & Disease', value: worstRiskPlot ? 'High Risk' : 'Low Risk', sub: worstRiskPlot ? `${worstRiskPlot.name}: ${plotWeather[worstRiskPlot.id]?.advisory?.diseaseRisk?.replace(/^⚠️\s*/, '').split('.')[0]}` : `All ${plots.length} plots clear`, color: worstRiskPlot ? '#dc2626' : '#16a34a', icon: <AlertTriangle size={18} color={worstRiskPlot ? '#dc2626' : '#16a34a'} /> },
                { href: '/market', label: 'Est. Revenue', value: `₹${projectedRevenue.toLocaleString('en-IN')}`, sub: `${totalArea.toFixed(1)} ac at market rate`, color: '#b45309', icon: <Landmark size={18} color="#b45309" /> },
              ].map(card => (
                <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #e8ede7', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{card.icon}<span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{card.label}</span></div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{card.value}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{card.sub}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* ROW 2: Plot Growth Tracker */}
            <div style={{ padding: '0 28px', marginBottom: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #e8ede7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Leaf size={20} color="#166534" />
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: 0 }}>Live Plot Growth Tracker</h2>
                  </div>
                  <Link href="/schedule" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534', textDecoration: 'none' }}>Manage plots →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plots.length, 2)}, 1fr)`, gap: 20 }}>
                  {plots.map((plot) => {
                    const { stages, stageIndex, daysToHarvest } = getStageInfo(plot.crop)
                    const w = plotWeather[plot.id]
                    const mkt = marketData[plot.crop]
                    const checkCount = (checklists[plot.id] || []).filter(t => !t.completed).length
                    return (
                      <div key={plot.id} style={{ padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9rem' }}>{plot.name} — {plot.crop}</div>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>📏 {plot.area} · 📍 {plot.city}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c' }}>~{daysToHarvest}d to harvest</div>
                            {w?.current?.temp != null && <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>🌡 {w.current.temp}°C</div>}
                            {mkt?.highestPrice && <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 2 }}>₹{mkt.highestPrice}/q</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 3, height: 10, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                          {stages.map((s, idx) => (
                            <div key={s} style={{ flex: 1, height: '100%', background: idx < stageIndex ? '#166534' : idx === stageIndex ? '#22c55e' : '#e5e7eb', borderRadius: idx === 0 ? '99px 0 0 99px' : idx === stages.length-1 ? '0 99px 99px 0' : 0 }} title={s} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 8 }}>
                          {stages.map((s, idx) => (
                            <span key={s} style={{ color: idx === stageIndex ? '#166534' : '#9ca3af', fontWeight: idx === stageIndex ? 700 : 400 }}>{s}{idx === stageIndex ? ' ✦' : ''}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {w?.advisory?.irrigate && <span style={{ fontSize: '0.7rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>💧 Irrigate {w.advisory.irrigationMm}mm</span>}
                          {w?.advisory?.diseaseRisk?.startsWith('⚠') && <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>⚠ Disease Risk</span>}
                          {checkCount > 0 && <span style={{ fontSize: '0.7rem', background: '#fef9c3', color: '#92400e', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>📋 {checkCount} tasks pending</span>}
                          {notes[plot.id] && <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>📝 Note saved</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ROW 3: 3-column — Actions | Markets | Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: '0 28px', marginBottom: 20 }}>

              {/* Actions */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e8ede7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Clock size={17} color="#166534" />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', margin: 0 }}>{"Today's Actions"}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plots.map(plot => {
                    const w = plotWeather[plot.id]
                    const irrigate = w?.advisory?.irrigate
                    const risk = w?.advisory?.diseaseRisk?.startsWith('⚠')
                    return (
                      <div key={plot.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: risk ? '#fef2f2' : irrigate ? '#eff6ff' : '#f0fdf4', border: `1px solid ${risk ? '#fecaca' : irrigate ? '#bfdbfe' : '#dcfce7'}` }}>
                        <span style={{ fontSize: '1.1rem' }}>{risk ? '⚠️' : irrigate ? '💧' : '✅'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#111827' }}>{plot.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: 1 }}>{!w ? 'Loading…' : risk ? 'Apply fungicide today' : irrigate ? `${w.advisory.irrigationMm}mm water needed` : 'All clear'}</div>
                        </div>
                      </div>
                    )
                  })}
                  {pendingTasks > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <span>📋</span>
                      <div><div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#111827' }}>Checklist</div><div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: 1 }}>{pendingTasks} pending · {doneTasks} done</div></div>
                    </div>
                  )}
                </div>
                <Link href="/schedule" style={{ display: 'block', textAlign: 'center', marginTop: 12, padding: '8px 0', borderRadius: 9, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' }}>Full Schedule →</Link>
              </div>

              {/* Market prices per crop */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e8ede7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <TrendingUp size={17} color="#047857" />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', margin: 0 }}>Live Mandi Prices</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plots.map(plot => {
                    const mkt = marketData[plot.crop]
                    const best = mkt?.mandis?.[0]
                    return (
                      <div key={plot.id}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{plot.crop}</div>
                        {best ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>{best.mandiName}</div><div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{best.district}</div></div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#166534' }}>₹{best.modalPrice}</div>
                              <div style={{ fontSize: '0.7rem', color: best.vsAverage > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{best.vsAverage > 0 ? `+${best.vsAverage} ↑` : `${best.vsAverage} ↓`} avg</div>
                            </div>
                          </div>
                        ) : <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Fetching…</div>}
                      </div>
                    )
                  })}
                </div>
                <Link href="/market" style={{ display: 'block', textAlign: 'center', marginTop: 12, padding: '8px 0', borderRadius: 9, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' }}>All Markets →</Link>
              </div>

              {/* Recent Activity */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e8ede7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Activity size={17} color="#7c3aed" />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', margin: 0 }}>Recent Activity</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 9, background: lastDiagnosis ? '#faf5ff' : '#f9fafb', border: `1px solid ${lastDiagnosis ? '#e9d5ff' : '#f3f4f6'}` }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Microscope size={15} color={lastDiagnosis ? '#7c3aed' : '#9ca3af'} style={{ marginTop: 1, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>Last Diagnosis</div>
                        {lastDiagnosis ? (
                          <><div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, marginTop: 1 }}>{lastDiagnosis.disease || lastDiagnosis.name || 'Unknown'}</div><div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 1 }}>{lastDiagnosis.crop || ''}{lastDiagnosis.confidence ? ` · ${lastDiagnosis.confidence}% confidence` : ''}</div></>
                        ) : <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 }}>No scans yet — try Crop Diagnose</div>}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 9, background: lastSoilScan ? '#f0fdf4' : '#f9fafb', border: `1px solid ${lastSoilScan ? '#dcfce7' : '#f3f4f6'}` }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <FlaskConical size={15} color={lastSoilScan ? '#166534' : '#9ca3af'} style={{ marginTop: 1, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>Last Soil Scan</div>
                        {lastSoilScan ? (
                          <><div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginTop: 1 }}>pH {lastSoilScan.ph || '—'} · N:{lastSoilScan.nitrogen || '—'}</div><div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 1 }}>{lastSoilScan.recommendation?.split('.')[0] || 'See Soil Health'}</div></>
                        ) : <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 }}>No scan yet — try Soil Health</div>}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 9, background: '#fefce8', border: '1px solid #fef08a' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <CheckCircle2 size={15} color="#ca8a04" style={{ marginTop: 1, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>Task Progress</div>
                        <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: 1, fontWeight: 600 }}>{doneTasks} done · {pendingTasks} pending</div>
                        {allChecklistItems.length > 0 && (
                          <div style={{ marginTop: 4, background: '#e5e7eb', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                            <div style={{ background: '#16a34a', height: '100%', width: `${(doneTasks / allChecklistItems.length) * 100}%`, borderRadius: 99 }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link href="/diagnose" style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 9, textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}>Scan Crop</Link>
                  <Link href="/soil-health" style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 9, textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' }}>Soil Check</Link>
                </div>
              </div>
            </div>

            {/* ROW 4: Revenue Banner */}
            <div style={{ padding: '0 28px' }}>
              <div style={{ background: 'linear-gradient(135deg, #166534 0%, #064e3b 100%)', borderRadius: 16, padding: '20px 24px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(6,78,59,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Projected Harvest Revenue</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>₹{projectedRevenue.toLocaleString('en-IN')} <span style={{ fontSize: '1rem', color: '#a7f3d0', fontWeight: 500 }}>Est.</span></div>
                  <p style={{ fontSize: '0.8rem', color: '#d1fae5', margin: '4px 0 0' }}>
                    {totalArea.toFixed(1)} ac · {plots.map(p => p.crop).join(', ')}
                    {bestMarket ? ` · Best: ₹${bestMarket[1].highestPrice}/q at ${bestMarket[1].bestMandi?.mandiName || bestMarket[0]}` : ''}
                  </p>
                </div>
                <Link href="/market" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap' }}>View All Markets →</Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
