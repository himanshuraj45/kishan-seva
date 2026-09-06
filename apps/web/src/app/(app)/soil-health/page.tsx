'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FlaskConical, Upload, ScanLine, CheckCircle2, AlertTriangle,
  Leaf, Zap, Droplets, Activity, ChevronRight, RefreshCw,
  FileImage, Info, Calendar, ShoppingBag, TrendingUp, XCircle,
  Wifi, WifiOff, Bluetooth, Radio, Cpu, Wind, Thermometer,
  Gauge, Signal, Battery, PlugZap, CircleDot, Play, Pause
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import WebcamCapture from '@/components/WebcamCapture';

/* ─── Types ─────────────────────────────────────────────────── */
type Stage = 'upload' | 'scanning' | 'results' | 'error';
type MainTab = 'ocr' | 'sensors';
type SensorStatus = 'disconnected' | 'pairing' | 'connected' | 'live';

interface SoilMetric {
  name: string; value: number; unit: string;
  optimal: [number, number]; status: string; color: string;
}

interface FertilizerAction {
  week: string; action: string; product: string;
  quantity: string; icon: React.ReactNode; priority: 'high' | 'medium' | 'low';
}

interface SensorDevice {
  id: string; name: string; type: string;
  protocol: string; icon: React.ReactNode;
  status: SensorStatus; battery: number;
  readings: { label: string; value: number; unit: string; color: string; min: number; max: number }[];
}


/* ─── Helpers ────────────────────────────────────────────────── */
const statusColor = (s: string) => s === 'optimal' ? '#10b981' : '#ef4444';
const StatusBadge = ({ status }: { status: string }) => (
  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', backgroundColor: status === 'optimal' ? '#ecfdf5' : '#fef2f2', color: status === 'optimal' ? '#059669' : '#ef4444', border: `1px solid ${status === 'optimal' ? '#6ee7b7' : '#fca5a5'}` }}>
    {status === 'optimal' ? 'Optimal' : 'Deficient'}
  </span>
);

const ICON_FOR_INDEX = [<Droplets size={20} />, <Leaf size={20} />, <Zap size={20} />, <Activity size={20} />, <Leaf size={20} />];

const SCAN_STEPS = [
  'Initializing Computer Vision engine…',
  'Detecting Soil Health Card boundaries…',
  'Extracting text regions via OCR…',
  'Parsing N-P-K chemical values…',
  'Analyzing soil pH and micro-nutrients…',
  'Running AI recommendation engine…',
  'Generating personalized fertilizer schedule…',
];

/* ─── Sensor Devices ─────────────────────────────────────────── */
const INITIAL_SENSORS: SensorDevice[] = [
  {
    id: 's1', name: 'SoilSense Pro', type: 'Soil Probe', protocol: 'Bluetooth',
    icon: <FlaskConical size={22} color="#65a30d" />, status: 'disconnected', battery: 87,
    readings: [
      { label: 'Soil Moisture', value: 34.2, unit: '%', color: '#3b82f6', min: 0, max: 100 },
      { label: 'Soil Temperature', value: 28.7, unit: '°C', color: '#f59e0b', min: 10, max: 50 },
      { label: 'Soil EC', value: 1.42, unit: 'mS/cm', color: '#8b5cf6', min: 0, max: 5 },
      { label: 'Soil pH (Live)', value: 5.8, unit: '', color: '#ec4899', min: 3, max: 9 },
    ]
  },
  {
    id: 's2', name: 'AirGuard 360', type: 'Air Quality Monitor', protocol: 'WiFi',
    icon: <Wind size={22} color="#3b82f6" />, status: 'disconnected', battery: 63,
    readings: [
      { label: 'PM2.5 Particles', value: 18.4, unit: 'µg/m³', color: '#ef4444', min: 0, max: 150 },
      { label: 'CO₂ Level', value: 412, unit: 'ppm', color: '#f97316', min: 300, max: 1000 },
      { label: 'Humidity', value: 68.3, unit: '%', color: '#06b6d4', min: 0, max: 100 },
      { label: 'Air Temperature', value: 31.2, unit: '°C', color: '#f59e0b', min: 0, max: 50 },
    ]
  },
  {
    id: 's3', name: 'WeatherNode X1', type: 'Weather Station', protocol: 'LoRa',
    icon: <Thermometer size={22} color="#f97316" />, status: 'disconnected', battery: 95,
    readings: [
      { label: 'Rainfall', value: 4.2, unit: 'mm/h', color: '#06b6d4', min: 0, max: 50 },
      { label: 'Wind Speed', value: 12.6, unit: 'km/h', color: '#6366f1', min: 0, max: 100 },
      { label: 'UV Index', value: 7.2, unit: '', color: '#eab308', min: 0, max: 12 },
      { label: 'Ambient Temp', value: 33.1, unit: '°C', color: '#f59e0b', min: -10, max: 55 },
    ]
  },
  {
    id: 's4', name: 'NutriScan Mini', type: 'NPK Sensor', protocol: 'Bluetooth',
    icon: <Cpu size={22} color="#8b5cf6" />, status: 'disconnected', battery: 42,
    readings: [
      { label: 'Nitrogen (N)', value: 118, unit: 'kg/ha', color: '#3b82f6', min: 0, max: 400 },
      { label: 'Phosphorus (P)', value: 22, unit: 'kg/ha', color: '#8b5cf6', min: 0, max: 100 },
      { label: 'Potassium (K)', value: 177, unit: 'kg/ha', color: '#f59e0b', min: 0, max: 400 },
      { label: 'Organic Matter', value: 0.51, unit: '%', color: '#10b981', min: 0, max: 5 },
    ]
  },
];

