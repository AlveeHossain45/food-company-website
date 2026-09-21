export default function ChartCard({ title, subtitle, actions, children }) {
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    )
  }