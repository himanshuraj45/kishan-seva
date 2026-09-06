"use client";

import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  Droplets, 
  Thermometer, 
  FlaskConical, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Signal
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// Helper for initial dummy data
const generateInitialData = () => {
  const data = [];
  const now = new Date();
  for (let i = 20; i >= 0; i--) {
    data.push({
      time: new Date(now.getTime() - i * 2000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
      moisture: 42 + Math.random() * 5 - 2.5,
      temperature: 24 + Math.random() * 2 - 1,
    });
  }
  return data;
};

export default function IoTDashboard() {
  const [isLive, setIsLive] = useState(true);
  const [data, setData] = useState(generateInitialData());
  
  // Current live values
  const [sensors, setSensors] = useState({
    moisture: 42.1,
    temperature: 24.3,
    ph: 6.8,
    nitrogen: 120,
    phosphorus: 45,
    potassium: 110,
    battery: 92,
    signal: -65 // dBm
  });

  // Simulated IoT Stream
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setSensors(prev => {
        const jitter = (val: number, maxVariance: number) => 
          Number((val + (Math.random() * maxVariance * 2 - maxVariance)).toFixed(1));
        
        const newMoisture = jitter(prev.moisture, 0.5);
        const newTemp = jitter(prev.temperature, 0.2);

        // Add to chart data
        setData(currentData => {
          const newData = [...currentData.slice(1), {
            time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
            moisture: newMoisture,
            temperature: newTemp,
          }];
          return newData;
        });

        return {
          moisture: newMoisture > 100 ? 100 : newMoisture < 0 ? 0 : newMoisture,
          temperature: newTemp,
          ph: jitter(prev.ph, 0.05),
          nitrogen: jitter(prev.nitrogen, 2),
          phosphorus: jitter(prev.phosphorus, 1),
          potassium: jitter(prev.potassium, 1.5),
          battery: prev.battery,
          signal: jitter(prev.signal, 2)
        };
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wifi className="w-6 h-6 text-[#2A854B]" />
            IoT Sensor Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">Live telemetry from Zone A (Smart Soil Node)</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">MQTT Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2.5 w-2.5">
                {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className={`text-sm font-bold ${isLive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isLive ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isLive ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={isLive ? "Pause Stream" : "Resume Stream"}
          >
            {isLive ? <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} /> : <Activity className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Moisture */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Optimal</span>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{sensors.moisture.toFixed(1)}<span className="text-lg text-slate-400 font-sans">%</span></div>
            <div className="text-sm font-medium text-slate-500 mt-1">Soil Moisture</div>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{sensors.temperature.toFixed(1)}<span className="text-lg text-slate-400 font-sans">°C</span></div>
            <div className="text-sm font-medium text-slate-500 mt-1">Soil Temp</div>
          </div>
        </div>

        {/* NPK */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group col-span-2 md:col-span-1">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{Math.round(sensors.nitrogen)}</div>
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{Math.round(sensors.phosphorus)}</div>
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{Math.round(sensors.potassium)}</div>
            </div>
            <div className="text-sm font-medium text-slate-500 mt-1">N-P-K (mg/kg)</div>
          </div>
        </div>

        {/* pH Level */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group col-span-2 md:col-span-1">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{sensors.ph.toFixed(2)}</div>
            <div className="text-sm font-medium text-slate-500 mt-1">pH Level</div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Live Telemetry Stream</h2>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span>Moisture</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span>Temperature</div>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 5', 'dataMax + 5']} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" isAnimationActive={false} />
              <Area yAxisId="right" type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NODE METADATA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Signal className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500 font-medium">Signal Strength</div>
              <div className="text-sm font-bold text-slate-700">{Math.round(sensors.signal)} dBm</div>
            </div>
          </div>
          <div className="h-2 w-8 bg-slate-200 rounded-full overflow-hidden flex items-end">
            <div className="h-full w-3/4 bg-emerald-500"></div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500 font-medium">Battery Level</div>
              <div className="text-sm font-bold text-slate-700">{sensors.battery}%</div>
            </div>
          </div>
          <div className="h-3 w-6 rounded-sm border-2 border-slate-400 relative">
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-1 h-1.5 bg-slate-400 rounded-r-sm"></div>
            <div className="h-full bg-emerald-500" style={{ width: `${sensors.battery}%` }}></div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs text-orange-800 font-bold mb-0.5">Irrigation Recommended</div>
            <div className="text-xs text-orange-700 leading-tight">Moisture dropping below 45%. Schedule irrigation in next 6 hours.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