/* ─── Gauge Bar ─────────────────────────────────────────────── */
const GaugeBar = ({ metric }: { metric: SoilMetric }) => {
  const max = metric.optimal[1] * 1.5;
  const pct = Math.min((metric.value / max) * 100, 100);
  const optLo = (metric.optimal[0] / max) * 100;
  const optHi = (metric.optimal[1] / max) * 100;
  const c = statusColor(metric.status);
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: metric.color }} />
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{metric.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 700, color: c, fontSize: '1.1rem' }}>{metric.value}{metric.unit && ` ${metric.unit}`}</span>
          <StatusBadge status={metric.status} />
        </div>
      </div>
      <div style={{ position: 'relative', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: `${optLo}%`, width: `${optHi - optLo}%`, top: 0, bottom: 0, backgroundColor: 'rgba(16,185,129,0.15)', borderLeft: '2px dashed #10b981', borderRight: '2px dashed #10b981' }} />
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, top: 0, bottom: 0, backgroundColor: c, borderRadius: '6px', transition: 'width 1s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>
        <span>0</span>
        <span style={{ color: '#10b981' }}>Optimal: {metric.optimal[0]}–{metric.optimal[1]} {metric.unit}</span>
        <span>{(max).toFixed(0)}{metric.unit ? ` ${metric.unit}` : ''}</span>
      </div>
    </div>
  );
};

/* ─── Mini Gauge for sensor readings ──────────────────────── */
const SensorGauge = ({ reading }: { reading: SensorDevice['readings'][0] }) => {
  const pct = Math.min(((reading.value - reading.min) / (reading.max - reading.min)) * 100, 100);
  return (
    <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{reading.label}</span>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: reading.color }}>{reading.value}{reading.unit}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: reading.color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
};

/* ─── Pulsing dot ────────────────────────────────────────────── */
const LiveDot = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>LIVE</span>
  </span>
);

