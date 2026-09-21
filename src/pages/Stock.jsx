import { useMemo } from 'react'
import { AlertTriangle, Wheat } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { getStockByProduct } from '../utils/calculations.js'
import { formatNumber } from '../utils/format.js'

const LOW_STOCK_THRESHOLD = 100

export default function Stock() {
  const { production, delivery, products } = useData()

  const stockData = useMemo(
    () => getStockByProduct(production, delivery, products),
    [production, delivery, products]
  )

  const totalProduced = stockData.reduce((s, p) => s + p.produced, 0)
  const totalDelivered = stockData.reduce((s, p) => s + p.delivered, 0)
  const totalRemaining = stockData.reduce((s, p) => s + p.remaining, 0)

  const lowStock = stockData.filter(p => p.remaining <= LOW_STOCK_THRESHOLD)

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
          <div className="stat-value">{formatNumber(totalProduced)}<span>KG</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Delivered</div>
          <div className="stat-value">{formatNumber(totalDelivered)}<span>KG</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining Stock</div>
          <div className="stat-value" style={{ color: 'var(--green-600)' }}>
            {formatNumber(totalRemaining)}<span>KG</span>
          </div>
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
                <p>{lowStock.length} product(s) at or below {LOW_STOCK_THRESHOLD} KG</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {lowStock.map(p => (
              <span key={p.id} className="badge badge-amber">
                {p.name}: {formatNumber(p.remaining)} KG
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Product-wise Stock</h3>
            <p>Produced vs Delivered vs Remaining</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Produced (KG)</th>
                <th>Delivered (KG)</th>
                <th>Remaining (KG)</th>
                <th>Stock Level</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map(p => {
                const pct = p.produced > 0 ? Math.min(100, (p.remaining / p.produced) * 100) : 0
                const level = pct < 15 ? 'danger' : pct < 35 ? 'warn' : ''
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="activity-dot"><Wheat size={15} /></div>
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td>{formatNumber(p.produced)}</td>
                    <td>{formatNumber(p.delivered)}</td>
                    <td>
                      <strong style={{ color: 'var(--green-600)' }}>
                        {formatNumber(p.remaining)}
                      </strong>
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