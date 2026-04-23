import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  PenLine,
  ToggleLeft,
  ToggleRight,
  Activity,
} from 'lucide-react'
import clsx from 'clsx'

const ACTION_META = {
  comment:     { icon: MessageSquare, color: 'bg-sky-50 text-sky-600',         label: 'Kommentar' },
  approve:     { icon: CheckCircle2,  color: 'bg-emerald-50 text-emerald-600', label: 'Godkendt' },
  reject:      { icon: XCircle,       color: 'bg-rose-50 text-rose-600',       label: 'Afvist' },
  toggle_item: { icon: ToggleRight,   color: 'bg-amber-50 text-amber-600',     label: 'Ændret valg' },
  sign_offer:  { icon: PenLine,       color: 'bg-emerald-50 text-emerald-600', label: 'Underskrevet' },
}

export default function ActivityFeed({ actions = [] }) {
  if (!actions.length) {
    return (
      <div className="card p-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Activity className="w-6 h-6" strokeWidth={2} />
        </div>
        <p className="text-sm text-slate-500">Ingen aktivitet fra kunden endnu.</p>
      </div>
    )
  }

  // Nyeste først
  const sorted = [...actions].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-500" strokeWidth={2} />
        <h3 className="text-sm font-bold text-slate-900">Aktivitet fra kunden</h3>
        <span className="chip bg-slate-100 text-slate-700 text-[10px]">{sorted.length}</span>
      </div>
      <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {sorted.map((a) => {
          const meta = ACTION_META[a.action_type] || ACTION_META.comment
          const Icon = meta.icon
          return (
            <li key={a.id} className="px-4 py-3 flex items-start gap-3">
              <div
                className={clsx(
                  'w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0',
                  meta.color
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-900">
                  <span className="font-semibold">{a.actor_name || 'Kunde'}</span>{' '}
                  <span className="text-slate-600">{a.message}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{formatTime(a.created_at)}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) {
      return `i dag kl. ${d.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
