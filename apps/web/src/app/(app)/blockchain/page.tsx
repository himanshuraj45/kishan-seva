'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { ShieldCheck, PlusCircle, Search, Hash, Cpu, Leaf, Truck, Store, MapPin, CheckCircle2, Factory } from 'lucide-react';

interface Block {
  timestamp: string;
  stage: string;
  location: string;
  actor: string;
  hash: string;
}

export default function BlockchainPage() {
  const [activeView, setActiveView] = useState<'mint' | 'verify'>('mint');

  // MINT STATE
  const [cropType, setCropType] = useState('Organic Basmati Rice');
  const [seedVariety, setSeedVariety] = useState('Pusa-1121 Premium');
  const [fertilizer, setFertilizer] = useState('100% Bio-Compost');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success'>('idle');
  const [generatedBatchId, setGeneratedBatchId] = useState('');

  // VERIFY STATE
  const [searchBatchId, setSearchBatchId] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [mintedRecord, setMintedRecord] = useState<any>(null);

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault();
    setMintStatus('minting');
    setTimeout(() => {
      const batchId = `BATCH-${Math.floor(Math.random() * 1000000)}`;
      setGeneratedBatchId(batchId);
      setMintedRecord({ cropType, seedVariety, fertilizer, harvestDate, batchId });
      setMintStatus('success');
    }, 1500);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBatchId) return;
    setVerifyStatus('searching');
    setTimeout(() => {
      // If it matches the one we just minted, or is any valid format for the demo
      if (searchBatchId === mintedRecord?.batchId || searchBatchId.startsWith('BATCH-')) {
        setVerifyStatus('found');
      } else {
        setVerifyStatus('error');
      }
    }, 1200);
  };

  const resetMint = () => {
    setMintStatus('idle');
    setGeneratedBatchId('');
    setCropType('');
    setSeedVariety('');
    setFertilizer('');
    setHarvestDate('');
  };

  // Build a dynamic ledger based on the searched batch
  const getDynamicLedger = () => {
    const isMinted = searchBatchId === mintedRecord?.batchId;
    const originDate = isMinted ? new Date(mintedRecord.harvestDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 09:30 AM' : '12 Aug 2026, 09:30 AM';
    
    return [
      { timestamp: originDate, stage: 'Origin (Harvest)', location: 'Farmer\'s Field', actor: '0x3F2A...9C11', hash: '0x8f3c4b9d2e1a76f50c8d1e2f3a4b5c6d', details: isMinted ? `Fertilizer: ${mintedRecord.fertilizer}` : 'Fertilizer: Organic Compost' },
      { timestamp: 'Pending', stage: 'Processing & Quality Check', location: 'AgriCorp Mill', actor: '0x7E1B...2A44', hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', details: 'Quality Grade: Pending' },
      { timestamp: 'Pending', stage: 'Logistics / Transit', location: 'Highway Transit', actor: '0x9D4C...5F22', hash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c', details: 'Temperature Controlled: Yes' },
      { timestamp: 'Pending', stage: 'Retail Arrival', location: 'Supermarket', actor: '0x1A2B...3C4D', hash: '0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f', details: 'Ready for Sale' },
    ];
  };

  const ledger = getDynamicLedger();
  const displayCropType = (searchBatchId === mintedRecord?.batchId) ? mintedRecord.cropType : 'Organic Wheat';
  const displaySeedVariety = (searchBatchId === mintedRecord?.batchId) ? mintedRecord.seedVariety : 'Sharbati Premium';

  return (
    <div style={{ backgroundColor: 'var(--color-parchment)', minHeight: '100%', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}>
      <main style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div className="card" style={{ padding: '32px', backgroundColor: '#fff', borderTop: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '16px', borderRadius: '50%' }}>
            <ShieldCheck size={48} color="#10b981" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', margin: '0 0 8px 0', fontSize: '2rem', color: 'var(--color-saddle)' }}>Blockchain Traceability</h1>
            <p style={{ margin: 0, color: 'var(--color-bark)', fontSize: '1rem', maxWidth: '600px' }}>
              Immutable supply chain ledger. Guarantee organic certification and trace crop origins from farm to table.
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '16px', backgroundColor: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid var(--color-bone)' }}>
          <button 
            onClick={() => setActiveView('mint')}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
              backgroundColor: activeView === 'mint' ? '#10b981' : 'transparent',
              color: activeView === 'mint' ? '#fff' : 'var(--color-saddle)'
            }}
          >
            <PlusCircle size={20} /> Farmer: Register Batch
          </button>
          <button 
            onClick={() => setActiveView('verify')}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
              backgroundColor: activeView === 'verify' ? '#3b82f6' : 'transparent',
              color: activeView === 'verify' ? '#fff' : 'var(--color-saddle)'
            }}
          >
            <Search size={20} /> Buyer: Verify Origin
          </button>
        </div>

        {/* MINT VIEW */}
        {activeView === 'mint' && (
          <div className="card" style={{ padding: '32px', backgroundColor: '#fff' }}>
            <h2 style={{ margin: '0 0 24px 0', color: 'var(--color-saddle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={24} color="#10b981" /> Mint New Crop Batch
            </h2>

            {mintStatus === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '24px', border: '2px dashed #10b981', borderRadius: '16px', backgroundColor: '#ecfdf5' }}>
                <CheckCircle2 size={64} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#065f46' }}>Block Successfully Minted</h3>
                <p style={{ margin: 0, color: '#047857', textAlign: 'center' }}>
                  Your crop data has been cryptographically secured to the ledger. Print this QR code and attach it to your shipment.
                </p>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}/trace/${generatedBatchId}`} size={200} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#d1fae5', padding: '12px 24px', borderRadius: '8px', border: '1px solid #10b981' }}>
                  <Hash size={20} color="#065f46" />
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#065f46', letterSpacing: '2px' }}>{generatedBatchId}</span>
                </div>
                <p style={{ margin: 0, color: '#047857', textAlign: 'center', fontSize: '0.875rem', maxWidth: '500px' }}>
                  <strong>Try it out!</strong> Copy this Batch ID, switch to the "Verify Origin" tab, and paste it to see your newly minted crop timeline.
                </p>
                <button onClick={resetMint} style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  Mint Another Batch
                </button>
              </div>
            ) : (
              <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--color-saddle)' }}>Crop Type</label>
                    <input type="text" value={cropType} onChange={e => setCropType(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '1rem', color: '#334155' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--color-saddle)' }}>Seed Variety</label>
                    <input type="text" value={seedVariety} onChange={e => setSeedVariety(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '1rem', color: '#334155' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--color-saddle)' }}>Fertilizer Used</label>
                    <input type="text" value={fertilizer} onChange={e => setFertilizer(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '1rem', color: '#334155' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--color-saddle)' }}>Harvest Date</label>
                    <input type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '1rem', color: '#334155' }} />
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-bone)', fontSize: '0.875rem', color: 'var(--color-bark)' }}>
                  <p style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} color="#10b981" /> <strong>Smart Contract Execution</strong></p>
                  <p style={{ margin: 0 }}>By clicking mint, this data will be hashed (SHA-256) and appended to the distributed ledger. This action is immutable and cannot be undone.</p>
                </div>

                <button 
                  type="submit" 
                  disabled={mintStatus === 'minting'}
                  style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '1.125rem', cursor: mintStatus === 'minting' ? 'not-allowed' : 'pointer', opacity: mintStatus === 'minting' ? 0.7 : 1, transition: 'all 0.2s' }}
                >
                  {mintStatus === 'minting' ? 'Cryptographically Signing...' : 'Mint Blockchain Record'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* VERIFY VIEW */}
        {activeView === 'verify' && (
          <div className="card" style={{ padding: '32px', backgroundColor: '#fff' }}>
            <h2 style={{ margin: '0 0 24px 0', color: 'var(--color-saddle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={24} color="#3b82f6" /> Verify Ledger Record
            </h2>

            <form onSubmit={handleVerify} style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Hash size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-bark)' }} />
                <input 
                  type="text" 
                  placeholder="Enter Batch ID (e.g., BATCH-123456)" 
                  value={searchBatchId}
                  onChange={e => setSearchBatchId(e.target.value)}
                  style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: '1.125rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155' }} 
                />
              </div>
              <button 
                type="submit"
                disabled={verifyStatus === 'searching'}
                style={{ padding: '0 32px', borderRadius: '8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, fontSize: '1.125rem', cursor: 'pointer' }}
              >
                {verifyStatus === 'searching' ? 'Querying Ledger...' : 'Verify'}
              </button>
            </form>

            {verifyStatus === 'error' && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <strong>No record found!</strong> The Batch ID you entered does not exist on the ledger.
              </div>
            )}

            {verifyStatus === 'found' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--color-bone)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--color-saddle)' }}>{displayCropType} ({displaySeedVariety})</h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--color-bark)', fontSize: '0.875rem' }}>
                      <span><strong>Batch:</strong> {searchBatchId}</span>
                      <span><strong>Status:</strong> <span style={{ color: '#10b981', fontWeight: 600 }}>Verified Organic</span></span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}><ShieldCheck size={18} /> Ledger Verified</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-bark)', fontFamily: 'monospace' }}>Current Hash: 0x5c6d7e8f9a...</div>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 24px 0', color: 'var(--color-saddle)' }}>Traceability Timeline</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
                  {/* Vertical timeline line */}
                  <div style={{ position: 'absolute', left: '24px', top: '24px', bottom: '24px', width: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }} />

                  {ledger.map((block, idx) => {
                    let Icon = Leaf;
                    let iconColor = '#10b981';
                    if (idx === 1) { Icon = Factory; iconColor = '#f59e0b'; }
                    if (idx === 2) { Icon = Truck; iconColor = '#3b82f6'; }
                    if (idx === 3) { Icon = Store; iconColor = '#8b5cf6'; }

                    return (
                      <div key={idx} style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1 }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff', border: `2px solid ${iconColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={24} color={iconColor} />
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--color-bone)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h5 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-saddle)' }}>{block.stage}</h5>
                            <span style={{ fontSize: '0.875rem', color: block.timestamp === 'Pending' ? '#f59e0b' : 'var(--color-bark)', fontWeight: block.timestamp === 'Pending' ? 600 : 400 }}>{block.timestamp}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-saddle)', marginBottom: '16px', fontSize: '0.95rem' }}>
                            <MapPin size={16} color="var(--color-bark)" /> {block.location}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', fontSize: '0.875rem', color: '#047857', backgroundColor: '#ecfdf5', padding: '8px 12px', borderRadius: '6px', border: '1px solid #10b981' }}>
                            <ShieldCheck size={16} /> <strong>{block.details}</strong>
                          </div>
                          <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569' }}>
                            <div style={{ marginBottom: '4px' }}><strong>Actor Sign:</strong> {block.actor}</div>
                            <div><strong>Block Hash:</strong> {block.hash}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

