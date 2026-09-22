import { useMemo } from 'react'
import { AlertTriangle, Wheat } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { getStockByProduct } from '../utils/calculations.js'
import { formatNumber } from '../utils/format.js'

const LOW_STOCK_BAGS = 100

export default function Stock() {
  const { production, delivery, products } = useData()

  const stockData = useMemo(
    () => getStockByProduct(production, delivery, products),
    [production, delivery, products]
  )

  const totalProduced = stockData.reduce((s, p) => s + p.producedBags, 0)
  const totalDelivered = stockData.reduce((s, p) => s + p.deliveredBags, 0)
  const totalRemaining = stockData.reduce((s, p) => s + p.remainingBags, 0)
  const totalProducedKG = stockData.reduce((s, p) => s + p.producedKG, 0)
  const totalDeliveredKG = stockData.reduce((s, p) => s + p.deliveredKG, 0)
  const totalRemainingKG = stockData.reduce((s, p) => s + p.remainingKG, 0)

  const lowStock = stockData.filter(p => p.remainingBags <= LOW_STOCK_BAGS)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Stock Overview</h1>
          <p>Live inventory across all products</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Produced</div>
          <div className="stat-value">{formatNumber(totalProduced)}<span>bags</span></div>
          <div className="stat-sub">≈ {formatNumber(totalProducedKG)} KG</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Delivered</div>
          <div className="stat-value">{formatNumber(totalDelivered)}<span>bags</span></div>
          <div className="stat-sub">≈ {formatNumber(totalDeliveredKG)} KG</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining Stock</div>
          <div className="stat-value" style={{ color: 'var(--green-600)' }}>
            {formatNumber(totalRemaining)}<span>bags</span>
          </div>
          <div className="stat-sub">≈ {formatNumber(totalRemainingKG)} KG available</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div
          className="card"
          style={{ borderColor: '#fbbf24', background: 'rgba(251,191,36,0.06)', marginBottom: 22 }}
        >
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3>Low Stock Alert</h3>
                <p>{lowStock.length} product(s) at or below {LOW_STOCK_BAGS} bags</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {lowStock.map(p => (
              <span key={p.id} className="badge badge-amber">
                {p.name}: {formatNumber(p.remainingBags)} bags
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Product-wise Stock</h3>
            <p>Produced vs Delivered vs Remaining (bags)</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Produced</th>
                <th>Delivered</th>
                <th>Remaining</th>
                <th>Stock Level</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map(p => {
                const pct =
                  p.producedBags > 0
                    ? Math.max(0, Math.min(100, (p.remainingBags / p.producedBags) * 100))
                    : 0
                const level = pct < 15 ? 'danger' : pct < 35 ? 'warn' : ''
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="activity-dot"><Wheat size={15} /></div>
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td>
                      {formatNumber(p.producedBags)}{' '}
                      <span className="text-muted text-sm">({formatNumber(p.producedKG)} kg)</span>
                    </td>
                    <td>
                      {formatNumber(p.deliveredBags)}{' '}
                      <span className="text-muted text-sm">({formatNumber(p.deliveredKG)} kg)</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--green-600)' }}>
                        {formatNumber(p.remainingBags)}
                      </strong>{' '}
                      <span className="text-muted text-sm">({formatNumber(p.remainingKG)} kg)</span>
                    </td>
                    <td style={{ minWidth: 160 }}>
                      <div className="progress">
                        <div className={`progress-fill ${level}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-muted text-sm">{pct.toFixed(0)}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
