import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User as UserIcon,
  Building2,
  Briefcase,
  MapPin,
  Percent,
  Loader2,
  Check,
} from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../contexts/JobsContext.jsx'

const VAT_OPTIONS = [
  {
    value: 'incl',
    label: 'Inkl. moms',
    helper: 'Privatkunder ser typisk prisen med moms.',
  },
  {
    value: 'excl',
    label: 'Ekskl. moms',
    helper: 'Erhvervskunder kan trække moms fra.',
  },
  {
    value: 'both',
    label: 'Begge',
    helper: 'Vis både med og uden moms i tilbuddet.',
  },
]

export default function NewJob() {
  const navigate = useNavigate()
  const { addJob } = useJobs()

  const [title, setTitle] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerType, setCustomerType] = useState('private')
  const [vatHandling, setVatHandling] = useState('incl')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit =
    title.trim().length > 0 &&
    customerName.trim().length > 0 &&
    customerAddress.trim().length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 300))
    const job = addJob({
      title,
      customer: {
        name: customerName,
        address: customerAddress,
        customer_type: customerType,
      },
      vatHandling,
    })
    setSubmitting(false)
    navigate('/', { state: { flash: `Oprettet ${job.job_number}` }, replace: true })
  }

  function handleCustomerTypeChange(next) {
    setCustomerType(next)
    setVatHandling(next === 'business' ? 'excl' : 'incl')
  }

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Tilbage"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <div className="flex-1">
            <div className="text-xs text-slate-500">Ny sag</div>
            <h1 className="text-sm font-bold text-slate-900">Opret job</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 md:px-6 pt-5 space-y-5">
        <section className="card p-5 space-y-4">
          <SectionHeader icon={Briefcase} title="Sag" />

          <div>
            <label htmlFor="title" className="label">Titel på sag</label>
            <input
              id="title"
              type="text"
              className="input"
              placeholder="Fx: Renovering af badeværelse"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <SectionHeader icon={UserIcon} title="Kunde" />

          <div>
            <label className="label">Kundetype</label>
            <div className="grid grid-cols-2 gap-2">
              <ToggleCard
                active={customerType === 'private'}
                onClick={() => handleCustomerTypeChange('private')}
                icon={UserIcon}
                label="Privat"
                sub="Med moms (standard)"
              />
              <ToggleCard
                active={customerType === 'business'}
                onClick={() => handleCustomerTypeChange('business')}
                icon={Building2}
                label="Erhverv"
                sub="Uden moms (standard)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="customerName" className="label">Navn</label>
            <input
              id="customerName"
              type="text"
              className="input"
              placeholder={customerType === 'business' ? 'Firma ApS' : 'Fornavn Efternavn'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="customerAddress" className="label">Adresse</label>
            <div className="relative">
              <MapPin
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                strokeWidth={2}
              />
              <input
                id="customerAddress"
                type="text"
                className="input pl-11"
                placeholder="Vej, nr, postnummer by"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                required
              />
            </div>
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <SectionHeader icon={Percent} title="Moms-håndtering" />
          <p className="text-sm text-slate-500 -mt-2">
            Bestemmer hvordan priser vises for kunden. Kan altid ændres senere.
          </p>

          <div className="space-y-2">
            {VAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVatHandling(opt.value)}
                className={clsx(
                  'w-full text-left rounded-2xl border px-4 py-3 transition-colors min-h-[56px] flex items-center gap-3',
                  vatHandling === opt.value
                    ? 'border-sky-500 bg-sky-50/70'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    vatHandling === opt.value ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                  )}
                >
                  {vatHandling === opt.value && (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                  <div className="text-xs text-slate-500">{opt.helper}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row-reverse gap-3 pt-1">
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" strokeWidth={2} />
                Opretter…
              </>
            ) : (
              'Opret sag'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1 sm:flex-none"
          >
            Annuller
          </button>
        </div>
      </form>
    </div>
  )
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 -mb-1">
      <div className="w-8 h-8 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
        <Icon className="w-4 h-4" strokeWidth={2.25} />
      </div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
    </div>
  )
}

function ToggleCard({ active, onClick, icon: Icon, label, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-2xl border px-4 py-3 text-left transition-colors min-h-[72px] flex items-center gap-3',
        active ? 'border-sky-500 bg-sky-50/70' : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      <div
        className={clsx(
          'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
          active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500 truncate">{sub}</div>
      </div>
    </button>
  )
}
