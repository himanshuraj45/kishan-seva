"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";

function MapController() {
  const map = useMap();
  useEffect(() => {
    // Force a resize immediately and after a short delay for basic renders
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 500);

    // Use ResizeObserver to watch the map's actual DOM container for changes
    // This perfectly handles framer-motion / scroll-reveal animations changing the size!
    const container = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);

    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [map]);
  return null;
}

export default function MapClient() {
  const [geojson, setGeojson] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const FALLBACK_REPORTS = [
    { id: 1, lat: 30.9, lng: 75.8, status: "Critical", title: "Yellow Rust detected in Wheat", location: "Punjab" },
    { id: 2, lat: 29.0, lng: 76.0, status: "Healthy", title: "Optimal Soil Moisture", location: "Haryana" },
    { id: 3, lat: 26.8, lng: 80.9, status: "Warning", title: "Late Blight risk in Potatoes", location: "Uttar Pradesh" },
    { id: 4, lat: 22.9, lng: 78.6, status: "Healthy", title: "Soybean crop progressing well", location: "Madhya Pradesh" },
    { id: 5, lat: 20.5, lng: 76.5, status: "Critical", title: "Severe Water Stress in Cotton", location: "Maharashtra" },
    { id: 6, lat: 15.3, lng: 75.1, status: "Warning", title: "Pest sighting in Sugarcane", location: "Karnataka" },
    { id: 7, lat: 11.1, lng: 77.3, status: "Healthy", title: "Excellent Monsoon coverage", location: "Tamil Nadu" },
    { id: 8, lat: 23.2, lng: 87.8, status: "Warning", title: "Flooding risk in Paddy fields", location: "West Bengal" },
    { id: 9, lat: 26.1, lng: 91.7, status: "Healthy", title: "Tea estates reporting normal growth", location: "Assam" },
    { id: 10, lat: 21.2, lng: 81.6, status: "Critical", title: "Stem Borer attack in Rice", location: "Chhattisgarh" },
    { id: 11, lat: 28.6, lng: 77.2, status: "Warning", title: "Heatwave affecting vegetable crops", location: "Delhi NCR" },
    { id: 12, lat: 27.0, lng: 73.0, status: "Critical", title: "Locust swarm warning", location: "Rajasthan" },
    { id: 13, lat: 23.0, lng: 72.0, status: "Healthy", title: "Groundnut yield expectations high", location: "Gujarat" },
    { id: 14, lat: 19.0, lng: 82.0, status: "Warning", title: "Uneven rainfall impacting millet", location: "Odisha" },
    { id: 15, lat: 25.6, lng: 85.1, status: "Healthy", title: "Maize plantations thriving", location: "Bihar" },
    { id: 16, lat: 34.0, lng: 74.8, status: "Warning", title: "Frost risk for Apple orchards", location: "Jammu & Kashmir" },
    { id: 17, lat: 31.1, lng: 77.1, status: "Healthy", title: "Favorable conditions for stone fruits", location: "Himachal Pradesh" },
    { id: 18, lat: 10.8, lng: 76.2, status: "Critical", title: "Fungal infection in Cardamom", location: "Kerala" },
    { id: 19, lat: 17.3, lng: 78.4, status: "Warning", title: "Groundwater depletion noted", location: "Telangana" },
    { id: 20, lat: 16.5, lng: 80.6, status: "Healthy", title: "Chilli crops show robust health", location: "Andhra Pradesh" },
    { id: 21, lat: 23.3, lng: 85.3, status: "Warning", title: "Minor nutrient deficiency in pulses", location: "Jharkhand" },
    { id: 22, lat: 30.3, lng: 78.0, status: "Healthy", title: "Organic farming yields stabilizing", location: "Uttarakhand" },
  ];

  useEffect(() => {
    setIsMounted(true);
    // Show fallback data immediately so map is never empty
    setReports(FALLBACK_REPORTS);
    
    // Try to enhance with live AI-generated data in background
    fetch("/api/reports")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setReports(data);
        }
      })
      .catch(() => { /* silently keep fallback data */ })
      .finally(() => setIsLoadingReports(false));
  }, []);


  /* ── Load India GeoJSON ── */
  useEffect(() => {
    fetch("/india-states.json")
      .then((r) => r.json())
      .then((data) => {
        data.features = data.features.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            density: Math.floor(Math.random() * 100),
          },
        }));
        setGeojson(data);
      })
      .catch(console.error);
  }, []);

  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || "qguQWmqdVWGcGnH7NGOR";
  // MapTiler Raster tiles (256x256) endpoint for Leaflet
  const tileUrl = `https://api.maptiler.com/maps/basic-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`;

  // Helper for Choropleth colors
  const getStyle = (feature: any) => {
    const density = feature.properties.density;
    let fillColor = "#e0f2fe";
    if (density > 80) fillColor = "#0284c7";
    else if (density > 60) fillColor = "#0ea5e9";
    else if (density > 40) fillColor = "#38bdf8";
    else if (density > 20) fillColor = "#7dd3fc";

    return {
      fillColor,
      weight: 1.2,
      opacity: 0.9,
      color: "white",
      fillOpacity: 0.72,
    };
  };

  // Helper to create professional SVG map pins
  const createIcon = (status: string) => {
    let color = "#64748b"; // slate-500
    if (status === "Critical") color = "#ef4444"; // red-500
    if (status === "Warning") color = "#f59e0b"; // amber-500
    if (status === "Healthy") color = "#10b981"; // emerald-500
    
    // Professional Map Pin SVG with drop shadow
    const svgPin = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3));">
        <path stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;

    return L.divIcon({
      className: "bg-transparent border-none", // Force clear any default Leaflet borders/backgrounds
      html: svgPin,
      iconSize: [32, 32],
      iconAnchor: [16, 32], // Anchor to the bottom tip of the pin
      popupAnchor: [0, -32] // Popup opens above the pin
    });
  };

  if (!isMounted) return <div className="w-full h-full min-h-[400px] bg-slate-50 animate-pulse rounded-xl" />;

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ minHeight: "400px" }}>
        
        <MapContainer
          key="marketing-map"
          center={[22.5, 82.0]}
          zoom={4}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", background: "#f8fafc" }}
        >
        <MapController />
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
        />
        {geojson && <GeoJSON data={geojson} style={getStyle} />}
        
        {/* Render Field Reports */}
        {reports.map((report) => (
          <Marker key={report.id} position={[report.lat, report.lng]} icon={createIcon(report.status)}>
            <Popup>
              <div className="font-semibold text-slate-800">{report.title}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">📍 {report.location}</div>
              <div className="text-[11px] font-bold mt-1" style={{ color: report.status === 'Critical' ? '#ef4444' : report.status === 'Warning' ? '#f59e0b' : '#10b981' }}>
                {report.status}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Legend ── */}
      <div 
        className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md px-5 py-4 rounded-xl shadow-xl border border-slate-200 min-w-[180px]"
        style={{ zIndex: 1000 }}
      >
        
        {/* Alerts Section */}
        <div className="mb-5 relative">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[13px] font-bold text-slate-900 tracking-tight">
              Crop Health
            </h4>
            {isLoadingReports && (
              <span className="flex items-center text-[10px] text-sky-500 font-semibold animate-pulse">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full mr-1" />
                Live AI Sync
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#ef4444' }} /> 
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#f59e0b' }} /> 
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#10b981' }} /> 
              <span>Healthy</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-200 my-4" />

        {/* Density Section */}
        <h4 className="text-[13px] font-bold text-slate-900 mb-3 tracking-tight">
          Crop Density
        </h4>
        <div className="h-3 w-full rounded-full bg-gradient-to-r from-sky-100 via-sky-400 to-sky-700 border border-slate-200 shadow-inner mb-2" />
        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
          <span>0</span>
          <span>6000+</span>
        </div>
      </div>
    </div>
    </>
  );
}
