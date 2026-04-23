import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Search,
  Building2,
  Users2,
  Mail,
  Phone,
  Edit2,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import clsx from 'clsx'
import { useOrg } from '../../contexts/OrgContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { SUBSCRIPTION_TIERS, SUBSCRIPTION_STATUSES } from '../../lib/mockOrgs.js'
import { notifyNewOrgWelcome } from '../../lib/notifications.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import BrandIcon from '../../components/BrandIcon.jsx'

export default function SuperAdminOrganizations() {
  const navigate = useNavigate()
  const { allOrgs, addOrg } = useOrg()
  const { signOut } = useAuth()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allOrgs
    return allOrgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.cvr || '').toLowerCase().includes(q) ||
        (o.contact_email || '').toLowerCase().includes(q)
    )
  }, [allOrgs, query])

  const stats = useMemo(
    () => ({
      total: allOrgs.length,
      pro: allOrgs.filter((o) => o.subscription_tier === 'pro').length,
      users: allOrgs.reduce((n, o) => n + (o.users_count || 0), 0),
    }),
    [allOrgs]
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-400 hover:bg-slate-800"
            aria-label="Tilbage"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <BrandIcon size={36} className="text-white" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
              Super-admin
            </div>
            <div className="text-sm font-bold truncate">Alle organisationer</div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-400 hover:bg-slate-800"
            aria-label="Log ud"
          >
            <LogOut className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-5 space-y-5">
        <section className="grid grid-cols-3 gap-3">
          <StatCard label="Orgs" value={stats.total} />
          <StatCard label="Pro-abonnementer" value={stats.pro} />
          <StatCard label="Brugere i alt" value={stats.users} />
        </section>

        <section className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
            <input
              type="search"
              className="input pl-11"
              placeholder="Søg på navn, CVR eller email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
            Ny organisation
          </button>
        </section>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((o) => (
            <OrgCard key={o.id} org={o} />
          ))}
        </ul>
      </main>

      {creating && (
        <CreateOrgDialog
          onClose={() => setCreating(false)}
          onCreate={(data) => {
            const newOrg = addOrg(data)
            const onboardingUrl = `${window.location.origin}/onboarding?org=${newOrg.id}`
            if (newOrg.contact_email) {
              notifyNewOrgWelcome({ org: newOrg, adminEmail: newOrg.contact_email, onboardingUrl })
            }
            toast.success(`${newOrg.name} oprettet`)
            setCreating(false)
            navigate(`/onboarding?org=${newOrg.id}`)
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">{value}</div>
    </div>
  )
}

function OrgCard({ org }) {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.value === org.subscription_tier)
  const status = SUBSCRIPTION_STATUSES.find((s) => s.value === org.subscription_status)
  return (
    <li className="card p-4 flex items-start gap-3">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border-2"
        style={{ borderColor: org.primary_color, backgroundColor: `${org.primary_color}15` }}
      >
        {org.logo_url ? (
          <img src={org.logo_url} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <Building2 className="w-5 h-5" strokeWidth={2} style={{ color: org.primary_color }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <div className="text-sm font-bold text-slate-900 truncate">{org.name}</div>
          {tier && <span className={clsx('chip text-[10px]', tier.color)}>{tier.label}</span>}
          {status && <span className={clsx('chip text-[10px]', status.color)}>{status.label}</span>}
        </div>
        <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
          {org.cvr && <span>CVR {org.cvr}</span>}
          <span className="flex items-center gap-0.5">
            <Users2 className="w-3.5 h-3.5" strokeWidth={2} />
            {org.users_count || 0} brugere
          </span>
        </div>
        {org.contact_email && (
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Mail className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="truncate">{org.contact_email}</span>
          </div>
        )}
        {org.contact_phone && (
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" strokeWidth={2} />
            {org.contact_phone}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => alert(`Rediger "${org.name}" - kommer i næste iteration`)}
        className="w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center flex-shrink-0"
        aria-label="Rediger"
      >
        <Edit2 className="w-4 h-4" strokeWidth={2} />
      </button>
    </li>
  )
}

function CreateOrgDialog({ onCreate, onClose }) {
  const [name, setName] = useState('')
  const [cvr, setCvr] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [tier, setTier] = useState('trial')

  function handleSubmit(e) {
    e.preventDefault()
    onCreate({
      name,
      cvr,
      contact_email: email,
      contact_phone: phone,
      subscription_tier: tier,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Ny organisation</h2>
          <p className="text-xs text-slate-500">
            Efter oprettelse sendes til onboarding-wizarden.
          </p>
        </header>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="label">Firmanavn</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">CVR</label>
              <input
                type="text"
                className="input"
                value={cvr}
                onChange={(e) => setCvr(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Abonnement</label>
              <select className="input" value={tier} onChange={(e) => setTier(e.target.value)}>
                {SUBSCRIPTION_TIERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Kontakt-email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Kontakt-telefon</label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <footer className="p-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Annuller
          </button>
          <button type="submit" className="btn-primary flex-1">
            Opret og fortsæt
          </button>
        </footer>
      </form>
    </div>
  )
}
