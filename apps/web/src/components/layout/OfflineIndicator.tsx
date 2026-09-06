/**
 * @file src/components/layout/OfflineIndicator.tsx
 * @description Thin banner that slides in at the top of the viewport when the browser loses network access, and auto-dismisses on reconnect.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    function handleOnline() {
      setIsOffline(false);
    }
    
    function handleOffline() {
      setIsOffline(true);
    }

    // Check initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isMounted || !isOffline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#ef4444', // Red 500
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '30px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
      zIndex: 9999,
      fontWeight: 600,
      fontSize: '0.9rem',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <WifiOff size={18} />
      <span>You are offline.</span>
      <a 
        href="/offline" 
        style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '0.8rem',
          textDecoration: 'none',
          color: 'white',
          whiteSpace: 'nowrap'
        }}
      >
        View Offline Hub
      </a>
      <style>{`
        @keyframes slideDown {
          from { top: -50px; opacity: 0; }
          to { top: 16px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}


