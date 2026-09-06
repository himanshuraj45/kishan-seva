'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icon path issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const blueIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

interface Facility { id: string; name: string; lat: number; lon: number; distanceKm: number; address: string; }

interface Props {
  center: [number, number];
  facilities: Facility[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function FlyTo({ center, selectedFacility }: { center: [number, number]; selectedFacility: Facility | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedFacility) {
      map.flyTo([selectedFacility.lat, selectedFacility.lon], 14, { duration: 1 });
    } else {
      map.flyTo(center, 11, { duration: 1 });
    }
  }, [selectedFacility, center, map]);
  return null;
}

export default function ColdStorageMap({ center, facilities, selectedId, onSelect }: Props) {
  const selectedFacility = facilities.find(f => f.id === selectedId) || null;

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: 380, width: '100%', zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
      />

      <FlyTo center={center} selectedFacility={selectedFacility} />

      {/* User location circle */}
      <Circle
        center={center}
        radius={300}
        pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.3, weight: 2 }}
      />

      {/* Facility markers */}
      {facilities.map(f => (
        <Marker
          key={f.id}
          position={[f.lat, f.lon]}
          icon={selectedId === f.id ? redIcon : blueIcon}
          eventHandlers={{ click: () => onSelect(f.id) }}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: 4 }}>{f.name}</strong>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                📍 {f.distanceKm.toFixed(1)} km away
              </span>
              {f.address && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{f.address}</div>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', marginTop: 8, padding: '6px 0',
                  background: '#0ea5e9', color: '#fff', borderRadius: 8,
                  textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem', textAlign: 'center'
                }}
              >
                Get Directions
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
