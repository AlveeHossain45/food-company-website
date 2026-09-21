import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No data found', message = 'Nothing to display here yet.' }) {
  return (
    <div className="empty-state">
      <Inbox size={42} />
      <h4>{title}</h4>
      <p>{message}</p>
    </div>
  )
}