import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  MessageSquare,
  CheckCircle2,
  XCircle,
  PenLine,
  ToggleRight,
  ChevronRight,
  Filter,
  LogIn,
  LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../../contexts/JobsContext.jsx'
import { getAuthEvents } from '../../lib/authEvents.js'

const ACTION_META = {
  comment:     { icon: MessageSquare, color: 'bg-sky-50 text-sky-600',         label: 'Kommentar' },
  approve:     { icon: CheckCircle2,  color: 'bg-emerald-50 text-emerald-600', label: 'Godkendt' },
  reject:      { icon: XCircle,       color: 'bg-rose-50 text-rose-600',       label: 'Afvist' },
  toggle_item: { icon: ToggleRight,   color: 'bg-amber-50 text-amber-600',     label: 'Ændret valg' },
  sign_offer:  { icon: PenLine,       color: 'bg-emerald-50 text-emerald-600', label: 'Underskrevet' },
  login:       { icon: LogIn,         color: 'bg-violet-50 text-violet-600',   label: 'Login' },
  logout:      { icon: LogOut,        color: 'bg-slate-100 text-slate-600',    label: 'Logud' },
}

const FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'login', label: 'Logins' },
  { value: 'sign_offer', label: 'Underskrifter' },
  { value: 'approve', label: 'Godkendte' },
  { value: 'reject', label: 'Afviste' },
  { value: 'comment', label: 'Kommentarer' },
  { value: 'toggle_item', label: 'Ændringer' },
]

export default function AdminActivity() {
  const { jobs } = useJobs()
  const [filter, setFilter] = useState('all')
  const [authEvents, setAuthEvents] = useState([])

  useEffect(() => {
    setAuthEvents(getAuthEvents())
    // Re-read ved focus saa nye logins vises uden fuld refresh
    function onFocus() {
      setAuthEvents(getAuthEvents())
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const feed = useMemo(() => {
    const all = []

    // Job-handlinger fra kunder
    jobs.forEach((job) => {
      ;(job.actions || []).forEach((action) => {
        all.push({
          source: 'job',
          id: action.id,
          action_type: action.action_type,
          actor_name: action.actor_name,
          message: action.message,
          created_at: action.created_at,
          job,
        })
      })
    })

    // Login/logout fra localStorage
    authEvents.forEach((e) => {
      all.push({
        source: 'auth',
        id: e.id,
        action_type: e.type, // 'login' | 'logout'
        actor_name: e.user_name,
        message: e.type === 'login' ? 'Loggede ind' : 'Loggede ud',
        created_at: e.timestamp,
        actor_email: e.user_email,
      })
    })

    const sorted = all.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    if (filter === 'all') return sorted
    return sorted.filter((a) => a.action_type === filter)
  }, [jobs, authEvents, filter])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-500" strokeWidth={2} />
          Aktivitetslog
        </h1>
        <p className="text-sm text-slate-500">
          Kunde-handlinger + bruger-logins · {feed.length} aktiviteter
        </p>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={clsx(
              'chip px-3 py-1.5 text-xs whitespace-nowrap flex-shrink-0 border-2 transition-colors',
              filter === f.value
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {feed.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6" strokeWidth={2} />
          </div>
          <p className="text-sm text-slate-500">Ingen aktivitet matcher filteret.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {feed.map((a) => {
            const meta = ACTION_META[a.action_type] || ACTION_META.comment
            const Icon = meta.icon
            const isJob = a.source === 'job'
            const Wrapper = isJob ? Link : 'div'
            const wrapperProps = isJob ? { to: `/jobs/${a.job.id}` } : {}
            return (
              <li key={a.id}>
                <Wrapper
                  {...wrapperProps}
                  className={clsx(
                    'px-4 py-3 flex items-start gap-3 transition-colors',
                    isJob && 'hover:bg-slate-50'
                  )}
                >
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
                      meta.color
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900">
                      <span className="font-semibold">{a.actor_name || 'Kunde'}</span>{' '}
                      <span className="text-slate-600">{a.message}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
                      {isJob ? (
                        <>
                          <span className="font-semibold">{a.job.job_number}</span>
                          <span>·</span>
                          <span>{a.job.customer?.name}</span>
                        </>
                      ) : (
                        a.actor_email && <span>{a.actor_email}</span>
                      )}
                      <span>·</span>
                      <span>{formatTime(a.created_at)}</span>
                    </div>
                  </div>
                  {isJob && (
                    <ChevronRight
                      className="w-4 h-4 text-slate-300 flex-shrink-0 self-center"
                      strokeWidth={2}
                    />
                  )}
                </Wrapper>
              </li>
            )
          })}
        </ul>
      )}
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
