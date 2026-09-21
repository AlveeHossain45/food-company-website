import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({
  icon,
  label,
  value,
  unit = '',
  trend,
  trendLabel,
  sub,
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        {trend != null && (
          <span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span>{unit}</span>}
      </div>
      {(trendLabel || sub) && (
        <div className="stat-sub">{trendLabel || sub}</div>
      )}
    </div>
  )
}