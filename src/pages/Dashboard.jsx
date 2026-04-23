import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  LogOut,
  MapPin,
  User as UserIcon,
  Home,
  Users,
  Package,
  UserCircle,
  ChevronRight,
  Building2,
  Settings as SettingsIcon,
  ShieldCheck,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useOrg } from '../contexts/OrgContext.jsx'
import { useJobs } from '../contexts/JobsContext.jsx'
import { STATUS_LABELS } from '../lib/mockJobs.js'
import { priceLabel } from '../lib/pricing.js'
import BrandIcon from '../components/BrandIcon.jsx'

const STATUS_FILTERS = [
  { value: 'all', label: 'Alle', activeClass: 'bg-slate-900 text-white border-slate-900' },
  { value: 'draft', label: 'Kladder', activeClass: STATUS_LABELS.draft.chipActive },
  { value: 'sent', label: 'Sendt', activeClass: STATUS_LABELS.sent.chipActive },
  { value: 'approved', label: 'Godkendt', activeClass: STATUS_LABELS.approved.chipActive },
  { value: 'rejected', label: 'Afvist', activeClass: STATUS_LABELS.rejected.chipActive },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { org } = useOrg()
  const { jobs } = useJobs()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return (
          job.title.toLowerCase().includes(q) ||
          job.job_number.toLowerCase().includes(q) ||
          job.customer.name.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [jobs, statusFilter, query])

  const totalPipeline = jobs.reduce((sum, j) => sum + (j.total_price_excl_vat || 0), 0)

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <BrandIcon size={40} className="flex-shrink-0 text-slate-900" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 truncate">{org?.name || 'VVS Firma'}</div>
            <div className="text-sm font-bold text-slate-900 truncate">Mine sager</div>
          </div>
          <Link
            to="/super"
            className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Super-admin"
            title="Super-admin"
          >
            <ShieldCheck className="w-5 h-5" strokeWidth={2} />
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Admin"
            title="Administration"
          >
            <SettingsIcon className="w-5 h-5" strokeWidth={2} />
          </Link>
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

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-4 md:pt-6 space-y-5">
        <section className="grid grid-cols-3 gap-3">
          <StatCard label="Aktive sager" value={MOCK_JOBS.length.toString()} />
          <StatCard label="Pipeline" value={formatShortDKK(totalPipeline)} suffix="kr" />
          <StatCard label="Sendt" value={MOCK_JOBS.filter((j) => j.status === 'sent').length.toString()} />
        </section>

        <section className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              strokeWidth={2}
            />
            <input
              type="search"
              className="input pl-11"
              placeholder="Søg i kunder, job-nr, titler…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/jobs/new')}
            className="btn-primary sm:w-auto w-full"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
            Nyt job
          </button>
        </section>

        <section className="flex gap-2 overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={clsx(
                'chip px-3.5 py-2 text-sm whitespace-nowrap flex-shrink-0 border-2 transition-colors',
                statusFilter === f.value
                  ? clsx(f.activeClass, 'shadow-sm')
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </section>

        <section>
          {filteredJobs.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-500 text-sm">Ingen sager matcher din søgning.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400 text-center pt-6">
          Logget ind som <span className="font-semibold text-slate-500">{user?.email}</span>
        </p>
      </main>

      <BottomNav />
    </div>
  )
}

function StatCard({ label, value, suffix }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className="text-lg md:text-xl font-bold text-slate-900 mt-0.5">
        {value}
        {suffix && <span className="text-sm font-semibold text-slate-500 ml-1">{suffix}</span>}
      </div>
    </div>
  )
}

function JobCard({ job }) {
  const status = STATUS_LABELS[job.status] || STATUS_LABELS.draft
  return (
    <Link
      to={`/jobs/${job.id}`}
      className={clsx(
        'relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden p-4 md:p-5 hover:shadow-md transition-shadow active:scale-[0.99] flex flex-col',
        status.border
      )}
    >
      <span className={clsx('absolute inset-y-0 left-0 w-1.5', status.accent)} aria-hidden />

      <div className="flex items-start gap-2 pl-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1 flex-wrap">
            <span>{job.job_number}</span>
            <span className={clsx('chip', status.color)}>{status.label}</span>
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
            {job.title}
          </h3>

          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
            <span className="flex items-center gap-1.5 min-w-0">
              {job.customer.customer_type === 'business' ? (
                <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
              )}
              <span className="truncate">{job.customer.name}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 min-w-0">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
              <span className="truncate">{job.customer.address}</span>
            </span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 self-start mt-0.5" strokeWidth={2} />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 pl-1 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">
          {priceLabel(job.total_price_excl_vat, job.vat_handling)}
        </div>
        <div className="text-xs text-slate-500">
          {job.rooms_count || 0} rum
        </div>
      </div>
    </Link>
  )
}

function BottomNav() {
  const items = [
    { id: 'jobs', label: 'Jobs', icon: Home, active: true },
    { id: 'customers', label: 'Kunder', icon: Users },
    { id: 'catalog', label: 'Katalog', icon: Package },
    { id: 'me', label: 'Mig', icon: UserCircle },
  ]
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 md:hidden">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              className={clsx(
                'flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px]',
                item.active ? 'text-brand-primary' : 'text-slate-400'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function formatShortDKK(amount) {
  if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`
  return amount.toString()
}
