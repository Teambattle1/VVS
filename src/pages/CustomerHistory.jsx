import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  LogOut,
  ChevronRight,
  MapPin,
  Building2,
  User as UserIcon,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import clsx from 'clsx'
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx'
import { useJobs } from '../contexts/JobsContext.jsx'
import { jobTotal, formatDKK, toInclVat } from '../lib/pricing.js'
import BrandIcon from '../components/BrandIcon.jsx'

const STATUS = {
  draft:       { icon: Clock,         label: 'Kladde',   color: 'bg-slate-100 text-slate-700' },
  sent:        { icon: Inbox,         label: 'Afventer', color: 'bg-amber-100 text-amber-800' },
  approved:    { icon: CheckCircle2,  label: 'Godkendt', color: 'bg-emerald-100 text-emerald-800' },
  rejected:    { icon: XCircle,       label: 'Afvist',   color: 'bg-rose-100 text-rose-800' },
  in_progress: { icon: Clock,         label: 'I gang',   color: 'bg-sky-100 text-sky-800' },
  done:        { icon: CheckCircle2,  label: 'Færdig',   color: 'bg-slate-200 text-slate-700' },
}

export default function CustomerHistory() {
  const { customer, signOut, loading } = useCustomerAuth()
  const { jobs } = useJobs()

  const myJobs = useMemo(() => {
    if (!customer) return []
    const email = customer.email?.toLowerCase()
    return jobs
      .filter((j) => j.customer?.email?.toLowerCase() === email)
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
  }, [jobs, customer])

  if (loading) return null
  if (!customer) return <Navigate to="/kunde/login" replace />

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <BrandIcon size={40} className="flex-shrink-0 text-slate-900" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 truncate">{customer.name}</div>
            <div className="text-sm font-bold text-slate-900 truncate">Mine tilbud</div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Log ud"
          >
            <LogOut className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-5">
        {myJobs.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-6 h-6" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Ingen tilbud endnu</h2>
            <p className="text-sm text-slate-600 mb-4">
              Tilbud du modtager fra VVS-firmaer der bruger VVS FLOW vises her.
            </p>
            <p className="text-xs text-slate-400">
              Log ind med samme email som VVS-firmaet har på dig ({customer.email}).
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {myJobs.map((j) => {
              const status = STATUS[j.status] || STATUS.sent
              const StatusIcon = status.icon
              const total = jobTotal(j)
              const showIncl = j.vat_handling !== 'excl'
              return (
                <li key={j.id}>
                  <Link
                    to={`/k/${j.share_token || j.id}`}
                    className="card p-4 md:p-5 flex items-center gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-slate-500">{j.job_number}</span>
                        <span className={clsx('chip text-[11px]', status.color)}>
                          <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                          {status.label}
                        </span>
                      </div>
                      <div className="text-base font-bold text-slate-900 truncate">{j.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        {j.customer.customer_type === 'business' ? (
                          <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5" strokeWidth={2} />
                        )}
                        {j.customer.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                        <span className="truncate">{j.customer.address}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-extrabold text-slate-900">
                        {showIncl ? formatDKK(toInclVat(total)) : formatDKK(total)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {showIncl ? 'inkl. moms' : 'ekskl. moms'}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
