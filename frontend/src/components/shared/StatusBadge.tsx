import { clsx } from 'clsx'

const colors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  new: 'bg-purple-100 text-purple-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  appointment_booked: 'bg-blue-100 text-blue-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  pending: 'bg-orange-100 text-orange-700',
  responded: 'bg-green-100 text-green-700',
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-slate-100 text-slate-600',
  negative: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge', colors[status] ?? 'bg-slate-100 text-slate-600')}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
