'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Bug, CloudRainWind, Siren, ShieldAlert, X, Send, Loader2 } from 'lucide-react';

export default function CommunitySOS() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Polling State
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const seenAlerts = useRef<Set<number>>(new Set());

  const SOS_TYPES = [
    { id: 'Locust Swarm', icon: <Bug size={24} />, color: '#ef4444' },
    { id: 'Flash Flood', icon: <CloudRainWind size={24} />, color: '#3b82f6' },
    { id: 'Pest Attack', icon: <ShieldAlert size={24} />, color: '#f97316' },
    { id: 'Unknown Threat', icon: <AlertTriangle size={24} />, color: '#eab308' }
  ];

  const [myActiveSOS, setMyActiveSOS] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('ks_my_active_sos');
    if (saved) setMyActiveSOS(saved);
  }, []);

  // 1. Background Poller for Early Warning System
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollAlerts = async () => {
      // We need user's location to check 50km radius
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLocation([lat, lng]);

        try {
          const res = await fetch(`/api/v1/sos?lat=${lat}&lng=${lng}&radius=50`);
          if (!res.ok) return;
          const data = await res.json();
          
          if (data.alerts && data.alerts.length > 0) {
            // Find newly broadcasted alerts we haven't seen yet
            const newAlerts = data.alerts.filter((a: any) => !seenAlerts.current.has(a.id));
            if (newAlerts.length > 0) {
              newAlerts.forEach((a: any) => seenAlerts.current.add(a.id));
              // Push the new alerts to state to display the push notification
              setActiveAlerts(prev => [...prev, ...newAlerts]);
            }
          }
        } catch (error) {
          // Silent fail for background poller
        }
      }, () => {}, { timeout: 10000, maximumAge: 60000 });
    };

    pollAlerts(); // Initial poll
    interval = setInterval(pollAlerts, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSOS = (type: string) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsSending(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/v1/sos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            })
          });

          if (res.ok) {
            alert(`🚨 ${type} Alert broadcasted to all farmers within 50km!`);
            setMyActiveSOS(type);
            localStorage.setItem('ks_my_active_sos', type);
            setIsOpen(false);
          } else {
            alert("Failed to broadcast alert. Please check your network.");
          }
        } catch (err) {
          alert("Network error.");
        } finally {
          setIsSending(false);
        }
      },
      (err) => {
        alert("Failed to get your GPS location. Ensure location services are ON.");
        setIsSending(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const stopSOS = () => {
    setMyActiveSOS(null);
    localStorage.removeItem('ks_my_active_sos');
    setIsOpen(false);
    alert("SOS broadcasting stopped.");
  };

  const dismissAlert = (id: number) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .sos-floating-btn { position: fixed; bottom: 80px; left: 24px; z-index: 99990; }
        @media (min-width: 1024px) { .sos-floating-btn { bottom: 190px; left: 288px; } }
      `}</style>
      
      {/* ── Global Early Warning Push Notifications ── */}
      <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100000, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
        {activeAlerts.map(alert => (
          <div key={alert.id} style={{ pointerEvents: 'auto', backgroundColor: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(16px)', border: '2px solid #f87171', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 20px 40px rgba(220,38,38,0.4)', minWidth: '380px', animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '50%', padding: '8px' }}>
              <Siren size={24} color="#ef4444" style={{ animation: 'spin 2s linear infinite' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, color: '#fff', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>COMMUNITY SOS</div>
              <div style={{ color: '#fee2e2', fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                {alert.type} reported <span style={{ fontWeight: 800 }}>{alert.distance.toFixed(1)} km</span> away!
              </div>
            </div>
            <button onClick={() => dismissAlert(alert.id)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', color: '#fff' }}>
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Floating SOS Action Button ── */}
      <div className="sos-floating-btn">
        {/* Radar Pulse Effect */}
        <div className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#ef4444', opacity: 0.75 }}></div>
        
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            position: 'relative', zIndex: 10, backgroundColor: '#ef4444', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(239,68,68,0.5)', transition: 'all 0.2s' 
          }}
          title="Broadcast SOS"
        >
          <Siren size={32} />
        </button>
      </div>

      {/* ── SOS Trigger Modal ── */}
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            {myActiveSOS ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '16px' }}>
                <div className="animate-ping" style={{ width: '64px', height: '64px', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: '50%', position: 'absolute', opacity: 0.8 }} />
                <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                  <Siren size={32} color="#ef4444" />
                </div>
                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800 }}>Broadcasting {myActiveSOS}</h2>
                <p style={{ color: '#94a3b8', margin: '8px 0 24px 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Your farm is currently broadcasting a live threat alert.
                </p>
                <button onClick={stopSOS} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', width: '100%', boxShadow: '0 8px 32px rgba(239,68,68,0.3)', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                  Stop Broadcasting SOS
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Siren size={32} color="#ef4444" />
                  </div>
                  <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800 }}>Broadcast SOS</h2>
                  <p style={{ color: '#94a3b8', margin: '8px 0 0 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Instantly alert all farmers within a <strong>50km radius</strong>. Please use only for verified community threats.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {SOS_TYPES.map(threat => (
                    <button 
                      key={threat.id}
                      onClick={() => handleSOS(threat.id)}
                      disabled={isSending}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: isSending ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isSending ? 0.5 : 1
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{ color: threat.color }}>{threat.icon}</div>
                      <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{threat.id}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {isSending && (
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Broadcasting GPS Coordinates...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  , document.body);
}
