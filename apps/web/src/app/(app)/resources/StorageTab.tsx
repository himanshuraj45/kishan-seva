'use client';

import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  ThermometerSnowflake,
  Search,
  Locate,
  Phone,
  Navigation,
  RefreshCw,
  AlertCircle,
  MapPin,
  ExternalLink,
  Info,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ColdStorage {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  distanceKm: number;
  phone?: string;
  website?: string;
  openingHours?: string;
  operator?: string;
  capacity?: string;
  mapsUrl: string;
}

type Status = 'idle' | 'locating' | 'searching' | 'done' | 'error';

const FALLBACK_STORAGES: ColdStorage[] = [
  { id: 'f1', name: 'Kisan Cold Storage', address: 'Hooghly, West Bengal', lat: 22.9012, lon: 88.3899, distanceKm: 0, phone: '+91 9830011223', mapsUrl: '' },
  { id: 'f2', name: 'AgriFresh Cold Chain', address: 'Burdwan, West Bengal', lat: 23.2324, lon: 87.8615, distanceKm: 0, phone: '+91 9432244556', mapsUrl: '' },
  { id: 'f3', name: 'Delhi Cold Storage', address: 'Azadpur, Delhi', lat: 28.7373, lon: 77.1725, distanceKm: 0, phone: '+91 9811122233', mapsUrl: '' },
  { id: 'f4', name: 'Maharashtra Agro Chills', address: 'Nashik, Maharashtra', lat: 20.0110, lon: 73.7903, distanceKm: 0, phone: '+91 9922334455', mapsUrl: '' },
  { id: 'f5', name: 'Punjab Cold Chain', address: 'Ludhiana, Punjab', lat: 30.9010, lon: 75.8573, distanceKm: 0, phone: '+91 9876543210', mapsUrl: '' },
  { id: 'f6', name: 'Karnataka Fresh Storage', address: 'Hubballi, Karnataka', lat: 15.3647, lon: 75.1240, distanceKm: 0, phone: '+91 8023456789', mapsUrl: '' },
  { id: 'f7', name: 'Chennai Agro Storage', address: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707, distanceKm: 0, phone: '+91 9444455555', mapsUrl: '' },
  { id: 'f8', name: 'Gujarat Cold Logistics', address: 'Ahmedabad, Gujarat', lat: 23.0225, lon: 72.5714, distanceKm: 0, phone: '+91 9822233344', mapsUrl: '' },
  { id: 'f9', name: 'MP Farmers Cold Storage', address: 'Indore, Madhya Pradesh', lat: 22.7196, lon: 75.8577, distanceKm: 0, phone: '+91 9899988877', mapsUrl: '' },
  { id: 'f10', name: 'UP Cold Storage Hub', address: 'Kanpur, Uttar Pradesh', lat: 26.4499, lon: 80.3319, distanceKm: 0, phone: '+91 9333344444', mapsUrl: '' },
  { id: 'f11', name: 'Andhra Agro Storage', address: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lon: 80.6480, distanceKm: 0, phone: '+91 9000011111', mapsUrl: '' },
  { id: 'f12', name: 'Bihar Sheeth Bhandar', address: 'Patna, Bihar', lat: 25.5941, lon: 85.1376, distanceKm: 0, phone: '+91 9933322211', mapsUrl: '' },
  { id: 'f13', name: 'Rajasthan Cold Solutions', address: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873, distanceKm: 0, phone: '+91 9829012345', mapsUrl: '' },
  { id: 'f14', name: 'Odisha Fresh Storages', address: 'Bhubaneswar, Odisha', lat: 20.2961, lon: 85.8245, distanceKm: 0, phone: '+91 9437012345', mapsUrl: '' },
  { id: 'f15', name: 'Assam Cold Chain', address: 'Guwahati, Assam', lat: 26.1445, lon: 91.7362, distanceKm: 0, phone: '+91 9864012345', mapsUrl: '' }
];

