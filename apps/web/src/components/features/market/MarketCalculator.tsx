'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, IndianRupee } from 'lucide-react';

interface MarketCalculatorProps {
  currentPrice: number;
  cropName: string;
}

export default function MarketCalculator({ currentPrice, cropName }: MarketCalculatorProps) {
  const [quantity, setQuantity] = useState<string>('10'); // in quintals
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [transportCost, setTransportCost] = useState<string>('500');

  useEffect(() => {
    if (currentPrice > 0) {
      setPrice(currentPrice.toString());
    }
  }, [currentPrice]);

  const qty = parseFloat(quantity) || 0;
  const prc = parseFloat(price) || 0;
  const trn = parseFloat(transportCost) || 0;
  const grossRevenue = qty * prc;
  const netProfit = grossRevenue - trn;

  return (
    <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <div style={{ padding: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', color: 'white' }}>
          <Calculator size={20} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.125rem', color: 'var(--color-saddle)' }}>Profit Calculator</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-bark)' }}>Total Yield (Quintals)</label>
          <input type="number" className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-bone)' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-bark)' }}>Price per Quintal (₹)</label>
          <input type="number" className="input" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-bone)' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '4px' }}>Auto-filled with current {cropName} avg</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-bark)' }}>Est. Transport / Other Costs (₹)</label>
          <input type="number" className="input" value={transportCost} onChange={(e) => setTransportCost(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-bone)' }} />
        </div>

        <div style={{ marginTop: '8px', padding: '16px', backgroundColor: 'var(--color-parchment)', borderRadius: '8px', border: '1px solid var(--color-bone)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-saddle)' }}>
            <span>Gross Revenue:</span>
            <span style={{ fontWeight: 600 }}>₹{grossRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '1.125rem' }}>
            <span style={{ fontWeight: 600 }}>{netProfit >= 0 ? 'Net Profit:' : 'Net Loss:'}</span>
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}><IndianRupee size={16} /> {Math.abs(netProfit).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

