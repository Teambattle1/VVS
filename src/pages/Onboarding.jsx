import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Palette,
  Clock,
  Users2,
  Package,
  CheckCircle2,
  ImagePlus,
} from 'lucide-react'
import clsx from 'clsx'
import { useOrg } from '../contexts/OrgContext.jsx'
import BrandIcon from '../components/BrandIcon.jsx'

const STEPS = [
  { id: 'branding', label: 'Logo & farver', icon: Palette },
  { id: 'rates',    label: 'Timeløn',       icon: Clock },
  { id: 'team',     label: 'Team',          icon: Users2 },
  { id: 'review',   label: 'Gennemgang',    icon: CheckCircle2 },
]

const COLORS = ['#0EA5E9', '#DC2626', '#059669', '#7C3AED', '#EA580C', '#0F172A']
const ACCENTS = ['#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#6366F1']

export default function Onboarding() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orgId = params.get('org')
  const { allOrgs, updateOrgById, addTeamMember } = useOrg()

  const existingOrg = allOrgs.find((o) => o.id === orgId)

  const [step, setStep] = useState(0)
  const [logoUrl, setLogoUrl] = useState(existingOrg?.logo_url || null)
  const [primary, setPrimary] = useState(existingOrg?.primary_color || '#0EA5E9')
  const [accent, setAccent] = useState(existingOrg?.accent_color || '#F59E0B')
  const [hourlyRate, setHourlyRate] = useState(existingOrg?.default_hourly_rate || 695)
  const [markup, setMarkup] = useState(existingOrg?.default_markup_percent || 25)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invited, setInvited] = useState([])
  const fileRef = useRef(null)

  function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleInvite(e) {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) return
    setInvited((prev) => [...prev, { name: inviteName.trim(), email: inviteEmail.trim() }])
    setInviteName('')
    setInviteEmail('')
  }

  function handleFinish() {
    if (existingOrg) {
      updateOrgById(orgId, {
        logo_url: logoUrl,
        primary_color: primary,
        accent_color: accent,
        default_hourly_rate: hourlyRate,
        default_markup_percent: markup,
        users_count: (existingOrg.users_count || 0) + invited.length,
      })
    }
    invited.forEach((u) => addTeamMember({ ...u, role: 'montor' }))
    alert(`Opsætning færdig!${invited.length ? ` ${invited.length} invitationer sendt.` : ''}`)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white py-6 md:py-10">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <header className="flex items-center gap-3 mb-6">
          <BrandIcon size={40} className="text-slate-900" />
          <div className="flex-1">
            <div className="text-xs text-slate-500">Opsætning af</div>
            <div className="text-base md:text-lg font-bold text-slate-900">
              {existingOrg?.name || 'Din organisation'}
            </div>
          </div>
        </header>

        <ol className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            const active = idx === step
            const done = idx < step
            return (
              <li key={s.id} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm',
                    active && 'bg-sky-500 text-white shadow-md',
                    done && 'bg-emerald-500 text-white',
                    !active && !done && 'bg-slate-200 text-slate-500'
                  )}
                >
                  {done ? <Check className="w-5 h-5" strokeWidth={2.5} /> : <Icon className="w-5 h-5" strokeWidth={2} />}
                </div>
                <span className={clsx('text-sm font-semibold whitespace-nowrap', active ? 'text-slate-900' : 'text-slate-500')}>
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={2} />}
              </li>
            )
          })}
        </ol>

        <div className="card p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                Vælg logo og farver
              </h1>
              <p className="text-sm text-slate-600">
                Dine kunder ser disse i deres portal og i tilbuds-PDF&apos;en.
              </p>

              <div>
                <div className="label">Logo</div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-400" strokeWidth={2} />
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogo}
                    className="hidden"
                  />
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
                    <ImagePlus className="w-4 h-4 text-slate-700" strokeWidth={2} />
                    {logoUrl ? 'Skift logo' : 'Upload logo'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPick label="Primær farve" value={primary} onChange={setPrimary} presets={COLORS} />
                <ColorPick label="Accent-farve" value={accent} onChange={setAccent} presets={ACCENTS} />
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${primary}15`, borderColor: primary, borderWidth: 2 }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6" strokeWidth={2} style={{ color: primary }} />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Forhåndsvisning</div>
                  <div className="text-base font-bold text-slate-900">
                    {existingOrg?.name || 'Dit firma'}
                  </div>
                </div>
                <button
                  type="button"
                  className="ml-auto btn text-white text-sm"
                  style={{ backgroundColor: primary }}
                >
                  Eksempel-knap
                </button>
                <span
                  className="chip text-xs text-white"
                  style={{ backgroundColor: accent }}
                >
                  Accent
                </span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Standard-priser</h1>
              <p className="text-sm text-slate-600">
                Bruges som udgangspunkt på nye pakker. Du kan altid ændre pr. sag.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="label">Timeløn (kr, ekskl. moms)</div>
                  <input
                    type="number"
                    min="0"
                    className="input text-xl font-bold"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div className="label">Markup på varer (%)</div>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    className="input text-xl font-bold"
                    value={markup}
                    onChange={(e) => setMarkup(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900">
                <strong>Eksempel:</strong> Et produkt der koster 1.000 kr i indkøb,
                sælges med {markup}% markup for {Math.round(1000 * (1 + markup / 100))} kr.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Inviter team</h1>
              <p className="text-sm text-slate-600">
                Inviter dine montører. Du kan altid tilføje flere senere.
              </p>

              <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  type="text"
                  className="input"
                  placeholder="Navn"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
                <input
                  type="email"
                  className="input"
                  placeholder="email@firma.dk"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button type="submit" className="btn-primary">
                  Tilføj
                </button>
              </form>

              {invited.length > 0 && (
                <ul className="space-y-2">
                  {invited.map((u, idx) => (
                    <li
                      key={idx}
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm flex items-center gap-2"
                    >
                      <Users2 className="w-4 h-4 text-slate-400" strokeWidth={2} />
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-slate-500">{u.email}</span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-slate-500">
                Trinnet kan også springes over.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Gennemgang</h1>
              <p className="text-sm text-slate-600">
                Tjek at alt ser rigtigt ud og afslut opsætningen.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ReviewItem icon={Palette} label="Primær farve" value={primary} swatch={primary} />
                <ReviewItem icon={Palette} label="Accent-farve" value={accent} swatch={accent} />
                <ReviewItem icon={Clock} label="Timeløn" value={`${hourlyRate} kr`} />
                <ReviewItem icon={Package} label="Markup" value={`${markup}%`} />
                <ReviewItem icon={Users2} label="Team inviteret" value={`${invited.length} personer`} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="btn-secondary disabled:opacity-40"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" strokeWidth={2} />
            Tilbage
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="btn-primary"
            >
              Næste
              <ChevronRight className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
          ) : (
            <button type="button" onClick={handleFinish} className="btn-primary">
              <Check className="w-5 h-5 text-white" strokeWidth={2.25} />
              Afslut opsætning
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ColorPick({ label, value, onChange, presets }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-14 h-10 rounded-xl border border-slate-200 cursor-pointer"
        />
        <input
          type="text"
          className="input font-mono uppercase text-sm flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={clsx(
              'w-7 h-7 rounded-xl border-2',
              value.toLowerCase() === c.toLowerCase() ? 'border-slate-900 scale-110' : 'border-slate-200'
            )}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  )
}

function ReviewItem({ icon: Icon, label, value, swatch }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-bold text-slate-900 truncate">{value}</div>
      </div>
      {swatch && (
        <div
          className="w-6 h-6 rounded-lg border border-slate-200 flex-shrink-0"
          style={{ backgroundColor: swatch }}
        />
      )}
    </div>
  )
}
