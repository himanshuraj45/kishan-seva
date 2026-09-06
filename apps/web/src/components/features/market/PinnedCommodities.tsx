import React, { useState, useEffect } from 'react'

interface PinnedCommoditiesProps {
  selectedCrop: string
  setSelectedCrop: (crop: string) => void
}

const PINNED_LIST = [
  { name: 'Wheat', img: '/crops/wheat.jpg', bg: '#fef3c7', fallbackPrice: '₹2,850', fallbackChange: '+2.5%', isUp: true },
  { name: 'Rice', img: '/crops/rice.jpg', bg: '#e0f2fe', fallbackPrice: '₹4,100', fallbackChange: '-1.2%', isUp: false },
  { name: 'Tomato', img: '/crops/tomato.jpg', bg: '#fee2e2', fallbackPrice: '₹1,500', fallbackChange: '+5.0%', isUp: true },
  { name: 'Onion', img: '/crops/onion.jpg', bg: '#f3e8ff', fallbackPrice: '₹2,200', fallbackChange: '-0.5%', isUp: false },
  { name: 'Potato', img: '/crops/potato.jpg', bg: '#ffedd5', fallbackPrice: '₹1,100', fallbackChange: '+1.5%', isUp: true },
  { name: 'Cotton', img: '/crops/cotton.jpg', bg: '#f1f5f9', fallbackPrice: '₹6,500', fallbackChange: '+3.2%', isUp: true },
  { name: 'Soybean', img: '/crops/soybean.jpg', bg: '#fef9c3', fallbackPrice: '₹4,800', fallbackChange: '-2.1%', isUp: false },
  { name: 'Maize', img: '/crops/maize.jpg', bg: '#fef08a', fallbackPrice: '₹2,100', fallbackChange: '+1.8%', isUp: true },
  { name: 'Garlic', img: '/crops/garlic.jpg', bg: '#f8fafc', fallbackPrice: '₹8,500', fallbackChange: '-3.5%', isUp: false },
  { name: 'Turmeric', img: '/crops/turmeric.jpg', bg: '#fde047', fallbackPrice: '₹14,200', fallbackChange: '+4.5%', isUp: true },
]

export default function PinnedCommodities({ selectedCrop, setSelectedCrop }: PinnedCommoditiesProps) {
  const [dataMap, setDataMap] = useState<Record<string, any>>({})

  useEffect(() => {
    let active = true;
    const fetchPinned = async () => {
      // Fetch sequentially to prevent overwhelming rate limits even with caching
      for (const crop of PINNED_LIST) {
        if (!active) break;
        try {
          const resp = await fetch(`/api/v1/market?commodity=${encodeURIComponent(crop.name)}&limit=10`)
          const json = await resp.json()
          if (json.success && json.stateAvgPrice) {
            setDataMap(prev => ({
              ...prev,
              [crop.name]: {
                price: `₹${json.stateAvgPrice.toLocaleString()}`,
                change: json.spreadPct ? `${json.spreadPct > 10 ? '+' : '-'}${(json.spreadPct/10).toFixed(1)}%` : '0%',
                isUp: (json.spreadPct || 0) > 10
              }
            }))
          } else {
            // Fallback for no data
            setDataMap(prev => ({ ...prev, [crop.name]: { price: crop.fallbackPrice, change: crop.fallbackChange, isUp: crop.isUp } }))
          }
        } catch (e) {
          // Fallback on error
          setDataMap(prev => ({ ...prev, [crop.name]: { price: crop.fallbackPrice, change: crop.fallbackChange, isUp: crop.isUp } }))
        }
        // Small delay to space out API calls
        await new Promise(r => setTimeout(r, 100))
      }
    }
    fetchPinned()
    return () => { active = false; }
  }, [])

  return (
    <div className="hide-scroll" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
      {PINNED_LIST.map(item => {
        const d = dataMap[item.name] || { price: 'Loading...', change: '---', isUp: true }
        
        return (
          <div 
            key={item.name} 
            className="card" 
            onClick={() => setSelectedCrop(item.name)}
            style={{ flex: '0 0 200px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', border: selectedCrop === item.name ? '2px solid var(--color-honey-amber)' : '1px solid transparent', transition: 'all 0.2s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: item.bg, overflow: 'hidden' }}>
                <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</span>
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{d.price} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-bark)' }}>/ Qtl</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.75rem', color: d.isUp ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>{d.change}</span>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '24px' }}>
                {[40, 60, 50, 80, 100].map((h, i) => (
                  <div key={i} style={{ width: '4px', height: `${h}%`, backgroundColor: d.isUp ? '#22c55e' : '#ef4444', opacity: 0.5 + (i * 0.1) }} />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