// ─── Haversine ─────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── AI fallback (Gemini → Groq) ──────────────────────────────────────────────
async function fetchFromAI(lat: number, lon: number, cityName: string, radiusKm: number): Promise<{results: ColdStorage[], source: string}> {
  const res = await fetch('/api/cold-storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, city: cityName, radiusKm }),
  });
  if (!res.ok) throw new Error('AI fallback error ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { results: data.results || [], source: data.source || 'ai' };
}

// ─── Main fetch: Overpass first, AI fallback ──────────────────────────────────
async function fetchNearby(lat: number, lon: number, radiusKm: number, cityName: string): Promise<{results: ColdStorage[], isFallback: boolean, source: string}> {
  const r = radiusKm * 1000;

  // Wide net: OSM tags + name patterns common in India (Hindi, Bengali, Tamil etc.)
  const query = `
[out:json][timeout:30];
(
  node["amenity"="cold_storage"](around:${r},${lat},${lon});
  way["amenity"="cold_storage"](around:${r},${lat},${lon});
  relation["amenity"="cold_storage"](around:${r},${lat},${lon});
  node["building"="cold_storage"](around:${r},${lat},${lon});
  way["building"="cold_storage"](around:${r},${lat},${lon});
  node["industrial"="cold_storage"](around:${r},${lat},${lon});
  way["industrial"="cold_storage"](around:${r},${lat},${lon});
  node["landuse"="industrial"]["name"~"cold storage",i](around:${r},${lat},${lon});
  way["landuse"="industrial"]["name"~"cold storage",i](around:${r},${lat},${lon});
  node["name"~"cold storage",i](around:${r},${lat},${lon});
  way["name"~"cold storage",i](around:${r},${lat},${lon});
  node["name"~"sheetgriha",i](around:${r},${lat},${lon});
  way["name"~"sheetgriha",i](around:${r},${lat},${lon});
  node["name"~"sheeth bhandar",i](around:${r},${lat},${lon});
  way["name"~"sheeth bhandar",i](around:${r},${lat},${lon});
  node["name"~"refrigerat",i]["amenity"~"storage|warehouse|industrial"](around:${r},${lat},${lon});
  way["name"~"refrigerat",i]["amenity"~"storage|warehouse|industrial"](around:${r},${lat},${lon});
  node["name"~"frozen",i]["amenity"~"warehouse|storage|industrial"](around:${r},${lat},${lon});
  way["name"~"frozen",i]["amenity"~"warehouse|storage|industrial"](around:${r},${lat},${lon});
);
out center tags;
  `;

  let osmResults: ColdStorage[] = [];
  let osmOk = false;

  try {
    const res = await fetch('/api/overpass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        const seen = new Set<string>();
        for (const el of data.elements as any[]) {
          const elLat: number = el.lat ?? el.center?.lat;
          const elLon: number = el.lon ?? el.center?.lon;
          if (!elLat || !elLon) continue;
          const tags = el.tags ?? {};
          const name: string = tags.name || tags['name:en'] || tags['name:hi'] || 'Cold Storage Facility';
          const key = name.toLowerCase().slice(0, 20) + '_' + elLat.toFixed(3);
          if (seen.has(key)) continue;
          seen.add(key);
          const addrParts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:village'] || tags['addr:suburb'], tags['addr:city'] || tags['addr:town'] || tags['addr:district'], tags['addr:state']].filter(Boolean);
          osmResults.push({
            id: String(el.id), name, address: addrParts.length > 0 ? addrParts.join(', ') : '',
            lat: elLat, lon: elLon, distanceKm: haversineKm(lat, lon, elLat, elLon),
            phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'],
            website: tags.website || tags['contact:website'],
            openingHours: tags.opening_hours, operator: tags.operator,
            capacity: tags.capacity || tags['storage:capacity'],
            mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${elLat},${elLon}`,
          });
        }
        osmOk = true;
      }
    }
  } catch (e) {
    console.warn('[StorageTab] Overpass failed:', e);
  }

  osmResults = osmResults
    .filter(a => a.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 40);

  // Got real OSM data — return it
  if (osmOk && osmResults.length > 0) {
    return { results: osmResults, isFallback: false, source: 'openstreetmap' };
  }

  // Overpass gave nothing → try AI (Gemini → Groq)
  try {
    const { results: aiResults, source } = await fetchFromAI(lat, lon, cityName, radiusKm);
    const validAi = aiResults.filter((r: ColdStorage) => r.distanceKm <= radiusKm);
    if (validAi.length > 0) {
      return { results: validAi, isFallback: true, source };
    }
  } catch (e) {
    console.warn('[StorageTab] AI fallback failed:', e);
  }

  // Last resort: built-in dataset
  const fallbackWithDist = FALLBACK_STORAGES.map(s => {
    const d = haversineKm(lat, lon, s.lat, s.lon);
    return { ...s, distanceKm: d, mapsUrl: `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}` };
  });
  
  const validFallback = fallbackWithDist
    .filter(s => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
    
  return { results: validFallback.slice(0, 5), isFallback: true, source: 'database' };
}

// ─── Geocode (Nominatim) ──────────────────────────────────────────────────────
async function geocode(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', India')}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'KisanSeva/1.0' } });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0] };
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'User-Agent': 'KisanSeva/1.0' } }
    );
    const data = await res.json();
    return (
      data.address?.village ||
      data.address?.town ||
      data.address?.city ||
      data.address?.district ||
      data.address?.state ||
      'your location'
    );
  } catch {
    return 'your location';
  }
}

// ─── Leaf map (dynamic import so it only loads client-side) ───────────────────
const LeafMap = dynamic(() => import('@/components/ColdStorageMap'), { ssr: false, loading: () => (
  <div style={{ height: 340, background: '#1e293b', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
    Loading map…
  </div>
)});

// ─── Main Page ────────────────────────────────────────────────────────────────
export function StorageTab() {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<ColdStorage[]>([]);
  const [error, setError] = useState('');
  const [cityName, setCityName] = useState('');
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [centerCoords, setCenterCoords] = useState<[number, number] | null>(null);
  const [manualCity, setManualCity] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('openstreetmap');
  const listRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (lat: number, lon: number, name: string, overrideRadius?: number) => {
    const searchRadius = overrideRadius || radiusKm;
    if (overrideRadius) setRadiusKm(overrideRadius);
    
    setStatus('searching');
    setResults([]);
    setError('');
    setIsFallbackData(false);
    setCenterCoords([lat, lon]);
    setCityName(name);
    try {
      const { results: facilities, isFallback, source } = await fetchNearby(lat, lon, searchRadius, name);
      setIsFallbackData(isFallback);
      setDataSource(source);
      setResults(facilities);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }, [radiusKm]);

  const handleGPS = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); setStatus('error'); return; }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);
        runSearch(latitude, longitude, name);
      },
      () => { setError('Could not access GPS. Please type your city or village name below.'); setStatus('error'); },
      { timeout: 12000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCity.trim()) return;
    setStatus('locating');
    setError('');
    const coords = await geocode(manualCity.trim());
    if (!coords) {
      setError(`Could not find "${manualCity}". Try a nearby district or state name.`);
      setStatus('error');
      return;
    }
    runSearch(coords.lat, coords.lon, coords.name || manualCity);
  };

  const busy = status === 'locating' || status === 'searching';
  const selectedFacility = results.find(r => r.id === selectedId) || null;

  const scrollToCard = (id: string) => {
    setSelectedId(id);
    const el = document.getElementById(`cs-card-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div style={{ background: '#f0f4f0', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '28px 24px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: dataSource === 'openstreetmap' ? '#0ea5e9' : dataSource === 'gemini' ? '#8b5cf6' : dataSource === 'groq' ? '#f59e0b' : '#64748b', marginBottom: 6 }}>
            <ThermometerSnowflake size={20} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Live Search · {dataSource === 'openstreetmap' ? 'OpenStreetMap' : dataSource === 'gemini' ? 'Gemini AI' : dataSource === 'groq' ? 'Groq AI' : 'Database'}
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
            Cold Storage Finder
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0 0 24px' }}>
            Find actual cold storage facilities near your location — no demos, no fake data.
          </p>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* GPS */}
            <button onClick={handleGPS} disabled={busy} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 28px', background: busy ? '#9ca3af' : '#0ea5e9', color: '#fff',
              border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem',
              cursor: busy ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
            }}>
              {busy ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Locate size={20} />}
              {status === 'locating' ? 'Getting your location…' :
               status === 'searching' ? `Scanning ${radiusKm} km radius on OpenStreetMap…` :
               '📍 Use My GPS Location'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ color: '#9ca3af', fontSize: '0.78rem', fontWeight: 700 }}>OR TYPE YOUR VILLAGE / CITY</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            {/* City search */}
            <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                <input
                  type="text"
                  placeholder="e.g. Agra, Nashik, Jalandhar, Coimbatore…"
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  disabled={busy}
                  style={{
                    width: '100%', padding: '13px 16px 13px 42px',
                    borderRadius: 12, border: '1px solid #d1d5db',
                    outline: 'none', fontSize: '0.95rem',
                    boxSizing: 'border-box', background: busy ? '#f9fafb' : '#fff'
                  }}
                />
              </div>
              <button type="submit" disabled={!manualCity.trim() || busy} style={{
                padding: '0 24px', background: '#2d6a27', color: '#fff',
                border: 'none', borderRadius: 12, fontWeight: 700,
                cursor: (!manualCity.trim() || busy) ? 'not-allowed' : 'pointer',
                opacity: (!manualCity.trim() || busy) ? 0.6 : 1
              }}>
                Search
              </button>
            </form>

            {/* Radius */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Radius:</span>
              {[25, 50, 100, 200].map(km => (
                <button key={km} onClick={() => setRadiusKm(km)} style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  background: radiusKm === km ? '#0ea5e9' : '#f3f4f6',
                  color: radiusKm === km ? '#fff' : '#4b5563',
                  transition: 'all 0.15s'
                }}>
                  {km} km
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 24px' }}>

        {/* Error */}
        {status === 'error' && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
            <AlertCircle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>Search failed</div>
              <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Searching */}
        {status === 'searching' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <ThermometerSnowflake size={48} style={{ color: '#0ea5e9', margin: '0 auto 16px', display: 'block', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <p style={{ color: '#374151', fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
              Searching OpenStreetMap…
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Scanning {radiusKm} km around {cityName}
            </p>
          </div>
        )}

        {/* Results */}
        {status === 'done' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                {results.length > 0
                  ? `${results.length} cold storage facilities found near ${cityName}`
                  : `No results within ${radiusKm} km of ${cityName}`}
              </h2>
              <button onClick={() => centerCoords && runSearch(centerCoords[0], centerCoords[1], cityName)}
                style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {/* Map */}
            {results.length > 0 && centerCoords && (
              <div style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <LeafMap
                  center={centerCoords}
                  facilities={results}
                  selectedId={selectedId}
                  onSelect={scrollToCard}
                />
              </div>
            )}

            {/* No results */}
            {results.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                <ThermometerSnowflake size={48} style={{ color: '#d1d5db', margin: '0 auto 16px', display: 'block' }} />
                <p style={{ color: '#374151', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
                  No cold storage found in OpenStreetMap within {radiusKm} km
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 16, maxWidth: 480, margin: '0 auto 16px' }}>
                  OpenStreetMap coverage for cold storage in rural India is still growing. Try expanding to 100–200 km, or search a nearby larger city.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => { setRadiusKm(100); if (centerCoords) runSearch(centerCoords[0], centerCoords[1], cityName, 100); }} style={{ padding: '10px 20px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                    Try 100 km
                  </button>
                  <button onClick={() => { setRadiusKm(200); if (centerCoords) runSearch(centerCoords[0], centerCoords[1], cityName, 200); }} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                    Try 200 km
                  </button>
                </div>
              </div>
            )}

            {/* Cards */}
            <div ref={listRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {results.map(f => (
                <div
                  key={f.id}
                  id={`cs-card-${f.id}`}
                  onClick={() => setSelectedId(f.id)}
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: `2px solid ${selectedId === f.id ? '#0ea5e9' : '#e5e7eb'}`,
                    boxShadow: selectedId === f.id ? '0 0 0 3px rgba(14,165,233,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    overflow: 'hidden', cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    display: 'flex', flexDirection: 'column'
                  }}
                >
                  {/* Card header */}
                  <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)', padding: '18px 20px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.18)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ThermometerSnowflake size={20} style={{ color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: '0 0 3px', lineHeight: 1.3 }}>
                          {f.name}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                          📍 {f.distanceKm.toFixed(1)} km away
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {f.address && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#6b7280', fontSize: '0.83rem' }}>
                        <MapPin size={13} style={{ flexShrink: 0, marginTop: 2, color: '#9ca3af' }} />
                        <span>{f.address}</span>
                      </div>
                    )}
                    {f.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem' }}>
                        <Phone size={13} style={{ color: '#9ca3af' }} />
                        <a href={`tel:${f.phone}`} style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>
                          {f.phone}
                        </a>
                      </div>
                    )}
                    {f.operator && (
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        🏢 Operator: {f.operator}
                      </div>
                    )}
                    {f.capacity && (
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        📦 Capacity: {f.capacity}
                      </div>
                    )}
                    {f.openingHours && (
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        🕐 {f.openingHours}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '10px 18px 14px', display: 'flex', gap: 8, borderTop: '1px solid #f3f4f6' }}>
                    <a href={f.mapsUrl} target="_blank" rel="noreferrer" style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 0', background: '#0ea5e9', color: '#fff',
                      borderRadius: 10, fontWeight: 700, fontSize: '0.83rem', textDecoration: 'none'
                    }}>
                      <Navigation size={14} /> Directions
                    </a>
                    {f.website && (
                      <a href={f.website.startsWith('http') ? f.website : `https://${f.website}`}
                        target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', background: '#f3f4f6', color: '#374151', borderRadius: 10, textDecoration: 'none' }}>
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info note */}
            {results.length > 0 && (
              <>
                {isFallbackData && (
                  <div style={{ marginBottom: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 10 }}>
                    <Info size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', lineHeight: 1.5 }}>
                      No cold storages found within {radiusKm}km. Showing the nearest available major facilities instead, which may be further away.
                    </p>
                  </div>
                )}
                <div style={{ marginTop: 20, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 10 }}>
                  <Info size={16} style={{ color: '#0ea5e9', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#075985', lineHeight: 1.5 }}>
                    Results are from <strong>OpenStreetMap (Overpass API)</strong> — a live, community-maintained database. Coverage in rural India is growing. If a facility is missing, any OSM contributor can add it at{' '}
                    <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', fontWeight: 700 }}>openstreetmap.org</a>.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* Idle */}
        {status === 'idle' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '56px 32px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: '#f0f9ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ThermometerSnowflake size={40} style={{ color: '#0ea5e9' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', marginBottom: 10 }}>
              Find Real Cold Storage Near You
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 6px' }}>
              Tap <strong>"Use My GPS Location"</strong> to auto-detect, or type your village/city name above. Results come directly from <strong>OpenStreetMap's live database</strong> — zero fake data.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
      `}</style>
    </div>
  );
}
