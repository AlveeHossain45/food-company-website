import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import DataTable from '../components/DataTable.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { PRODUCT_NAMES } from '../data/products.js'
import { formatDate, todayISO, formatNumber } from '../utils/format.js'

const emptyForm = {
  date: todayISO(),
  product: PRODUCT_NAMES[0],
  quantity: '',
  unit: 'KG',
  note: '',
}

export default function Production() {
  const { production, addProduction, updateProduction, deleteProduction } = useData()
  const { showToast } = useToast()
  const { user } = useAuth()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [confirmId, setConfirmId] = useState(null)

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
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (rec) => {
    setEditing(rec)
    setForm({ ...rec })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Date is required'
    if (!form.product) e.product = 'Product is required'
    const q = Number(form.quantity)
    if (!form.quantity || isNaN(q) || q <= 0) e.quantity = 'Enter a positive quantity'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      addedBy: user?.name || 'Admin',
    }
    if (editing) {
      updateProduction(editing.id, payload)
      showToast('Production record updated', 'success')
    } else {
      addProduction(payload)
      showToast('Production added successfully', 'success')
    }
    setModalOpen(false)
  }

  const handleDelete = () => {
    deleteProduction(confirmId)
    showToast('Production record deleted', 'info')
  }

  const columns = [
    { header: 'Date', accessor: 'date', render: r => formatDate(r.date) },
    { header: 'Product', accessor: 'product', render: r => <strong>{r.product}</strong> },
    {
      header: 'Quantity',
      render: r => <span className="badge badge-green">{formatNumber(r.quantity)} {r.unit}</span>,
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
        {dateFilter && (
          <Button variant="secondary" size="sm" onClick={() => setDateFilter('')}>
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
            <Button onClick={handleSubmit}>{editing ? 'Save Changes' : 'Add Production'}</Button>
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
              {PRODUCT_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              min="0"
              step="any"
              className="form-input"
              placeholder="e.g. 500"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
            />
            {errors.quantity && <div className="form-error">{errors.quantity}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select
              className="form-select"
              value={form.unit}
              onChange={e => setForm({ ...form, unit: e.target.value })}
            >
              <option value="KG">KG</option>
              <option value="Ton">Ton</option>
            </select>
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