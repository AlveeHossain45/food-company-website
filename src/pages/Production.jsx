import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import DataTable from '../components/DataTable.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { getKgPerBag } from '../data/products.js'
import { formatDate, todayISO, formatNumber } from '../utils/format.js'

const emptyForm = {
  date: todayISO(),
  product: '',
  quantity: '',
  unit: 'Bags',
  note: '',
}

export default function Production() {
  const { production, products, addProduction, updateProduction, deleteProduction } = useData()
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

  const filtered = useMemo(() => {
    return production.filter(r => {
      const matchesSearch =
        r.product.toLowerCase().includes(search.toLowerCase()) ||
        (r.note || '').toLowerCase().includes(search.toLowerCase())
      const matchesDate = !dateFilter || r.date === dateFilter
      return matchesSearch && matchesDate
    })
  }, [production, search, dateFilter])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, date: todayISO(), product: products[0]?.name || '' })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (rec) => {
    setEditing(rec)
    setForm({ ...rec, quantity: String(rec.quantity) })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Date is required'
    if (!form.product) e.product = 'Product is required'
    const q = Number(form.quantity)
    if (!form.quantity || !Number.isInteger(q) || q <= 0) {
      e.quantity = 'Enter a positive whole number of bags'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

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
        await updateProduction(editing.id, payload)
        showToast('Production record updated', 'success')
      } else {
        await addProduction(payload)
        showToast('Production added successfully', 'success')
      }
      setModalOpen(false)
    } catch (err) {
      showToast(err?.message || 'Failed to save production record', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProduction(confirmId)
      showToast('Production record deleted', 'info')
    } catch (err) {
      showToast(err?.message || 'Failed to delete record', 'error')
    }
  }

  const previewKG = (Number(form.quantity) || 0) * getKgPerBag(form.product, products)

  const columns = [
    { header: 'Date', accessor: 'date', render: r => formatDate(r.date) },
    { header: 'Product', accessor: 'product', render: r => <strong>{r.product}</strong> },
    {
      header: 'Quantity',
      render: r => (
        <span className="badge badge-green">
          {formatNumber(r.quantity)} bags
          <em style={{ fontStyle: 'normal', opacity: 0.75, marginLeft: 6, fontWeight: 500 }}>
            · {formatNumber((Number(r.quantity) || 0) * getKgPerBag(r.product, products))} KG
          </em>
        </span>
      ),
    },
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

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Production</h1>
          <p>Manage and track daily production entries</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Production
        </Button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search by product or note..."
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
        {(dateFilter || search) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setDateFilter(''); setSearch('') }}
          >
            Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No production records"
        emptyMessage="Add your first production entry to get started."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Production' : 'Add Production'}
        subtitle="Enter production details below"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Production'}
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
            placeholder="e.g. 10"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
          />
          {errors.quantity && <div className="form-error">{errors.quantity}</div>}

          <div className="delivery-info-bar">
            <div className="dib-left">
              <span>
                Unit: <strong>Bags</strong> — every bag is packed by product weight
              </span>
            </div>
            {previewKG > 0 && (
              <div className="dib-right">
                {formatNumber(form.quantity || 0)} bags × {getKgPerBag(form.product, products)} KG ={' '}
                <strong>{formatNumber(previewKG)} KG</strong>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Production Note</label>
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
        title="Delete production record?"
        message="This action cannot be undone. The record will be permanently removed."
      />
    </>
  )
}
