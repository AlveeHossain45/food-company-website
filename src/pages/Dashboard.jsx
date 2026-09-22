import { useMemo, useState } from 'react'
import {
  Factory, Truck, Package, Boxes, ArrowUpRight, ArrowDownRight,
  Target, Clock, Wheat, Layers,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar,
} from 'recharts'
import { useData } from '../context/DataContext.jsx'
import {
  getTodayBags, getYesterdayBags, getStockByProduct,
  getDailySeries, percentChange, getTodayByProduct,
} from '../utils/calculations.js'
import {
  formatNumber, getGreeting, getFullDate, formatDateTime, formatDate, todayISO,
} from '../utils/format.js'
import { getKgPerBag } from '../data/products.js'

/* ─────────────────────────────────────────────
 *  Chart range options
 * ───────────────────────────────────────────── */
const RANGES = [
  { key: 7,  label: '7D' },
  { key: 30, label: '30D' },
  { key: 90, label: '3M' },
]

/* ─────────────────────────────────────────────
 *  Hero Stat Card — clean minimal design
 * ───────────────────────────────────────────── */
function HeroStat({ icon: Icon, label, value, unit, trend, sub, accent = 'green' }) {
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
          <Icon size={19} />
        </div>
        {trend != null && (
          <span className={`hero-stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
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

/* ─────────────────────────────────────────────
 *  Custom Tooltip for charts
 * ───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <strong>{formatNumber(p.value)} bags</strong>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { production, delivery, products } = useData()
  const [range, setRange] = useState(7)

  /* ─── Core today metrics (BAGS) ─── */
  const todayProd = useMemo(() => getTodayBags(production), [production])
  const todayDel  = useMemo(() => getTodayBags(delivery), [delivery])
  const yProd     = useMemo(() => getYesterdayBags(production), [production])
  const yDel      = useMemo(() => getYesterdayBags(delivery), [delivery])

  /* ─── Stock data ─── */
  const stockData = useMemo(
    () => getStockByProduct(production, delivery, products),
    [production, delivery, products]
  )
  const totalStockBags = stockData.reduce((s, p) => s + p.remainingBags, 0)
  const totalStockKG   = stockData.reduce((s, p) => s + p.remainingKG, 0)

  /* ─── Trend percentages ─── */
  const prodTrend = percentChange(todayProd, yProd)
  const delTrend  = percentChange(todayDel, yDel)

  /* ─── Time series for charts ─── */
  const series = useMemo(
    () => getDailySeries({ production, delivery }, range, true, products),
    [production, delivery, products, range]
  )

  /* ─── Today's per-product snapshot ─── */
  const todayByProduct = useMemo(
    () => getTodayByProduct(production, delivery, products),
    [production, delivery, products]
  )

  /* ─── Recent activity (last 5) ─── */
  const recentActivity = useMemo(() => {
    const all = [
      ...production.map(r => ({ ...r, type: 'production' })),
      ...delivery.map(r => ({ ...r, type: 'delivery' })),
    ]
    const key = r => r.createdAt || `${r.date || ''}T00:00:00`
    return all.sort((a, b) => key(b).localeCompare(key(a))).slice(0, 5)
  }, [production, delivery])

  /* ─── Today's total KG (for header chip) ─── */
  const todayProdKG = useMemo(() => {
    const today = todayISO()
    return production
      .filter(r => r.date === today)
      .reduce(
        (sum, r) => sum + (Number(r.quantity) || 0) * getKgPerBag(r.product, products),
        0
      )
  }, [production, products])

  /* ─── Goal progress ─── */
  const goal = 30 // bags
  const goalPct = Math.min(100, (todayProd / goal) * 100)
  const goalRemaining = Math.max(0, goal - todayProd)

  return (
    <div className="dashboard-wrap">

      {/* ─────── HERO HEADER ─────── */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <span className="dash-hero-greet">{getGreeting()} 👋</span>
          <h1>Production Overview</h1>
          <p className="dash-hero-sub">
            Yusuf Flower Mills LTD · <strong>{getFullDate()}</strong>
          </p>
        </div>

        <div className="dash-hero-badge">
          <div className="dhb-icon">
            <Layers size={18} />
          </div>
          <div>
            <div className="dhb-label">Today's Output</div>
            <div className="dhb-value">
              {formatNumber(todayProd)} <span>bags</span>
              <em>· {formatNumber(todayProdKG)} KG</em>
            </div>
          </div>
        </div>
      </div>

      {/* ─────── HERO STATS ─────── */}
      <div className="hero-stats-grid">
        <HeroStat
          icon={Factory}
          label="Today's Production"
          value={formatNumber(todayProd)}
          unit="bags"
          trend={prodTrend}
          sub={`vs ${formatNumber(yProd)} bags yesterday`}
          accent="green"
        />
        <HeroStat
          icon={Truck}
          label="Today's Delivery"
          value={formatNumber(todayDel)}
          unit="bags"
          trend={delTrend}
          sub={`vs ${formatNumber(yDel)} bags yesterday`}
          accent="blue"
        />
        <HeroStat
          icon={Package}
          label="Current Stock"
          value={formatNumber(totalStockBags)}
          unit="bags"
          sub={`≈ ${formatNumber(totalStockKG)} KG available`}
          accent="amber"
        />
        <HeroStat
          icon={Boxes}
          label="Total Products"
          value={products.length}
          sub="Active product lines"
          accent="purple"
        />
      </div>

      {/* ─────── ROW: Goal + Activity ─────── */}
      <div className="dash-row-2">
        {/* Goal Card */}
        <div className="dash-card goal-card">
          <div className="goal-card-top">
            <div>
              <div className="dash-card-label">
                <Target size={13} /> Today's Production Goal
              </div>
              <div className="goal-value">
                {formatNumber(todayProd)}
                <span>/ {goal} bags</span>
              </div>
            </div>
            <div className="goal-ring">
              <svg viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" className="ring-bg" />
                <circle
                  cx="22" cy="22" r="18"
                  className="ring-fill"
                  strokeDasharray={`${(goalPct / 100) * 113} 113`}
                />
              </svg>
              <span>{goalPct.toFixed(0)}%</span>
            </div>
          </div>

          <div className="progress" style={{ marginTop: 16 }}>
            <div className="progress-fill" style={{ width: `${goalPct}%` }} />
          </div>

          <div className="goal-note">
            {goalPct >= 100
              ? '🎉 Goal achieved — excellent work!'
              : `${goalRemaining} more bags to reach today's target`}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dash-card activity-card">
          <div className="dash-card-head">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest production & delivery updates</p>
            </div>
            <Clock size={16} className="text-muted" />
          </div>

          <div className="activity-feed">
            {recentActivity.length === 0 && (
              <p className="text-muted text-sm">No recent activity yet.</p>
            )}
            {recentActivity.map(a => (
              <div key={a.id} className="feed-item">
                <div className={`feed-dot ${a.type}`}>
                  {a.type === 'production' ? <Factory size={14} /> : <Truck size={14} />}
                </div>
                <div className="feed-body">
                  <div className="feed-title">
                    <strong>{formatNumber(a.quantity)} bags</strong>{' '}
                    <span>{a.product}</span>
                  </div>
                  <div className="feed-meta">
                    {a.type === 'production'
                      ? 'Produced'
                      : `Delivered to ${a.customer || 'Customer'}`}
                    {' · '}
                    {a.createdAt ? formatDateTime(a.createdAt) : formatDate(a.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────── ROW: Production Trend + Today's by Product ─────── */}
      <div className="dash-row-2">
        {/* Production Trend Chart */}
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Production Trend</h3>
              <p>Daily output in bags</p>
            </div>
            <div className="chip-group">
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

          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart
                data={series}
                margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-soft)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="production"
                  name="Production"
                  stroke="#16a34a"
                  strokeWidth={2.4}
                  fill="url(#prodFill)"
                  dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#16a34a' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Production by Product */}
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Today by Product</h3>
              <p>Live snapshot for today</p>
            </div>
            <Wheat size={16} className="text-muted" />
          </div>

          <div className="product-snapshot">
            {todayByProduct.length === 0 && (
              <p className="text-muted text-sm" style={{ padding: '16px 4px' }}>
                No production recorded today.
              </p>
            )}
            {todayByProduct.map(p => {
              const pct = p.productionBags > 0
                ? Math.min(100, (p.deliveryBags / p.productionBags) * 100)
                : 0
              return (
                <div key={p.name} className="snapshot-row">
                  <div className="snapshot-icon">
                    <Wheat size={15} />
                  </div>
                  <div className="snapshot-main">
                    <div className="snapshot-top">
                      <strong>{p.name}</strong>
                      <span className="snapshot-bag-info">
                        {formatNumber(p.productionBags)} bags
                      </span>
                    </div>
                    <div className="snapshot-bar">
                      <div
                        className="snapshot-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="snapshot-meta">
                      <span>Delivered: {formatNumber(p.deliveryBags)} bags</span>
                      <span className="snapshot-remaining">
                        Remaining: {formatNumber(p.remainingBags)} bags
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─────── Production vs Delivery ─────── */}
      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <h3>Production vs Delivery</h3>
            <p>Compare daily output against dispatches</p>
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

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart
              data={series}
              margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-soft)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(34,197,94,0.06)' }} />
              <Bar
                dataKey="production"
                name="Production"
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
                maxBarSize={26}
              />
              <Bar
                dataKey="delivery"
                name="Delivery"
                fill="#60a5fa"
                radius={[6, 6, 0, 0]}
                maxBarSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}