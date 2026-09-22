import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { getStockByProduct } from '../utils/calculations.js'
import { formatNumber } from '../utils/format.js'

export default function Products() {
  const { products, production, delivery, mode, addProduct, updateProduct, deleteProduct } = useData()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', kgPerBag: 50 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const enriched = useMemo(
    () => getStockByProduct(production, delivery, products),
    [products, production, delivery]
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', description: '', kgPerBag: 50 })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description === '—' ? '' : product.description || '',
      kgPerBag: product.kgPerBag,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name) {
      setError('Product name is required')
      return
    }
    const dup = products.some(
      p => p.id !== editing?.id && p.name.toLowerCase() === name.toLowerCase()
    )
    if (dup) {
      setError('A product with this name already exists')
      return
    }
    const kg = Number(form.kgPerBag)
    if (!Number.isFinite(kg) || kg <= 0 || kg > 1000) {
      setError('Weight per bag must be between 1 and 1000 kg')
      return
    }

    const payload = {
      name,
      description: form.description.trim() || '—',
      kgPerBag: kg,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
        showToast('Product updated successfully', 'success')
        if (viewing?.id === editing.id) setViewing(null)
      } else {
        await addProduct(payload)
        showToast('Product added successfully', 'success')
      }
      setModalOpen(false)
    } catch (err) {
      showToast(err?.message || 'Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const target = enriched.find(p => p.id === confirmId)
    if (!target) {
      setConfirmId(null)
      return
    }
    // Mirror the server rule in local mode (server enforces it itself)
    if (mode !== 'server' && (target.producedBags > 0 || target.deliveredBags > 0)) {
      showToast('Cannot delete: product has production or delivery records', 'error')
      setConfirmId(null)
      return
    }
    try {
      await deleteProduct(confirmId)
      showToast('Product deleted', 'info')
      if (viewing?.id === confirmId) setViewing(null)
    } catch (err) {
      showToast(err?.message || 'Failed to delete product', 'error')
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>{products.length} products across the mill</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="product-grid">
        {enriched.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onView={setViewing}
            onEdit={openEdit}
            onDelete={p => setConfirmId(p.id)}
          />
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add New Product'}
        subtitle={editing ? 'Update product details' : 'Create a new product line'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Product'}
            </Button>
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
          <label className="form-label">Weight per Bag (KG)</label>
          <input
            type="number"
            min="1"
            max="1000"
            step="0.5"
            className="form-input"
            placeholder="e.g. 50"
            value={form.kgPerBag}
            onChange={e => { setForm({ ...form, kgPerBag: e.target.value }); setError('') }}
          />
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
              <div className="stat-value" style={{ fontSize: 20 }}>
                {formatNumber(viewing.producedBags)}<span>bags</span>
              </div>
              <div className="stat-sub">{formatNumber(viewing.producedKG)} KG</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Delivered</div>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {formatNumber(viewing.deliveredBags)}<span>bags</span>
              </div>
              <div className="stat-sub">{formatNumber(viewing.deliveredKG)} KG</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Stock</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--green-600)' }}>
                {formatNumber(viewing.remainingBags)}<span>bags</span>
              </div>
              <div className="stat-sub">{formatNumber(viewing.remainingKG)} KG</div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete product?"
        message="This action cannot be undone. The product will be permanently removed."
      />
    </>
  )
}
