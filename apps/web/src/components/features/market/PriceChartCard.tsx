/**
 * @file src/components/features/market/PriceChartCard.tsx
 * @description 7-day price trend chart card using Recharts. Displays historical and forecasted commodity prices.
 */
'use client';

import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { Sparkles } from 'lucide-react';

interface PriceChartCardProps {
  selectedCrop: string
  selectedState: string
  chartData: any[]
  forecastData?: any[]
  aiRecommendation?: string
}

export default function PriceChartCard({ selectedCrop, selectedState, chartData, forecastData, aiRecommendation }: PriceChartCardProps) {
  const [view, setView] = useState<'historical' | 'forecast'>('historical');
  
  const displayData = view === 'historical' ? chartData : (forecastData || chartData);
  const isForecast = view === 'forecast';

  return (
    <div className="card" style={{ padding: '24px' }}>
      
      {aiRecommendation && (
        <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'linear-gradient(to right, #f3e8ff, #e0e7ff)', border: '1px solid #c7d2fe', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ backgroundColor: '#8b5cf6', padding: '8px', borderRadius: '8px', color: 'white' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.875rem', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Price Forecast</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#3730a3', fontWeight: 500, lineHeight: '1.4' }}>{aiRecommendation}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.25rem' }}>
          {isForecast ? 'Predicted Trends (Next 60 Days)' : 'Price Trends (Last 30 Days)'} - {selectedCrop}
        </h2>
        
        {forecastData && (
          <div style={{ display: 'flex', backgroundColor: 'var(--color-bone)', padding: '4px', borderRadius: '8px' }}>
            <button 
              onClick={() => setView('historical')}
              style={{ 
                padding: '6px 12px', fontSize: '0.875rem', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: !isForecast ? '#fff' : 'transparent',
                color: !isForecast ? 'var(--color-saddle)' : 'var(--color-bark)',
                boxShadow: !isForecast ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Historical
            </button>
            <button 
              onClick={() => setView('forecast')}
              style={{ 
                padding: '6px 12px', fontSize: '0.875rem', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px',
                backgroundColor: isForecast ? '#fff' : 'transparent',
                color: isForecast ? '#6d28d9' : 'var(--color-bark)',
                boxShadow: isForecast ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Sparkles size={14} /> Forecast
            </button>
          </div>
        )}
      </div>

      <div style={{ height: '300px', width: '100%', marginTop: '16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorModal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isForecast ? "#8b5cf6" : "#22c55e"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={isForecast ? "#8b5cf6" : "#22c55e"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              tickLine={false} 
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(val) => `â‚¹${val}`}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              formatter={(value: any, name: any) => [`â‚¹${value}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
            />
            <Area type="monotone" dataKey="max" stroke={isForecast ? "#c084fc" : "#ef4444"} fill="none" strokeDasharray="5 5" />
            <Area type="monotone" dataKey="min" stroke={isForecast ? "#a78bfa" : "#3b82f6"} fill="none" strokeDasharray="5 5" />
            <Area type="monotone" dataKey="modal" stroke={isForecast ? "#8b5cf6" : "#22c55e"} strokeWidth={3} fillOpacity={1} fill="url(#colorModal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginTop: '16px', fontSize: '0.875rem', color: 'var(--color-saddle)', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '2px', backgroundColor: isForecast ? '#a78bfa' : '#3b82f6', borderTop: `2px dashed ${isForecast ? '#a78bfa' : '#3b82f6'}` }} /> 
          Minimum
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '4px', backgroundColor: isForecast ? '#8b5cf6' : '#22c55e' }} /> 
          Modal Average
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '2px', backgroundColor: isForecast ? '#c084fc' : '#ef4444', borderTop: `2px dashed ${isForecast ? '#c084fc' : '#ef4444'}` }} /> 
          Maximum
        </div>
      </div>
    </div>
  )
}


