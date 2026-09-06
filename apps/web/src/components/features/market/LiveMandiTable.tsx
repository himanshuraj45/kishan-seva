/**
 * @file src/components/features/market/LiveMandiTable.tsx
 * @description Sortable table of live APMC mandi prices for a selected commodity, fetched from the market API.
 */
import { Loader2, AlertCircle } from 'lucide-react'

interface LiveMandiTableProps {
  loading: boolean
  error: string | null
  mandis: any[]
  avgPrice: number
}

export default function LiveMandiTable({ loading, error, mandis, avgPrice }: LiveMandiTableProps) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px 0', fontSize: '1.25rem' }}>Live Mandi Prices</h2>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="spin" size={32} color="var(--color-honey-amber)" /></div>
      ) : error ? (
        <div style={{ padding: '16px', color: 'var(--color-danger)', display: 'flex', gap: '8px' }}><AlertCircle /> {error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="ks-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ borderBottom: '1px solid var(--color-bone)' }}>
              <tr style={{ textAlign: 'left', color: 'var(--color-saddle)' }}>
                <th style={{ padding: '12px' }}>Mandi Name</th>
                <th style={{ padding: '12px' }}>State</th>
                <th style={{ padding: '12px' }}>Arrivals</th>
                <th style={{ padding: '12px' }}>Min</th>
                <th style={{ padding: '12px' }}>Modal</th>
                <th style={{ padding: '12px' }}>Max</th>
                <th style={{ padding: '12px' }}>vs Avg</th>
              </tr>
            </thead>
            <tbody>
              {mandis.map((m: any, idx: number) => {
                const isBest = idx === 0;
                const delta = m.modal - avgPrice;
                return (
                  <tr key={m.id} className={isBest ? 'best' : ''} style={{ borderBottom: '1px solid var(--color-bone)', backgroundColor: isBest ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{m.name} {isBest && <span className="badge badge-success" style={{ marginLeft: '8px' }}>Best</span>}</td>
                    <td style={{ padding: '12px' }}>{m.state}</td>
                    <td style={{ padding: '12px', color: 'var(--color-bark)' }}>{m.arrivals || 'N/A'}</td>
                    <td style={{ padding: '12px', color: 'var(--color-bark)' }}>â‚¹{m.min}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>â‚¹{m.modal}</td>
                    <td style={{ padding: '12px', color: 'var(--color-bark)' }}>â‚¹{m.max}</td>
                    <td style={{ padding: '12px', color: delta > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {delta > 0 ? '+' : ''}â‚¹{delta}
                    </td>
                  </tr>
                )
              })}
              {mandis.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-bark)' }}>No data available for this selection.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


