'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Rectangle, Popup, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
// Removed local css import to avoid Turbopack image resolution bugs
// import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
});

export interface Zone {
  id: string;
  name: string;
  crop: string;
  area: string;
  coordinates: [number, number][];
  health: number;
  ndvi: number;
  issue: string;
}

// Ray-casting algorithm to check if a point is inside a polygon
function isPointInPolygon(point: [number, number], vs: [number, number][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Helper to generate a pixelated heatmap grid for a zone
function generatePixelGrid(zone: Zone, resolution: number = 12) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  zone.coordinates.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const latStep = (maxLat - minLat) / resolution;
  const lngStep = (maxLng - minLng) / resolution;
  const pixels: { bounds: [[number, number], [number, number]], health: number }[] = [];

  // Seeded random based on coordinate to keep colors stable but varied
  const pseudoRandom = (lat: number, lng: number) => {
    return Math.abs(Math.sin(lat * 12.9898 + lng * 78.233)) * 43758.5453 % 1;
  };

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const cellLat = minLat + i * latStep;
      const cellLng = minLng + j * lngStep;
      const centerLat = cellLat + latStep / 2;
      const centerLng = cellLng + lngStep / 2;

      if (isPointInPolygon([centerLat, centerLng], zone.coordinates)) {
        // Add localized variance (-15 to +15) to base health to simulate sensor noise/data
        const variance = (pseudoRandom(centerLat, centerLng) - 0.5) * 30; 
        const cellHealth = Math.max(0, Math.min(100, zone.health + variance));
        
        pixels.push({
          bounds: [[cellLat, cellLng], [cellLat + latStep, cellLng + lngStep]],
          health: cellHealth
        });
      }
    }
  }
  return pixels;
}

function MapController({ targetLocation }: { targetLocation: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        map.invalidateSize();
        if (map.getZoom() < 10 && !targetLocation) {
           map.setView([30.9192, 75.8570], 15, { animate: true });
        }
      } catch (error) {
        // Ignore errors if map is unmounted during strict mode/HMR
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [map, targetLocation]);

  useEffect(() => {
    if (targetLocation) {
      try {
        map.flyTo(targetLocation, 15, { duration: 2 });
      } catch (error) {
        try { map.setView(targetLocation, 15); } catch (e) {}
      }
    }
  }, [map, targetLocation]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function getColor(health: number, isNDVI: boolean): string {
  if (!isNDVI) return '#ffffff';
  if (health >= 80) return '#16a34a';
  if (health >= 60) return '#84cc16';
  if (health >= 40) return '#eab308';
  return '#ef4444';
}

function getFillOpacity(isNDVI: boolean): number {
  return isNDVI ? 0.65 : 0.05;
}

interface FarmMapProps {
  isNDVI: boolean;
  zones: Zone[];
  onZoneSelect?: (zone: Zone | null) => void;
  targetLocation: [number, number] | null;
  onMapClick?: (lat: number, lng: number) => void;
  sosAlerts?: any[];
  drawMode?: boolean;
  drawPoints?: [number, number][];
}

export default function FarmMap({ isNDVI, zones, onZoneSelect, targetLocation, onMapClick, sosAlerts = [], drawMode = false, drawPoints = [] }: FarmMapProps) {
  const defaultCenter: [number, number] = [30.9192, 75.8570];
  const mapRef = React.useRef<L.Map | null>(null);

  // Deep cleanup for React 18 Strict Mode and Next.js HMR
  // Destroys the Leaflet instance on unmount to prevent 'Map container is already initialized' errors
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Memoize the pixel grids so they only recalculate if the base zone data changes
  const heatmapData = useMemo(() => {
    return zones.map(zone => ({
      zone,
      pixels: generatePixelGrid(zone, 18) // High resolution grid
    }));
  }, [zones]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer ref={mapRef} center={defaultCenter} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <MapController targetLocation={targetLocation} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* Google Maps Hybrid Imagery (Satellite + Labels) */}
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          attribution='&copy; <a href="https://www.google.com/maps">Google</a>'
          maxZoom={20}
        />

        {/* Location Marker */}
        {targetLocation && (
          <Marker position={targetLocation}>
            <Popup>Current Location</Popup>
          </Marker>
        )}

        {/* Real-time SOS Hazard Zones */}
        {sosAlerts.map(alert => (
          <Circle 
            key={`sos-${alert.id}`}
            center={[alert.latitude, alert.longitude]}
            radius={alert.type.includes('Swarm') || alert.type.includes('Flood') ? 1500 : 500}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.35, weight: 2, dashArray: '8, 8' }}
          >
            <Popup>
              <div style={{ fontFamily: "'Inter', sans-serif" }}>
                <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '1rem', marginBottom: '4px' }}>🚨 {alert.type}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Broadcasted by farmer at:</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{new Date(alert.timestamp).toLocaleTimeString()}</div>
              </div>
            </Popup>
          </Circle>
        ))}

        {heatmapData.map(({ zone, pixels }) => {
          const zoneColor = getColor(zone.health, isNDVI);
          
          return (
            <React.Fragment key={zone.id}>
              {/* If NDVI is off, just render the boundary. If ON, render the pixelated grid. */}
              {!isNDVI ? (
                <Polygon
                  positions={zone.coordinates}
                  pathOptions={{ color: '#fff', fillColor: zoneColor, fillOpacity: 0.1, weight: 1.5 }}
                  eventHandlers={{ click: () => onZoneSelect?.(zone) }}
                >
                  <Popup>{renderPopup(zone)}</Popup>
                </Polygon>
              ) : (
                <React.Fragment>
                  {/* Outer boundary line for the zone */}
                  <Polygon 
                    positions={zone.coordinates} 
                    pathOptions={{ color: '#0f172a', weight: 1, fill: false }} 
                    eventHandlers={{ click: () => onZoneSelect?.(zone) }} 
                  />
                  {/* Pixelated Heatmap cells inside the zone */}
                  {pixels.map((pixel, i) => (
                    <Rectangle
                      key={i}
                      bounds={pixel.bounds}
                      pathOptions={{
                        color: getColor(pixel.health, true), // border color matches fill
                        weight: 0, 
                        fillColor: getColor(pixel.health, true),
                        fillOpacity: 0.65
                      }}
                      eventHandlers={{ click: () => onZoneSelect?.(zone) }}
                    >
                      <Popup>{renderPopup(zone)}</Popup>
                    </Rectangle>
                  ))}
                </React.Fragment>
              )}
            </React.Fragment>
          );
        })}

        {/* --- Custom Drawing Mode Overlay --- */}
        {drawPoints.length > 0 && (
          <>
            <Polygon 
              positions={drawPoints} 
              pathOptions={{ color: '#3b82f6', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.2, dashArray: '4, 4' }} 
            />
            {drawPoints.map((pt, i) => (
              <Circle 
                key={i} 
                center={pt} 
                radius={3} 
                pathOptions={{ color: '#fff', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 }} 
              />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}

function renderPopup(zone: Zone) {
  return (
    <div style={{ minWidth: '200px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>{zone.name}</div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>🌾 {zone.crop} &nbsp;·&nbsp; 📐 {zone.area}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${zone.health}%`, background: getColor(zone.health, true), borderRadius: '3px' }} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: getColor(zone.health, true) }}>{zone.health.toFixed(1)}%</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NDVI: <strong>{zone.ndvi.toFixed(2)}</strong></div>
      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '6px', lineHeight: 1.5 }}>{zone.issue}</div>
    </div>
  );
}

