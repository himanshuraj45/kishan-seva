'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

const PAGE_BG = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at 0% 0%, rgba(255,220,90,0.45) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(80,200,160,0.38) 0%, transparent 55%), #f0f7ee',
  fontFamily: 'Inter,sans-serif',
}

function owIconToEmoji(icon: string): string {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '⛅', '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️', '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️', '50d': '🌫️', '50n': '🌫️',
  }
  return map[icon] ?? '🌤️'
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getCropAdvice(crop: string, dayIndex: number, areaAcres: number, rain: number) {
  const c = crop.toLowerCase()
  let fert = '—'
  let notes = '—'
  
  const area = isNaN(areaAcres) ? 1 : Math.max(0.1, areaAcres)

  // Base fertilizer doses per acre
  const schedule: Record<string, any> = {
    tomato: { d0: 'NPK 50kg', d3: 'Urea 20kg', d7: 'K2SO4 10kg' },
    wheat:  { d0: 'DAP 40kg', d3: 'Urea 25kg', d7: 'Zinc 5kg' },
    rice:   { d0: 'NPK 40kg', d3: 'Urea 30kg', d7: 'Zinc 10kg' },
    onion:  { d0: 'SSP 50kg', d3: 'Urea 20kg', d7: 'NPK 19:19:19' },
    cotton: { d0: 'DAP 50kg', d3: 'Urea 30kg', d7: 'MOP 15kg' },
    potato: { d0: 'NPK 60kg', d3: 'Urea 25kg', d7: 'Calcium 5kg' },
    default:{ d0: 'Compost 1T', d3: 'Urea 15kg', d7: 'NPK Spray' }
  }

  // Find exact match or default
  const matchKey = Object.keys(schedule).find(k => c.includes(k)) || 'default'
  const dose = schedule[matchKey]

  if (dayIndex === 0) {
    fert = dose.d0
    notes = 'Basal dose application'
  } else if (dayIndex === 3) {
    fert = dose.d3
    notes = 'Top dressing (avoid if raining)'
  } else if (dayIndex === 7) {
    fert = dose.d7
    notes = 'Foliar micronutrient spray'
  } else if (dayIndex === 5) {
    notes = 'Scout field for early pest signs'
  } else if (dayIndex === 9) {
    notes = 'Weeding and soil turning'
  }

  // Multiply dosage by area
  if (fert !== '—') {
     fert = fert.replace(/(\d+)/, (m) => Math.round(parseInt(m) * area).toString())
  }

  if (rain > 10 && fert !== '—') {
    notes = '⚠️ Delay fertilizer - heavy rain expected'
  }

  return { fert, notes }
}

