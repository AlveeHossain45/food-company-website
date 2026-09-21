import { useMemo, useState } from 'react'
import { Search, Download, Factory, Truck } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import DataTable from '../components/DataTable.jsx'
import Button from '../components/Button.jsx'
import { PRODUCT_NAMES } from '../data/products.js'
import { formatDate, formatNumber } from '../utils/format.js'

export default function History() {
  const { production, delivery } = useData()
  const [tab, setTab] = useState('production')
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const currentData = tab === 'production' ? production : delivery

  const filtered = useMemo(() => {
    return currentData.filter(r => {
      const matchesSearch =
        r.product.toLowerCase().includes(search.toLowerCase()) ||
        (r.customer || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.note || '').toLowerCase().includes(search.toLowerCase())
      const matchesProduct = !productFilter || r.product === productFilter
      const matchesFrom = !fromDate || r.date >= fromDate
      const matchesTo = !toDate || r.date <= toDate
      return matchesSearch && matchesProduct && matchesFrom && matchesTo
    })
  }, [currentData, search, productFilter, fromDate, toDate])

  const exportCSV = () => {
    const rows = tab === 'production'
      ? [['Date', 'Product', 'Quantity', 'Unit', 'Note', 'Added By'],
         ...filtered.map(r => [r.date, r.product, r.quantity, r.unit, r.note || '', r.addedBy || ''])]
      : [['Date', 'Product', 'Quantity', 'Unit', 'Customer', 'Note', 'Added By'],
         ...filtered.map(r => [r.date, r.product, r.quantity, r.unit, r.customer || '', r.note || '', r.addedBy || ''])]

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tab}-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const prodCols = [
    { header: 'Date', render: r => formatDate(r.date) },
    { header: 'Product', render: r => <strong>{r.product}</strong> },
    { header: 'Quantity', render: r => `${formatNumber(r.quantity)} ${r.unit}` },
    { header: 'Added By', render: r => r.addedBy || '—' },
  ]

  const delCols = [
    { header: 'Date', render: r => formatDate(r.date) },
    { header: 'Product', render: r => <strong>{r.product}</strong> },
    { header: 'Quantity', render: r => `${formatNumber(r.quantity)} ${r.unit}` },
    { header: 'Customer', render: r => r.customer || '—' },
    { header: 'Added By', render: r => r.addedBy || '—' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>History</h1>
          <p>Complete production and delivery archive</p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'production' ? 'active' : ''}`}
          onClick={() => setTab('production')}
        >
          <Factory size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Production History
        </button>
        <button
          className={`tab-btn ${tab === 'delivery' ? 'active' : ''}`}
          onClick={() => setTab('delivery')}
        >
          <Truck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Delivery History
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
        >
          <option value="">All Products</option>
          {PRODUCT_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="date"
          className="form-input"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          placeholder="From"
        />
        <input
          type="date"
          className="form-input"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          placeholder="To"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSearch(''); setProductFilter(''); setFromDate(''); setToDate('')
          }}
        >
          Clear
        </Button>
      </div>

      <DataTable
        columns={tab === 'production' ? prodCols : delCols}
        data={filtered}
        emptyTitle={`No ${tab} records`}
        emptyMessage="Try adjusting the filters."
      />
    </>
  )
}