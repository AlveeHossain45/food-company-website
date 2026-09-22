import { Wheat, ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { formatNumber } from '../utils/format.js'

export default function ProductCard({ product, onView, onEdit, onDelete }) {
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
        <div className="pc-stat" title={`${formatNumber(product.producedKG)} KG`}>
          <strong>{formatNumber(product.producedBags || 0)}</strong>
          <span>Produced bags</span>
        </div>
        <div className="pc-stat" title={`${formatNumber(product.deliveredKG)} KG`}>
          <strong>{formatNumber(product.deliveredBags || 0)}</strong>
          <span>Delivered bags</span>
        </div>
        <div className="pc-stat" title={`${formatNumber(product.remainingKG)} KG`}>
          <strong style={{ color: 'var(--green-600)' }}>
            {formatNumber(product.remainingBags || 0)}
          </strong>
          <span>Stock bags</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onView?.(product)}
          style={{ flex: 1, justifyContent: 'space-between' }}
        >
          View Details <ArrowRight size={14} />
        </button>
        <button className="icon-action" title="Edit" onClick={() => onEdit?.(product)}>
          <Pencil size={15} />
        </button>
        <button
          className="icon-action danger"
          title="Delete"
          onClick={() => onDelete?.(product)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
