import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

export default function WebcamCapture({ 
  onCapture, 
  onCancel 
}: { 
  onCapture: (file: File) => void; 
  onCancel: () => void; 
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Webcam error:', err);
      setError(err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please grant permission in your browser.' 
        : 'Could not access the camera. Ensure it is not being used by another app.');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Stop stream before returning
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 600, backgroundColor: '#111827', borderRadius: 20, overflow: 'hidden', padding: 24, margin: 16 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={20} /> Take a Photo
          </h3>
          <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}>
            <X size={20} />
          </button>
        </div>

        {/* Video Area */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          {error ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: 12 }}>❌</div>
              <div style={{ color: '#fff', fontWeight: 600, marginBottom: 16 }}>{error}</div>
              <button onClick={startCamera} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={16} /> Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {isInitializing && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div style={{ color: '#fff', fontWeight: 600 }}>Starting camera...</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={capturePhoto}
            disabled={!!error || isInitializing}
            style={{ 
              width: 72, height: 72, borderRadius: '50%', backgroundColor: '#fff', 
              border: '6px solid rgba(255,255,255,0.3)', cursor: error || isInitializing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.1s'
            }}
            onMouseDown={e => { if(!error && !isInitializing) e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#fff', border: '2px solid #e5e7eb' }} />
          </button>
        </div>

      </div>
    </div>
  );
}