/* ─── Protocol Badge ──────────────────────────────────────── */
const ProtocolBadge = ({ protocol }: { protocol: string }) => {
  const map: Record<string, [string, string, React.ReactNode]> = {
    'Bluetooth': ['#eff6ff', '#3b82f6', <Bluetooth size={12} />],
    'WiFi': ['#f0fdf4', '#10b981', <Wifi size={12} />],
    'LoRa': ['#fdf4ff', '#a855f7', <Radio size={12} />],
  };
  const [bg, color, icon] = map[protocol] || ['#f1f5f9', '#64748b', <Signal size={12} />];
  return (
    <span style={{ backgroundColor: bg, color, border: `1px solid ${color}`, borderRadius: '20px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {icon} {protocol}
    </span>
  );
};

/* ─── Initial Chart Data ─── */
const generateInitialData = () => {
  const data = [];
  const now = new Date();
  for (let i = 20; i >= 0; i--) {
    data.push({
      time: new Date(now.getTime() - i * 2000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
      moisture: +(42 + Math.random() * 5 - 2.5).toFixed(1),
      temperature: +(24 + Math.random() * 2 - 1).toFixed(1),
    });
  }
  return data;
};

/* ─── Main Page ─────────────────────────────────────────────── */
export default function SoilHealthPage() {
  const [mainTab, setMainTab] = useState<MainTab>('ocr');

  // OCR state
  const [stage, setStage] = useState<Stage>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Real AI results state
  const [soilMetrics, setSoilMetrics] = useState<SoilMetric[]>([]);
  const [fertSchedule, setFertSchedule] = useState<FertilizerAction[]>([]);
  const [aiDiagnosis, setAiDiagnosis] = useState('');
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [overallHealthVal, setOverallHealthVal] = useState(0);
  const [apiError, setApiError] = useState('');

  // Sensor state
  const [sensors, setSensors] = useState<SensorDevice[]>(INITIAL_SENSORS);
  const [liveValues, setLiveValues] = useState<Record<string, number[]>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [chartData, setChartData] = useState<any[]>(generateInitialData());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── OCR handlers ─── */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      setUploadedImage(e.target?.result as string);
      startScan(file);
    };
    reader.readAsDataURL(file);
  }, []);

  const startScan = (file: File) => {
    setStage('scanning'); setScanStep(0); setScanPct(0); setApiError('');
    let step = 0;
    const total = SCAN_STEPS.length;

    // Run the UI steps animation
    const uiInterval = setInterval(() => {
      step++;
      setScanStep(s => s + 1);
      setScanPct(Math.round((step / total) * 100));
      if (step >= total) clearInterval(uiInterval);
    }, 500);

    // Simultaneously call real Gemini Vision API
    const formData = new FormData();
    formData.append('image', file);

    fetch('/api/v1/soil-ocr', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(res => {
        clearInterval(uiInterval);
        if (!res.success) throw new Error(res.error || 'Analysis failed');
        const d = res.data;

        // Map API metrics to component format
        const metrics: SoilMetric[] = (d.metrics || []).map((m: any) => ({
          name: m.name,
          value: m.value,
          unit: m.unit,
          optimal: [m.optimal_low, m.optimal_high] as [number, number],
          status: m.status,
          color: m.color,
        }));

        // Map schedule
        const schedule: FertilizerAction[] = (d.schedule || []).map((s: any, i: number) => ({
          week: s.week,
          action: s.action,
          product: s.product,
          quantity: s.quantity,
          priority: s.priority,
          icon: ICON_FOR_INDEX[i % ICON_FOR_INDEX.length],
        }));

        setSoilMetrics(metrics);
        setFertSchedule(schedule);
        setAiDiagnosis(d.diagnosis || '');
        setAiTags(d.tags || []);
        setOverallHealthVal(d.overallHealth ?? 0);
        setScanPct(100);
        setScanStep(SCAN_STEPS.length);

        // Persist last soil scan for dashboard sync
        try {
          const phMetric = metrics.find((m: any) => m.label?.toLowerCase().includes('ph'));
          const nMetric = metrics.find((m: any) => m.label?.toLowerCase().includes('nitrogen') || m.label === 'N');
          localStorage.setItem('kisanseva_last_soil', JSON.stringify({
            ph: phMetric?.value ?? null,
            nitrogen: nMetric?.value ?? null,
            overallHealth: d.overallHealth,
            recommendation: d.diagnosis?.split('.')[0] || '',
            timestamp: new Date().toISOString()
          }));
        } catch (e) {}

        setTimeout(() => setStage('results'), 600);
      })
      .catch(err => {
        clearInterval(uiInterval);
        setApiError(err.message || 'Something went wrong. Please try again.');
        setStage('error');
      });
  };

  const reset = () => {
    setStage('upload');
    setUploadedImage(null);
    setUploadedFile(null);
    setScanStep(0);
    setScanPct(0);
    setApiError('');
    setSoilMetrics([]);
    setFertSchedule([]);
    setAiDiagnosis('');
    setAiTags([]);
    setOverallHealthVal(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  /* ─── Sensor connect ─── */
  const connectSensor = async (id: string) => {
    const sensor = sensors.find(s => s.id === id);
    if (!sensor) return;

    // 1. Set state to pairing (UI shows spinner)
    setSensors(prev => prev.map(s => s.id === id ? { ...s, status: 'pairing' } : s));

    // Simulate realistic hardware connection delay
    setTimeout(() => {
      // 2. Change status to 'connected' (handshake phase)
      setSensors(prev => prev.map(s => s.id === id ? { ...s, status: 'connected' } : s));
      
      // 3. Finalize connection after handshake
      setTimeout(() => {
        finishConnection(id);
      }, 1200);
    }, 1800);
  };

  const finishConnection = (id: string) => {
    setSensors(prev => prev.map(s => s.id === id ? { ...s, status: 'live' } : s));
    const sensor = INITIAL_SENSORS.find(s => s.id === id)!;
    setLiveValues(prev => ({ ...prev, [id]: sensor.readings.map(r => r.value) }));
    
    // Auto-start streaming to make it feel "real" instantly
    if (!isStreaming) {
      toggleStreaming();
    }
  };

  const disconnectSensor = (id: string) => {
    setSensors(prev => prev.map(s => s.id === id ? { ...s, status: 'disconnected' } : s));
    setLiveValues(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  /* ─── Live streaming ─── */
  const toggleStreaming = () => {
    if (isStreaming) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
      intervalRef.current = setInterval(() => {
        setLiveValues(prev => {
          const next = { ...prev };
          let s1Moisture = 0;
          let s1Temp = 0;
          
          Object.keys(prev).forEach(sid => {
            const sensorDef = INITIAL_SENSORS.find(s => s.id === sid);
            if (sensorDef) {
              next[sid] = sensorDef.readings.map((r, i) => {
                const jitter = (Math.random() - 0.5) * (r.max - r.min) * 0.02;
                return Math.max(r.min, Math.min(r.max, +(prev[sid][i] + jitter).toFixed(2)));
              });
              
              if (sid === 's1') {
                s1Moisture = next[sid][0];
                s1Temp = next[sid][1];
              }
            }
          });
          
          if (s1Moisture > 0) {
            setChartData(currentData => {
              return [...currentData.slice(1), {
                time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
                moisture: s1Moisture,
                temperature: s1Temp,
              }];
            });
          }
          
          return next;
        });
      }, 1500);
    }
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const connectedCount = sensors.filter(s => s.status === 'live').length;
  const deficientCount = soilMetrics.filter(m => m.status === 'low').length;
  const overallHealth = overallHealthVal;

  return (
    <div style={{ backgroundColor: '#f0fdf4', minHeight: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} } @keyframes spin { to { transform:rotate(360deg) } }`}</style>
      
      {showWebcam && (
        <WebcamCapture 
          onCapture={(file) => {
            setShowWebcam(false);
            handleFile(file);
          }}
          onCancel={() => setShowWebcam(false)}
        />
      )}

      <main style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Header ── */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: '24px', borderTop: '4px solid #65a30d', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '50%', flexShrink: 0 }}>
            <FlaskConical size={44} color="#65a30d" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '1.875rem', fontWeight: 800, color: '#1e293b' }}>Soil & Environment Health</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Upload a Soil Health Card for instant OCR analysis, or connect IoT sensors for real-time soil, air, and weather data.
            </p>
          </div>
          {connectedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ecfdf5', padding: '8px 16px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
              <LiveDot />
              <span style={{ fontWeight: 600, color: '#065f46', fontSize: '0.875rem' }}>{connectedCount} sensor{connectedCount > 1 ? 's' : ''} live</span>
            </div>
          )}
        </div>

        {/* ── Main Tabs ── */}
        <div style={{ display: 'flex', gap: '0', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <button onClick={() => setMainTab('ocr')} style={{ flex: 1, padding: '14px 24px', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', borderRight: '1px solid #e2e8f0', backgroundColor: mainTab === 'ocr' ? '#65a30d' : '#fff', color: mainTab === 'ocr' ? '#fff' : '#64748b' }}>
            <ScanLine size={18} /> Soil Card OCR
          </button>
          <button onClick={() => setMainTab('sensors')} style={{ flex: 1, padding: '14px 24px', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', backgroundColor: mainTab === 'sensors' ? '#65a30d' : '#fff', color: mainTab === 'sensors' ? '#fff' : '#64748b' }}>
            <PlugZap size={18} /> Connect Equipment {connectedCount > 0 && <span style={{ backgroundColor: '#fff', color: '#65a30d', borderRadius: '999px', padding: '1px 7px', fontSize: '0.75rem', fontWeight: 800 }}>{connectedCount}</span>}
          </button>
        </div>

        {/* ══════════════ OCR TAB ══════════════ */}
        {mainTab === 'ocr' && (
          <>
            {/* Steps indicator */}
            <div style={{ display: 'flex', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              {['1. Upload Card', '2. AI Analysis', '3. Results'].map((label, i) => {
                const stageIdx = stage === 'upload' ? 0 : stage === 'scanning' ? 1 : 2;
                const isActive = stageIdx === i, isDone = stageIdx > i;
                return (
                  <div key={i} style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: isActive ? '#65a30d' : isDone ? '#f0fdf4' : '#fff', color: isActive ? '#fff' : isDone ? '#65a30d' : '#94a3b8', fontWeight: 600, fontSize: '0.875rem', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none', transition: 'all 0.3s' }}>
                    {isDone ? <CheckCircle2 size={16} /> : <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${isActive ? '#fff' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{i + 1}</span>}
                    {label}
                  </div>
                );
              })}
            </div>

            {/* ── UPLOAD ── */}
            {stage === 'upload' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div onClick={() => fileRef.current?.click()} onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} style={{ backgroundColor: dragOver ? '#f0fdf4' : '#fff', border: `2px dashed ${dragOver ? '#65a30d' : '#cbd5e1'}`, borderRadius: '16px', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', minHeight: '320px' }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '50%' }}><Upload size={40} color="#65a30d" /></div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: '1.25rem', color: '#1e293b' }}>Upload Your Soil Health Card</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Drag & drop or click to browse.<br />Accepts JPG, PNG, or any photo.</p>
                  </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} style={{ backgroundColor: '#65a30d', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileImage size={18} /> Upload Image
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.capture = 'environment';
                            input.onchange = (evt: any) => evt.target.files?.[0] && handleFile(evt.target.files[0]);
                            input.click();
                          } else {
                            setShowWebcam(true);
                          }
                        }} 
                        style={{ backgroundColor: '#fff', color: '#65a30d', border: '2px solid #65a30d', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg> Take Photo
                      </button>
                    </div>
                  </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', flex: 1 }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={20} color="#65a30d" /> How It Works</h3>
                    {[['Upload', 'Take a clear photo of your Soil Health Card (front side)'], ['Scan', 'Our AI reads the N, P, K, pH and other values automatically'], ['Translate', 'Complex chemistry converted to plain farmer-friendly language'], ['Schedule', 'Get a week-by-week fertilizer plan tailored to your soil']].map(([title, desc], i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#65a30d', color: '#fff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                        <div><p style={{ margin: '0 0 2px 0', fontWeight: 600, color: '#1e293b' }}>{title}</p><p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>{desc}</p></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ backgroundColor: '#fefce8', borderRadius: '12px', padding: '16px', border: '1px solid #fde047', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} color="#ca8a04" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', lineHeight: 1.6 }}><strong>Powered by Gemini Vision AI:</strong> Upload a clear, well-lit photo of your physical Soil Health Card. The AI will read the values and generate a personalised report.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── SCANNING ── */}
            {stage === 'scanning' && (
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', aspectRatio: '4/3', backgroundColor: '#f8fafc' }}>
                  {uploadedImage && <img src={uploadedImage} alt="Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(101,163,13,0.08)' }} />
                  <div style={{ position: 'absolute', left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #65a30d, #84cc16, #65a30d, transparent)', boxShadow: '0 0 12px 3px rgba(101,163,13,0.5)', top: `${scanPct}%`, transition: 'top 0.4s ease' }} />
                  {[0, 1, 2, 3].map(i => <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...(i === 0 ? { top: 8, left: 8, borderTop: '3px solid #65a30d', borderLeft: '3px solid #65a30d' } : i === 1 ? { top: 8, right: 8, borderTop: '3px solid #65a30d', borderRight: '3px solid #65a30d' } : i === 2 ? { bottom: 8, left: 8, borderBottom: '3px solid #65a30d', borderLeft: '3px solid #65a30d' } : { bottom: 8, right: 8, borderBottom: '3px solid #65a30d', borderRight: '3px solid #65a30d' }) }} />)}
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ScanLine size={14} color="#84cc16" /><span style={{ color: '#84cc16' }}>OCR Engine Active</span> — {scanPct}%
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 24px 0', color: '#1e293b', fontSize: '1.375rem', fontWeight: 700 }}>Analyzing Your Soil Card</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {SCAN_STEPS.map((step, i) => {
                      const done = i < scanStep, active = i === scanStep - 1;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: i >= scanStep ? 0.35 : 1, transition: 'opacity 0.3s' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: done ? '#65a30d' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {done ? <CheckCircle2 size={14} color="#fff" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: active ? '#ca8a04' : '#94a3b8' }} />}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: done ? '#1e293b' : '#64748b', fontWeight: done ? 600 : 400 }}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ backgroundColor: '#f1f5f9', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${scanPct}%`, backgroundImage: 'linear-gradient(90deg, #65a30d, #84cc16)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', color: '#64748b', textAlign: 'right' }}>{scanPct}% complete</p>
                </div>
              </div>
            )}

            {/* ── ERROR ── */}
            {stage === 'error' && (
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '48px 32px', textAlign: 'center', border: '1px solid #fca5a5' }}>
                <div style={{ backgroundColor: '#fef2f2', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <XCircle size={36} color="#ef4444" />
                </div>
                <h3 style={{ margin: '0 0 10px', color: '#1e293b', fontWeight: 700, fontSize: '1.25rem' }}>Analysis Failed</h3>
                <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>{apiError || 'The AI could not read your image. Please ensure it is a clear, well-lit photo of your Soil Health Card.'}</p>
                <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '8px', border: 'none', backgroundColor: '#65a30d', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            )}

            {/* ── RESULTS ── */}
            {stage === 'results' && soilMetrics.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {[
                    { label: 'Overall Health', value: `${overallHealth}%`, sub: 'of nutrients optimal', color: overallHealth >= 60 ? '#10b981' : overallHealth >= 40 ? '#f59e0b' : '#ef4444', icon: <Activity size={24} color={overallHealth >= 60 ? '#10b981' : '#f59e0b'} /> },
                    { label: 'Deficiencies', value: deficientCount, sub: 'nutrients need attention', color: deficientCount > 2 ? '#ef4444' : '#f59e0b', icon: <XCircle size={24} color="#ef4444" /> },
                    { label: 'Soil pH', value: soilMetrics.find(m => m.name === 'Soil pH')?.value ?? '—', sub: (soilMetrics.find(m => m.name === 'Soil pH')?.status === 'optimal') ? 'Optimal range' : 'Needs correction', color: '#ec4899', icon: <Droplets size={24} color="#ec4899" /> },
                    { label: 'Actions Required', value: fertSchedule.length, sub: 'steps in your plan', color: '#65a30d', icon: <Calendar size={24} color="#65a30d" /> },
                  ].map((card, i) => (
                    <div key={i} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</span>{card.icon}</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>{card.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><FlaskConical size={22} color="#65a30d" /> Soil Metrics</h2>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#f0fdf4', color: '#65a30d', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>✦ Gemini AI Verified</span>
                    </div>
                    {soilMetrics.map(m => <GaugeBar key={m.name} metric={m} />)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '24px', color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ backgroundColor: '#65a30d', borderRadius: '8px', padding: '8px' }}><TrendingUp size={20} color="#fff" /></div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>AI Diagnosis</h3>
                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', backgroundColor: 'rgba(101,163,13,0.3)', color: '#86efac', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Real AI</span>
                      </div>
                      <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>{aiDiagnosis}</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{aiTags.map(tag => <span key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem' }}>{tag}</span>)}</div>
                    </div>
                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', flex: 1 }}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={20} color="#65a30d" /> Fertilizer Schedule</h3>
                      {fertSchedule.map((item, i) => {
                        const priorityColors: Record<string, [string, string]> = { high: ['#fef2f2', '#ef4444'], medium: ['#fffbeb', '#f59e0b'], low: ['#f0fdf4', '#65a30d'] };
                        const [bg, fg] = priorityColors[item.priority] || ['#f0fdf4', '#65a30d'];
                        return (
                          <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: i < fertSchedule.length - 1 ? '16px' : 0, alignItems: 'flex-start' }}>
                            <div style={{ backgroundColor: bg, color: fg, padding: '10px', borderRadius: '10px', flexShrink: 0 }}>{item.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{item.action}</span>
                                <span style={{ fontSize: '0.75rem', backgroundColor: bg, color: fg, padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>{item.week}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}><ShoppingBag size={13} /> {item.product}</span>
                                <span style={{ fontSize: '0.85rem', color: '#65a30d', fontWeight: 600 }}>→ {item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', color: '#475569', fontWeight: 600 }}><RefreshCw size={16} /> Scan Another Card</button>
                  <button 
                    onClick={() => {
                      const btn = document.getElementById('save-btn');
                      if(btn) {
                        btn.innerHTML = '✓ Saved Successfully!';
                        btn.style.backgroundColor = '#15803d';
                        setTimeout(() => {
                          btn.innerHTML = 'Save Report to My Farm';
                          btn.style.backgroundColor = '#65a30d';
                        }, 3000);
                      }
                    }}
                    id="save-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '8px', border: 'none', backgroundColor: '#65a30d', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.3s' }}
                  >
                    <ChevronRight size={18} /> Save Report to My Farm
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════ SENSORS TAB ══════════════ */}
        {mainTab === 'sensors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Gauge size={20} color="#65a30d" />
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{connectedCount} of {sensors.length} sensors connected</span>
                {connectedCount > 0 && <LiveDot />}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {connectedCount > 0 && (
                  <button onClick={toggleStreaming} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: isStreaming ? '#ef4444' : '#65a30d', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                    {isStreaming ? <><Pause size={16} /> Stop Stream</> : <><Play size={16} /> Start Live Stream</>}
                  </button>
                )}
              </div>
            </div>
            
            {/* Live Chart (Only shows if SoilSense Pro s1 is connected) */}
            {sensors.find(s => s.id === 's1')?.status === 'live' && (
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>Live Telemetry: Zone A</h2>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} /> Soil Moisture</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f43f5e' }} /> Temperature</div>
                  </div>
                </div>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }} />
                      <Area yAxisId="left" type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" isAnimationActive={false} />
                      <Area yAxisId="right" type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sensor cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {sensors.map(sensor => {
                const live = liveValues[sensor.id];
                const isLive = sensor.status === 'live';
                const isPairing = sensor.status === 'pairing' || sensor.status === 'connected';

                return (
                  <div key={sensor.id} style={{ backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${isLive ? '#bbf7d0' : '#e2e8f0'}`, overflow: 'hidden', boxShadow: isLive ? '0 0 0 2px rgba(101,163,13,0.15)' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.3s' }}>

                    {/* Card Header */}
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isLive ? '#f0fdf4' : '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ backgroundColor: isLive ? '#dcfce7' : '#f8fafc', padding: '10px', borderRadius: '10px' }}>{sensor.icon}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>{sensor.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{sensor.type}</span>
                            <ProtocolBadge protocol={sensor.protocol} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        {isLive ? (
                          <>
                            <LiveDot />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                              <Battery size={13} /> {sensor.battery}%
                            </div>
                          </>
                        ) : isPairing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 600, fontSize: '0.8rem' }}>
                            <div style={{ width: '14px', height: '14px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            {sensor.status === 'pairing' ? 'Pairing…' : 'Connecting…'}
                          </div>
                        ) : (
                          <WifiOff size={18} color="#94a3b8" />
                        )}
                      </div>
                    </div>

                    {/* Readings grid */}
                    <div style={{ padding: '20px 24px' }}>
                      {isLive ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                          {sensor.readings.map((r, ri) => (
                            <SensorGauge key={ri} reading={{ ...r, value: live?.[ri] ?? r.value }} />
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                          {sensor.readings.map((r, ri) => (
                            <div key={ri} style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px dashed #cbd5e1' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{r.label}</span>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8' }}>-- {r.unit}</span>
                              </div>
                              <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Connect / Disconnect button */}
                      {isLive ? (
                        <button onClick={() => disconnectSensor(sensor.id)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <WifiOff size={16} /> Disconnect Sensor
                        </button>
                      ) : isPairing ? (
                        <button disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed', color: '#c2410c', fontWeight: 600, fontSize: '0.875rem', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{ width: '14px', height: '14px', border: '2px solid #c2410c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Establishing connection…
                        </button>
                      ) : (
                        <button onClick={() => connectSensor(sensor.id)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#65a30d', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <PlugZap size={16} /> Connect {sensor.protocol === 'Bluetooth' ? 'via Bluetooth' : sensor.protocol === 'WiFi' ? 'via WiFi' : 'via LoRa'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alert banner if something needs attention */}
            {connectedCount > 0 && (
              <div style={{ backgroundColor: '#fffbeb', borderRadius: '12px', padding: '16px 24px', border: '1px solid #fde047', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <AlertTriangle size={20} color="#ca8a04" style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ fontWeight: 700, color: '#92400e' }}>Live Alert: </span>
                  <span style={{ color: '#92400e', fontSize: '0.9rem' }}>SoilSense Pro is detecting soil moisture below 30%. Consider irrigation in the next 24 hours to prevent crop stress.</span>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

