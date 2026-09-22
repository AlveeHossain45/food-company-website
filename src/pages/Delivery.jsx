import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, PackageCheck } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import DataTable from '../components/DataTable.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { getKgPerBag } from '../data/products.js'
import { formatDate, todayISO, formatNumber } from '../utils/format.js'
import { getAvailableBags } from '../utils/calculations.js'

const emptyForm = {
  date: todayISO(),
  product: '',
  quantity: '',
  unit: 'Bags',
  customer: '',
  note: '',
}

export default function Delivery() {
  const { delivery, production, products, addDelivery, updateDelivery, deleteDelivery } = useData()
  const { showToast } = useToast()
  const { user } = useAuth()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [confirmId, setConfirmId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')

  /* ─── Available bags for a product ─── */
  const availableBags = (productName, editingId = null) =>
    getAvailableBags(productName, production, delivery, editingId)

  /* ─── Filtered list ─── */
  const filtered = useMemo(() => {
    return delivery.filter(r => {
      const matchesSearch =
        r.product.toLowerCase().includes(search.toLowerCase()) ||
        (r.customer || '').toLowerCase().includes(search.toLowerCase())
      const matchesDate = !dateFilter || r.date === dateFilter
      const matchesProduct = !productFilter || r.product === productFilter
      return matchesSearch && matchesDate && matchesProduct
    })
  }, [delivery, search, dateFilter, productFilter])

  /* ─── Open add / edit ─── */
  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, date: todayISO(), product: products[0]?.name || '' })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (rec) => {
    setEditing(rec)
    setForm({ ...rec })
    setErrors({})
    setModalOpen(true)
  }

  /* ─── Validation ─── */
  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Date is required'
    if (!form.product) e.product = 'Product is required'
    if (!form.customer?.trim()) e.customer = 'Customer name is required'

    const bags = Number(form.quantity)
    if (!form.quantity || !Number.isInteger(bags) || bags <= 0) {
      e.quantity = 'Enter a positive whole number of bags'
    } else {
      const available = availableBags(form.product, editing?.id)
      if (bags > available) {
        e.quantity = `Only ${formatNumber(available)} bags available in stock`
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    if (!validate()) return
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      unit: 'Bags',
      addedBy: user?.name || 'Admin',
    }
    setSaving(true)
    try {
      if (editing) {
        await updateDelivery(editing.id, payload)
        showToast('Delivery record updated', 'success')
      } else {
        await addDelivery(payload)
        showToast('Delivery added successfully', 'success')
      }
      setModalOpen(false)
    } catch (err) {
      showToast(err?.message || 'Failed to save delivery record', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Delete ─── */
  const handleDelete = async () => {
    try {
      await deleteDelivery(confirmId)
      showToast('Delivery record deleted', 'info')
    } catch (err) {
      showToast(err?.message || 'Failed to delete record', 'error')
    }
  }

  /* ─── Table columns ─── */
  const columns = [
    { header: 'Date', render: r => formatDate(r.date) },
    { header: 'Product', render: r => <strong>{r.product}</strong> },
    {
      header: 'Quantity',
      render: r => (
        <span className="badge badge-amber">
          {formatNumber(r.quantity)} bags
          <em style={{ fontStyle: 'normal', opacity: 0.75, marginLeft: 6, fontWeight: 500 }}>
            · {formatNumber((Number(r.quantity) || 0) * getKgPerBag(r.product, products))} KG
          </em>
        </span>
      ),
    },
    { header: 'Customer', render: r => r.customer || '—' },
    { header: 'Note', render: r => r.note || <span className="text-muted">—</span> },
    {
      header: 'Action',
      render: r => (
        <div className="table-actions">
          <button className="icon-action" title="Edit" onClick={() => openEdit(r)}>
            <Pencil size={15} />
          </button>
          <button
            className="icon-action danger"
            title="Delete"
            onClick={() => setConfirmId(r.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  /* ─── Current available stock for the selected form product ─── */
  const currentAvailable = availableBags(form.product, editing?.id)
  const currentKgPerBag = getKgPerBag(form.product, products)
  const previewKg = (Number(form.quantity) || 0) * currentKgPerBag

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Delivery</h1>
          <p>Track outgoing deliveries and customers</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Add Delivery</Button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search by product or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <input
          type="date"
          className="form-input"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
        <select
          className="form-select"
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
        >
          <option value="">All Products</option>
          {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        {(dateFilter || productFilter || search) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setSearch(''); setDateFilter(''); setProductFilter('') }}
          >
            Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No delivery records"
        emptyMessage="Add your first delivery entry to get started."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Delivery' : 'Add Delivery'}
        subtitle="Enter delivery details below"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Delivery'}
            </Button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Product</label>
            <select
              className="form-select"
              value={form.product}
              onChange={e => setForm({ ...form, product: e.target.value })}
            >
              {products.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name} ({getKgPerBag(p.name, products)} kg/bag)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Number of Bags</label>
          <input
            type="number"
            min="1"
            step="1"
            className="form-input"
            placeholder="e.g. 5"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
          />
          {errors.quantity && <div className="form-error">{errors.quantity}</div>}

          {/* Live info bar */}
          <div className="delivery-info-bar">
            <div className="dib-left">
              <PackageCheck size={14} />
              <span>
                Available: <strong>{formatNumber(currentAvailable)}</strong> bags
                {' '}({formatNumber(currentAvailable * currentKgPerBag)} KG)
              </span>
            </div>
            {previewKg > 0 && (
              <div className="dib-right">
                {formatNumber(form.quantity || 0)} bags × {currentKgPerBag} KG ={' '}
                <strong>{formatNumber(previewKg)} KG</strong>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Customer / Receiver</label>
          <input
            className="form-input"
            placeholder="e.g. Dhaka Bakery House"
            value={form.customer}
            onChange={e => setForm({ ...form, customer: e.target.value })}
          />
          {errors.customer && <div className="form-error">{errors.customer}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Delivery Note</label>
          <textarea
            className="form-textarea"
            placeholder="Optional note..."
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete delivery record?"
        message="This action cannot be undone. The record will be permanently removed."
      />
    </>
  )
}