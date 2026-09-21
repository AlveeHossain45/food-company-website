import { Wheat, ArrowRight } from 'lucide-react'
import { formatNumber } from '../utils/format.js'

export default function ProductCard({ product, onView }) {
  return (
    <div className="product-card">
      <div className="pc-top">
        <div className="pc-icon">
          <Wheat size={22} />
        </div>
        <div>
          <h4>{product.name}</h4>
          <p className="pc-desc">{product.description}</p>
        </div>
      </div>

      <div className="pc-stats">
        <div className="pc-stat">
          <strong>{formatNumber(product.produced || 0)}</strong>
          <span>Produced</span>
        </div>
        <div className="pc-stat">
          <strong>{formatNumber(product.delivered || 0)}</strong>
          <span>Delivered</span>
        </div>
        <div className="pc-stat">
          <strong style={{ color: 'var(--green-600)' }}>
            {formatNumber(product.remaining || 0)}
          </strong>
          <span>Stock</span>
        </div>
      </div>

      <button
        className="btn btn-secondary btn-sm w-full"
        onClick={() => onView?.(product)}
        style={{ justifyContent: 'space-between' }}
      >
        View Details <ArrowRight size={14} />
      </button>
    </div>
  )
}