import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, Award, Calendar, Layers, BarChart3,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import {
  getDailySeries, getMonthlySeries, getProductWise,
  filterByRange,
} from '../utils/calculations.js'
import { formatNumber } from '../utils/format.js'

/* ─────────────────────────────────────────────
 *  Range filter options
 * ───────────────────────────────────────────── */
const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d',    label: '7 Days' },
  { key: '30d',   label: '30 Days' },
  { key: 'month', label: 'This Month' },
  { key: '3m',    label: '3 Months' },
]

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#60a5fa', '#a78bfa', '#f59e0b', '#f472b6']

/* ─────────────────────────────────────────────
 *  Custom Tooltip
 * ───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color || p.fill }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <strong>{formatNumber(p.value)} bags</strong>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
 *  Stat Tile
 * ───────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, unit = 'bags', sub, accent = 'green' }) {
  const accents = {
    green:  { bg: 'rgba(34,197,94,0.10)',  color: '#16a34a' },
    blue:   { bg: 'rgba(96,165,250,0.12)', color: '#2563eb' },
    amber:  { bg: 'rgba(251,191,36,0.14)', color: '#d97706' },
    purple: { bg: 'rgba(167,139,250,0.14)',color: '#7c3aed' },
  }
  const a = accents[accent] || accents.green
  return (
    <div className="hero-stat">
      <div className="hero-stat-top">
        <div className="hero-stat-icon" style={{ background: a.bg, color: a.color }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="hero-stat-label">{label}</div>
      <div className="hero-stat-value">
        {value}
        {unit && <span>{unit}</span>}
      </div>
      {sub && <div className="hero-stat-sub">{sub}</div>}
    </div>
  )
}

export default function Analytics() {
  const { production, delivery, products } = useData()
  const [range, setRange] = useState('7d')

  /* ─── Filter records by range ─── */
  const prodFiltered = useMemo(() => filterByRange(production, range), [production, range])
  const delFiltered  = useMemo(() => filterByRange(delivery, range), [delivery, range])

  /* ─── Days count for averages ─── */
  const days = useMemo(() => {
    if (range === 'today') return 1
    if (range === '7d') return 7
    if (range === '30d') return 30
    if (range === 'month') {
      const now = new Date()
      return now.getDate()
    }
    return 90 // 3m
  }, [range])

  /* ─── Time series ─── */
  const series = useMemo(
    () => getDailySeries(
      { production: prodFiltered, delivery: delFiltered },
      Math.min(days, 90),
      true,
      products
    ),
    [prodFiltered, delFiltered, days, products]
  )

  /* ─── Monthly series ─── */
  const monthly = useMemo(
    () => getMonthlySeries({ production, delivery }, 6),
    [production, delivery]
  )

  /* ─── Product-wise data ─── */
  const productProd = useMemo(
    () => getProductWise(production, delivery, products, 'production'),
    [production, delivery, products]
  )
  const productDel = useMemo(
    () => getProductWise(production, delivery, products, 'delivery'),
    [production, delivery, products]
  )

  /* ─── Totals (in bags) ─── */
  const totalProd = prodFiltered.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
  const totalDel  = delFiltered.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
  const avgProd   = days > 0 ? totalProd / days : 0
  const avgDel    = days > 0 ? totalDel / days : 0

  /* ─── Highest days ─── */
  const highestProdDay = series.reduce(
    (m, d) => (d.production > (m.production || 0) ? d : m),
    {}
  )
  const highestDelDay = series.reduce(
    (m, d) => ((d.delivery || 0) > (m.delivery || 0) ? d : m),
    {}
  )

  /* ─── Net difference ─── */
  const netDiff = totalProd - totalDel
  const netTrend = totalProd > 0 ? (netDiff / totalProd) * 100 : 0

  return (
    <div className="dashboard-wrap">

      {/* ─────── HEADER ─────── */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <span className="dash-hero-greet">
            <BarChart3 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Analytics
          </span>
          <h1>Production Insights</h1>
          <p className="dash-hero-sub">
            Trends, comparisons, and performance metrics across all products
          </p>
        </div>

        <div className="chip-group" style={{ flexWrap: 'wrap' }}>
          {RANGES.map(r => (
            <button
              key={r.key}
              className={`chip ${range === r.key ? 'active' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─────── TOP STAT TILES ─────── */}
      <div className="hero-stats-grid">
        <StatTile
          icon={Layers}
          label="Total Production"
          value={formatNumber(totalProd)}
          unit="bags"
          sub={`≈ ${formatNumber(avgProd.toFixed(1))} bags/day`}
          accent="green"
        />
        <StatTile
          icon={TrendingUp}
          label="Total Delivery"
          value={formatNumber(totalDel)}
          unit="bags"
          sub={`≈ ${formatNumber(avgDel.toFixed(1))} bags/day`}
          accent="blue"
        />
        <StatTile
          icon={TrendingUp}
          label="Net Balance"
          value={formatNumber(netDiff)}
          unit="bags"
          sub={`${netTrend >= 0 ? '▲' : '▼'} ${Math.abs(netTrend).toFixed(1)}% retained`}
          accent={netDiff >= 0 ? 'green' : 'amber'}
        />
        <StatTile
          icon={Calendar}
          label="Active Products"
          value={products.length}
          unit=""
          sub={`Across ${series.length} day window`}
          accent="purple"
        />
      </div>

      {/* ─────── HIGHLIGHT TILES ─────── */}
      <div className="dash-row-2">
        <div className="dash-card highlight-card">
          <div className="highlight-icon up">
            <Award size={20} />
          </div>
          <div className="highlight-body">
            <div className="highlight-label">Highest Production Day</div>
            <div className="highlight-value">
              {formatNumber(highestProdDay.production || 0)}
              <span> bags</span>
            </div>
            <div className="highlight-sub">{highestProdDay.label || '—'}</div>
          </div>
        </div>

        <div className="dash-card highlight-card">
          <div className="highlight-icon blue">
            <Award size={20} />
          </div>
          <div className="highlight-body">
            <div className="highlight-label">Highest Delivery Day</div>
            <div className="highlight-value">
              {formatNumber(highestDelDay.delivery || 0)}
              <span> bags</span>
            </div>
            <div className="highlight-sub">{highestDelDay.label || '—'}</div>
          </div>
        </div>
      </div>

      {/* ─────── ROW: Production Trend + Delivery Trend ─────── */}
      <div className="dash-row-2">
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Production Trend</h3>
              <p>Daily output in bags</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="production"
                  name="Production"
                  stroke="#16a34a"
                  strokeWidth={2.4}
                  dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#16a34a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Delivery Trend</h3>
              <p>Daily dispatches in bags</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="delivery"
                  name="Delivery"
                  stroke="#60a5fa"
                  strokeWidth={2.4}
                  dot={{ r: 3, fill: '#60a5fa', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#60a5fa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─────── ROW: Production vs Delivery (bars) + Monthly ─────── */}
      <div className="dash-row-2">
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Production vs Delivery</h3>
              <p>Daily side-by-side comparison</p>
            </div>
            <div className="legend-chips">
              <span className="legend-chip">
                <i style={{ background: '#16a34a' }} /> Production
              </span>
              <span className="legend-chip">
                <i style={{ background: '#60a5fa' }} /> Delivery
              </span>
            </div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={series} margin={{ top: 10, right: 8, left: -20, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(34,197,94,0.06)' }} />
                <Bar dataKey="production" name="Production" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={24} />
                <Bar dataKey="delivery" name="Delivery" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Monthly Overview</h3>
              <p>Last 6 months in bags</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={monthly} margin={{ top: 10, right: 8, left: -20, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(34,197,94,0.06)' }} />
                <Bar dataKey="production" name="Production" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="delivery" name="Delivery" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─────── ROW: Pie charts ─────── */}
      <div className="dash-row-2">
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Product-wise Production</h3>
              <p>Share of total output</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={productProd}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  innerRadius={52}
                  paddingAngle={3}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {productProd.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom legend */}
          <div className="pie-legend">
            {productProd.map((p, i) => (
              <div key={p.name} className="pie-legend-item">
                <span className="pie-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="pie-legend-name">{p.fullName}</span>
                <strong>{formatNumber(p.value)} bags</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Product-wise Delivery</h3>
              <p>Share of total dispatches</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={productDel}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  innerRadius={52}
                  paddingAngle={3}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {productDel.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pie-legend">
            {productDel.map((p, i) => (
              <div key={p.name} className="pie-legend-item">
                <span className="pie-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="pie-legend-name">{p.fullName}</span>
                <strong>{formatNumber(p.value)} bags</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}