export default function SchedulePage() {
  const DEFAULT_PLOTS = [
    { id: 'plot1', name: 'Example Plot', crop: 'Wheat', area: '1.5 ac', city: 'Bhopal' },
  ]

  const [plots, setPlots] = useState<any[]>(DEFAULT_PLOTS)
  const [activePlot, setActivePlot] = useState('plot1')
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'advisory' | 'calendar'>('advisory')

  const [weather, setWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  
  // Add/Edit Plot Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null)
  const [newPlot, setNewPlot] = useState({ name: '', crop: '', area: '', city: '' })

  // Notes and Checklist State
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [checklists, setChecklists] = useState<Record<string, { id: string; text: string; completed: boolean }[]>>({})
  const [newChecklistItem, setNewChecklistItem] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kisanseva_plots')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.length > 0) {
          setPlots(parsed)
          if (!parsed.find((p: any) => p.id === activePlot)) {
            setActivePlot(parsed[0].id)
          }
        }
      }
    } catch (e) {
      console.error('Failed to load plots', e)
    }
  }, [])

  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('kisanseva_notes')
      if (savedNotes) setNotes(JSON.parse(savedNotes))
      
      const savedChecklists = localStorage.getItem('kisanseva_checklists')
      if (savedChecklists) setChecklists(JSON.parse(savedChecklists))
    } catch (e) {
      console.error('Failed to load notes/checklists', e)
    }
  }, [])

  useEffect(() => {
    if (Object.keys(notes).length > 0) {
      localStorage.setItem('kisanseva_notes', JSON.stringify(notes))
    }
  }, [notes])

  useEffect(() => {
    if (Object.keys(checklists).length > 0) {
      localStorage.setItem('kisanseva_checklists', JSON.stringify(checklists))
    }
  }, [checklists])

  const handleAddPlot = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlot.name || !newPlot.crop || !newPlot.city) return
    
    let updatedPlots = [...plots]
    const areaStr = newPlot.area && !newPlot.area.includes('ac') ? `${newPlot.area} ac` : newPlot.area || 'Unknown'

    if (editingPlotId) {
      updatedPlots = updatedPlots.map(p => 
        p.id === editingPlotId 
          ? { ...p, name: newPlot.name, crop: newPlot.crop, city: newPlot.city, area: areaStr }
          : p
      )
    } else {
      const plotData = {
        id: `plot_${Date.now()}`,
        name: newPlot.name,
        crop: newPlot.crop,
        city: newPlot.city,
        area: areaStr
      }
      updatedPlots.push(plotData)
      setActivePlot(plotData.id)
    }
    
    setPlots(updatedPlots)
    localStorage.setItem('kisanseva_plots', JSON.stringify(updatedPlots))
    
    setShowAddModal(false)
    setEditingPlotId(null)
    setNewPlot({ name: '', crop: '', area: '', city: '' })
  }

  const handleDeletePlot = () => {
    if (!editingPlotId) return
    const updatedPlots = plots.filter(p => p.id !== editingPlotId)
    // If we delete the last plot, revert to defaults
    const finalPlots = updatedPlots.length > 0 ? updatedPlots : DEFAULT_PLOTS
    setPlots(finalPlots)
    setActivePlot(finalPlots[0].id)
    localStorage.setItem('kisanseva_plots', JSON.stringify(finalPlots))
    setShowAddModal(false)
    setEditingPlotId(null)
  }

  const openEditModal = () => {
    const active = plots.find(p => p.id === activePlot)
    if (active) {
      setNewPlot({ 
        name: active.name, 
        crop: active.crop, 
        city: active.city, 
        area: active.area.replace(' ac', '') 
      })
      setEditingPlotId(active.id)
      setShowAddModal(true)
    }
  }

  const openAddModal = () => {
    setNewPlot({ name: '', crop: '', area: '', city: '' })
    setEditingPlotId(null)
    setShowAddModal(true)
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(prev => ({ ...prev, [activePlot]: e.target.value }))
  }

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChecklistItem.trim()) return
    
    setChecklists(prev => {
      const plotList = prev[activePlot] || []
      return {
        ...prev,
        [activePlot]: [...plotList, { id: Date.now().toString(), text: newChecklistItem.trim(), completed: false }]
      }
    })
    setNewChecklistItem('')
  }

  const toggleChecklist = (id: string) => {
    setChecklists(prev => {
      const plotList = prev[activePlot] || []
      return {
        ...prev,
        [activePlot]: plotList.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
      }
    })
  }

  const deleteChecklist = (id: string) => {
    setChecklists(prev => {
      const plotList = prev[activePlot] || []
      return {
        ...prev,
        [activePlot]: plotList.filter(item => item.id !== id)
      }
    })
  }

  const activePlotData = plots.find(p => p.id === activePlot) || plots[0]

  useEffect(() => {
    const fetchWeather = async () => {
      if (!activePlotData) return
      setWeatherLoading(true)
      setWeatherError(null)
      try {
        const resp = await fetch(`/api/weather?city=${encodeURIComponent(activePlotData.city)}&crop=${activePlotData.crop}&stage=flowering`)
        if (!resp.ok) throw new Error(`Status ${resp.status}`)
        const data = await resp.json()
        setWeather(data)
      } catch {
        setWeatherError('Could not load live weather.')
      } finally {
        setWeatherLoading(false)
      }
    }
    fetchWeather()
  }, [activePlot, activePlotData])

  const currentTemp = weather?.current?.temp ? Math.round(weather.current.temp) : null
  const currentDesc = weather?.current?.description ?? ''
  const currentIcon = weather?.current?.icon ?? '01d'
  const humidity = weather?.current?.humidity ?? 65
  const windSpeed = weather?.current?.windSpeed ?? 12
  const dailyForecast = weather?.daily ?? []
  
  const activeAreaNum = parseFloat(activePlotData.area.replace(/[^\d.-]/g, '')) || 1

  return (
    <div style={PAGE_BG}>
      
      {/* HEADER WITH TABS */}
      <div style={{ padding: '32px 28px 0', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid rgba(0,0,0,0.06)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', letterSpacing: '-0.03em' }}>
              Farm Schedule & Calendar
            </h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setActiveTab('advisory')}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none', backgroundColor: activeTab === 'advisory' ? '#2d6a27' : 'transparent', color: activeTab === 'advisory' ? '#fff' : '#6b7280' }}
              >
                7-Day Advisory
              </button>
              <button 
                onClick={() => setActiveTab('calendar')}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none', backgroundColor: activeTab === 'calendar' ? '#2d6a27' : 'transparent', color: activeTab === 'calendar' ? '#fff' : '#6b7280' }}
              >
                Crop Calendar (कृषि पंचांग)
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'advisory' ? (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Plot selector tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '24px 28px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {plots.map(plot => (
          <button key={plot.id} onClick={() => setActivePlot(plot.id)} style={{
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: activePlot === plot.id ? 600 : 500,
            color: activePlot === plot.id ? '#2d6a27' : '#6b7280',
            borderBottom: `2px solid ${activePlot === plot.id ? '#2d6a27' : 'transparent'}`,
            fontFamily: 'Inter,sans-serif', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {plot.name} — {plot.crop}
          </button>
        ))}
        
        <button 
          onClick={openAddModal}
          style={{
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: 600, color: '#2d6a27',
            borderBottom: `2px solid transparent`, fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          + Add Plot
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Field Status Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, background: '#fff', padding: '20px 24px', borderRadius: 16, border: '1px solid #e8ede7', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              {activePlotData.name}
            </h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                🌱 {activePlotData.crop}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                📏 {activePlotData.area}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                📍 {activePlotData.city}
              </span>
            </div>
          </div>
          <button 
            onClick={openEditModal}
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4b5563', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#f9fafb' }}
          >
            Edit Plot
          </button>
        </div>

        {/* Current weather — big centered display */}
        {weatherLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div style={{ fontSize: '0.9rem' }}>Loading live weather...</div>
          </div>
        ) : weatherError ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#dc2626' }}>
            <AlertCircle size={24} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: '0.875rem' }}>{weatherError}</div>
          </div>
        ) : (
          <>
            {/* Big temp display */}
            <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
              <div style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {currentTemp ?? 28}°C, {currentDesc ? currentDesc.charAt(0).toUpperCase() + currentDesc.slice(1) : 'Sunny'} {owIconToEmoji(currentIcon)}
              </div>
            </div>

            {/* 10-day forecast strip */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e8ede7', overflowX: 'auto', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(65px, 1fr))', minWidth: 650 }}>
                {(dailyForecast.length > 0 ? dailyForecast.slice(0, 10) : Array(10).fill(null)).map((day: any, i: number) => {
                  const date = new Date()
                  date.setDate(date.getDate() + i)
                  const dayName = i === 0 ? 'Today' : DAYS[date.getDay()]
                  const maxT = day ? Math.round(day.maxTemp ?? day.temp ?? 28 + i) : (28 + i)
                  const minT = day ? Math.round(day.minTemp ?? day.temp ?? 20 + i) : (20 + i)
                  const icon = day?.icon ?? (i % 3 === 0 ? '01d' : i % 3 === 1 ? '03d' : '10d')
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 6px',
                      borderRight: i < 9 ? '1px solid #f3f4f6' : 'none',
                      background: i === 0 ? '#f0fdf4' : 'transparent',
                    }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: i === 0 ? 700 : 500, color: i === 0 ? '#2d6a27' : '#374151', marginBottom: 10 }}>{dayName}</div>
                      <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{owIconToEmoji(icon)}</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>{maxT}/{minT}°C</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 3 metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
              {[
                { icon: '💧', label: 'Humidity', value: `${humidity}%`, sub: humidity < 60 ? 'Low' : humidity < 80 ? 'Moderate' : 'High' },
                { icon: '🌬️', label: 'Wind Speed', value: `${windSpeed} km/h`, sub: 'North-East' },
                { icon: '☂️', label: 'Rain Probability', value: `${weather?.current?.rainChance ?? 15}%`, sub: 'Low Chance' },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ede7', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>{m.value}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Agricultural Advice */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ background: '#2d6a27', color: '#fff', borderRadius: 9999, padding: '10px 28px', fontSize: '0.9375rem', fontWeight: 600 }}>
            Agricultural Advice
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Irrigation Card */}
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e8ede7', padding: '20px',
            borderLeft: `4px solid ${weather?.advisory?.irrigate ? '#2563eb' : '#d1d5db'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.1rem' }}>💧</span>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Crop Irrigation — {activePlotData.crop}
              </h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#4b5563', margin: 0, lineHeight: 1.7 }}>
              {weather?.advisory?.irrigation ?? `Loading irrigation advice for ${activePlotData.crop}…`}
            </p>
            {weather?.advisory?.irrigationMm > 0 && (
              <div style={{ marginTop: 10, background: '#eff6ff', borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600 }}>
                📐 Est. {weather.advisory.irrigationMm}mm needed today
              </div>
            )}
          </div>

          {/* Pest & Disease Card */}
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e8ede7', padding: '20px',
            borderLeft: `4px solid ${
              weather?.advisory?.diseaseRisk?.startsWith('⚠️') ? '#dc2626'
              : weather?.advisory?.diseaseRisk?.startsWith('Moderate') ? '#d97706'
              : '#16a34a'
            }`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.1rem' }}>🔬</span>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Pest & Disease — {activePlotData.crop}
              </h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#4b5563', margin: 0, lineHeight: 1.7 }}>
              {weather?.advisory?.diseaseRisk ?? `Loading disease risk for ${activePlotData.crop}…`}
            </p>
          </div>

          {/* Spray Window Card — full width */}
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e8ede7', padding: '20px',
            borderLeft: `4px solid ${
              weather?.advisory?.sprayAdvice?.startsWith('✅') ? '#16a34a'
              : weather?.advisory?.sprayAdvice?.startsWith('🌬️') ? '#dc2626'
              : '#d97706'
            }`,
            gridColumn: '1 / -1',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.1rem' }}>🌿</span>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Spray Advisory — {activePlotData.crop} @ {activePlotData.city}
              </h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#4b5563', margin: 0, lineHeight: 1.7 }}>
              {weather?.advisory?.sprayAdvice ?? `Evaluating spray conditions for ${activePlotData.city}…`}
            </p>
          </div>
        </div>

        {/* Weekly schedule */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ede7', overflow: 'hidden', marginTop: 28 }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Weekly Schedule</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Day', 'Irrigation', 'Fertilizer', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dailyForecast.length > 0 ? dailyForecast.slice(0, 10) : Array(10).fill(null)).map((day: any, i: number) => {
                const date = new Date()
                date.setDate(date.getDate() + i)
                const dayStr = i === 0 ? 'Today' : DAYS[date.getDay()]
                
                // Fallbacks if data missing
                const irrigation = day?.irrigationMm ? `${Math.round(day.irrigationMm * activeAreaNum)}L/plot` : '—'
                
                const advice = getCropAdvice(activePlotData.crop, i, activeAreaNum, day?.rainfall ?? 0)

                const finalNotes = day?.sprayWindow === 'Ideal spray conditions (early morning)' && advice.fert !== '—'
                  ? advice.notes + ' (Ideal spray weather)'
                  : advice.notes

                return (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6', borderLeft: i === 0 ? '3px solid #2d6a27' : 'none', background: i === 0 ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#2d6a27' : '#374151' }}>{dayStr}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{irrigation}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{advice.fert}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{finalNotes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Notes and Checklist Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 28, alignItems: 'start' }}>
          
          {/* Notes */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ede7', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              📝 Field Notes
            </h3>
            <textarea
              value={notes[activePlot] || ''}
              onChange={handleNoteChange}
              placeholder={`Add notes for ${activePlotData.name} (e.g., "Observed some yellowing on lower leaves", "Need to buy more DAP")`}
              style={{
                flex: 1, width: '100%', minHeight: 180, padding: '12px', borderRadius: 8,
                border: '1px solid #d1d5db', outline: 'none', resize: 'vertical',
                fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Checklist */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ede7', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ Task Checklist
            </h3>
            
            <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                value={newChecklistItem}
                onChange={e => setNewChecklistItem(e.target.value)}
                placeholder="Add a new task..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none', fontSize: '0.875rem' }}
              />
              <button type="submit" style={{ padding: '0 16px', background: '#2d6a27', color: '#fff', fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Add
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 200 }}>
              {(checklists[activePlot] || []).length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>
                  No tasks added yet.
                </div>
              ) : (
                (checklists[activePlot] || []).map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklist(item.id)}
                      style={{ width: 18, height: 18, accentColor: '#2d6a27', cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, fontSize: '0.875rem', color: item.completed ? '#9ca3af' : '#374151', textDecoration: item.completed ? 'line-through' : 'none' }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => deleteChecklist(item.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.7 }}
                      onMouseOver={e => e.currentTarget.style.opacity = '1'}
                      onMouseOut={e => e.currentTarget.style.opacity = '0.7'}
                      title="Delete Task"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Add/Edit Plot Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => { setShowAddModal(false); setEditingPlotId(null); }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                {editingPlotId ? 'Edit Plot Details' : 'Add New Plot'}
              </h3>
              {editingPlotId && (
                <button type="button" onClick={handleDeletePlot} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                  Delete Plot
                </button>
              )}
            </div>
            
            <form onSubmit={handleAddPlot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Plot Name (e.g., Field A)</label>
                <input required value={newPlot.name} onChange={e => setNewPlot({...newPlot, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} placeholder="Field A" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Crop Type</label>
                <input required value={newPlot.crop} onChange={e => setNewPlot({...newPlot, crop: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} placeholder="e.g., Cotton" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Location (City)</label>
                <input required value={newPlot.city} onChange={e => setNewPlot({...newPlot, city: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} placeholder="e.g., Bhopal" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Area (Acres) - Optional</label>
                <input type="number" step="0.1" value={newPlot.area} onChange={e => setNewPlot({...newPlot, area: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} placeholder="1.5" />
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => { setShowAddModal(false); setEditingPlotId(null); }} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ width: '100%', padding: '12px', background: '#2d6a27', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Save Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
      ) : (
        /* CROP CALENDAR VIEW */
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>कृषि पंचांग (Crop Calendar)</h2>
            <p style={{ color: '#4b5563' }}>Standard seasonal cycles and major sowing milestones for India.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Kharif */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ede7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
              <div style={{ background: '#ecfdf5', padding: '20px', borderBottom: '2px solid #a7f3d0' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🌦️ Kharif Season
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#047857', margin: 0, fontWeight: 600 }}>Monsoon (June - October)</p>
              </div>
              <div style={{ padding: '20px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🍚 Rice (Paddy)</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Jun-Jul | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> Sep-Oct</div>
                  </li>
                  <li style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🌽 Maize</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Jun-Jul | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> Sep-Oct</div>
                  </li>
                  <li style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🧶 Cotton</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> May-Jun | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> Oct-Nov</div>
                  </li>
                  <li style={{ padding: '12px 0' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🌱 Soybean</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Jun-Jul | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> Sep-Oct</div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Rabi */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ede7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
              <div style={{ background: '#eff6ff', padding: '20px', borderBottom: '2px solid #bfdbfe' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ❄️ Rabi Season
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#1d4ed8', margin: 0, fontWeight: 600 }}>Winter (October - March)</p>
              </div>
              <div style={{ padding: '20px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🌾 Wheat</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Oct-Nov | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> Mar-Apr</div>
                  </li>
                  <li style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🌼 Mustard</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Oct-Nov | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> Feb-Mar</div>
                  </li>
                  <li style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🥔 Potato</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Oct-Nov | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> Feb-Mar</div>
                  </li>
                  <li style={{ padding: '12px 0' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🫘 Gram (Chana)</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Oct-Nov | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> Mar-Apr</div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Zaid */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ede7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
              <div style={{ background: '#fffbeb', padding: '20px', borderBottom: '2px solid #fde68a' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ☀️ Zaid Season
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#d97706', margin: 0, fontWeight: 600 }}>Summer (March - June)</p>
              </div>
              <div style={{ padding: '20px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🍉 Watermelon / Melons</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Feb-Mar | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> May-Jun</div>
                  </li>
                  <li style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🥒 Cucumber / Gourds</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Feb-Mar | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> May-Jun</div>
                  </li>
                  <li style={{ padding: '12px 0' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>🌿 Fodder Crops</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><span style={{ color: '#059669', fontWeight: 600 }}>Sow:</span> Mar-Apr | <span style={{ color: '#d97706', fontWeight: 600 }}>Harvest:</span> May-Jun</div>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
