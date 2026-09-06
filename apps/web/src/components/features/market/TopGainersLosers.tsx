/**
 * @file src/components/features/market/TopGainersLosers.tsx
 * @description Widget showing top commodity price gainers and losers compared to the previous day.
 */
interface TopGainersLosersProps {
  marketData: any;
}

export default function TopGainersLosers({ marketData }: TopGainersLosersProps) {
  let gainers: any[] = [];
  let losers: any[] = [];

  if (marketData && marketData.mandis && marketData.mandis.length > 0) {
    // Sort mandis by vsAveragePct
    const sorted = [...marketData.mandis].sort((a, b) => b.vsAveragePct - a.vsAveragePct);
    gainers = sorted.filter(m => m.vsAveragePct > 0).slice(0, 3);
    // For losers, we want the lowest vsAveragePct, so reverse the sorted array
    losers = [...sorted].reverse().filter(m => m.vsAveragePct < 0).slice(0, 3);
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 20px 0', fontSize: '1.125rem' }}>
        Top Mandis vs Average (Today)
      </h2>
      
      <div style={{ marginBottom: '24px' }}>
        <span className="badge badge-success" style={{ marginBottom: '12px', display: 'inline-block' }}>HIGHEST PAYING</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {gainers.length > 0 ? gainers.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', paddingBottom: '12px', borderBottom: i !== gainers.length -1 ? '1px dashed var(--color-bone)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-saddle)' }}>
                  {m.name} <span style={{ fontSize: '0.75rem', color: 'var(--color-bark)', fontWeight: 400 }}>({m.district}, {m.state})</span>
                </span>
                <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.95rem' }}>
                  â‚¹{m.modal?.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>(+{m.vsAveragePct}%)</span>
                </span>
              </div>
              {(m.variety || m.arrivals) && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-bark)' }}>
                  {m.variety && <span style={{ backgroundColor: 'var(--color-parchment)', padding: '2px 6px', borderRadius: '4px' }}>ðŸŒ± {m.variety}</span>}
                  {m.quality && <span style={{ backgroundColor: 'var(--color-parchment)', padding: '2px 6px', borderRadius: '4px' }}>âœ¨ {m.quality}</span>}
                  {m.arrivals && <span style={{ backgroundColor: 'var(--color-parchment)', padding: '2px 6px', borderRadius: '4px' }}>ðŸ“¦ {m.arrivals}</span>}
                </div>
              )}
            </div>
          )) : (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-bark)' }}>No significant premium mandis found today.</div>
          )}
        </div>
      </div>

      <div>
        <span className="badge badge-danger" style={{ marginBottom: '12px', display: 'inline-block' }}>LOWEST PAYING</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {losers.length > 0 ? losers.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', paddingBottom: '12px', borderBottom: i !== losers.length -1 ? '1px dashed var(--color-bone)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-saddle)' }}>
                  {m.name} <span style={{ fontSize: '0.75rem', color: 'var(--color-bark)', fontWeight: 400 }}>({m.district}, {m.state})</span>
                </span>
                <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.95rem' }}>
                  â‚¹{m.modal?.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>({m.vsAveragePct}%)</span>
                </span>
              </div>
              {(m.variety || m.arrivals) && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-bark)' }}>
                  {m.variety && <span style={{ backgroundColor: 'var(--color-parchment)', padding: '2px 6px', borderRadius: '4px' }}>ðŸŒ± {m.variety}</span>}
                  {m.quality && <span style={{ backgroundColor: 'var(--color-parchment)', padding: '2px 6px', borderRadius: '4px' }}>âœ¨ {m.quality}</span>}
                  {m.arrivals && <span style={{ backgroundColor: 'var(--color-parchment)', padding: '2px 6px', borderRadius: '4px' }}>ðŸ“¦ {m.arrivals}</span>}
                </div>
              )}
            </div>
          )) : (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-bark)' }}>No significant discounted mandis found today.</div>
          )}
        </div>
      </div>
    </div>
  )
}


