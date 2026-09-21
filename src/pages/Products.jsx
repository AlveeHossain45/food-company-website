import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import { getStockByProduct } from '../utils/calculations.js'
import { formatNumber } from '../utils/format.js'

export default function Products() {
  const { products, production, delivery, addProduct } = useData()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  const enriched = useMemo(() => {
    const stock = getStockByProduct(production, delivery, products)
    return stock
  }, [products, production, delivery])

  const handleAdd = () => {
    if (!form.name.trim()) {
      setError('Product name is required')
      return
    }
    addProduct({
      name: form.name.trim(),
      description: form.description.trim() || '—',
      stock: 0,
    })
    showToast('Product added successfully', 'success')
    setForm({ name: '', description: '' })
    setError('')
    setModalOpen(false)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>{products.length} products across the mill</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="product-grid">
        {enriched.map(p => (
          <ProductCard key={p.id} product={p} onView={setViewing} />
        ))}
      </div>

      {/* Add Product Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Product"
        subtitle="Create a new product line"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Product</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Product Name</label>
          <input
            className="form-input"
            placeholder="e.g. Atta Premium"
            value={form.name}
            onChange={e => { setForm({ ...form, name: e.target.value }); setError('') }}
          />
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="Short description..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name || ''}
        subtitle={viewing?.description}
        footer={<Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>}
      >
        {viewing && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="stat-card">
              <div className="stat-label">Produced</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{formatNumber(viewing.produced)}<span>KG</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Delivered</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{formatNumber(viewing.delivered)}<span>KG</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Stock</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--green-600)' }}>
                {formatNumber(viewing.remaining)}<span>KG</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}