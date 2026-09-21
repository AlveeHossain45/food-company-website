import EmptyState from './EmptyState.jsx'

export default function DataTable({ columns, data, emptyTitle, emptyMessage }) {
  if (!data || data.length === 0) {
    return (
      <div className="table-wrap">
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={row.id || ri}>
              {columns.map((col, ci) => (
                <td key={ci}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}