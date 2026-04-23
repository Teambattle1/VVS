import { useEffect, useRef, useState } from 'react'
import {
  ImagePlus,
  Check,
  X,
  Palette,
  Building2,
  Loader2,
  Save,
  Search as SearchIcon,
  Users as UsersIcon,
  Plus,
  Trash2,
  Shield,
  User as UserIcon,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { useOrg } from '../../contexts/OrgContext.jsx'
import { useToast } from '../../contexts/ToastContext.jsx'
import { lookupCvr } from '../../lib/cvrLookup.js'
import { ROLES } from '../../lib/mockUsers.js'

const DEMO_MONTORER = [
  { name: '[DEMO] Mikkel Andersen', email: 'mikkel@demo-vvs.dk', phone: '+45 20 11 22 33', role: 'montor' },
  { name: '[DEMO] Jens Pedersen',   email: 'jens@demo-vvs.dk',   phone: '+45 22 33 44 55', role: 'montor' },
  { name: '[DEMO] Søren Nielsen',   email: 'soren@demo-vvs.dk',  phone: '+45 28 80 60 40', role: 'montor' },
  { name: '[DEMO] Lars Hansen',     email: 'lars@demo-vvs.dk',   phone: '+45 40 50 60 70', role: 'montor' },
]

const PRESET_COLORS = ['#0EA5E9', '#DC2626', '#059669', '#7C3AED', '#EA580C', '#0F172A']
const ACCENT_COLORS = ['#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#F43F5E']

export default function AdminSettings() {
  const { org, updateOrg, team, addTeamMember, removeTeamMember } = useOrg()
  const toast = useToast()
  const [showAddUser, setShowAddUser] = useState(false)
  const [status, setStatus] = useState('idle') // idle | dirty | saving | saved
  const [hasPending, setHasPending] = useState(false)
  const [cvrLoading, setCvrLoading] = useState(false)
  const fileRef = useRef(null)
  const savedTimerRef = useRef(null)
  const inputRefs = useRef(new Set())

  // Register/unregister DebouncedInput refs for global flush
  function registerInput(inputApi) {
    inputRefs.current.add(inputApi)
    return () => inputRefs.current.delete(inputApi)
  }

  function flushAll() {
    inputRefs.current.forEach((api) => api.flush?.())
  }

  if (!org) return null

  async function handleField(field, value) {
    setStatus('saving')
    clearTimeout(savedTimerRef.current)
    try {
      await updateOrg({ [field]: value })
      setStatus('saved')
      setHasPending(false)
      savedTimerRef.current = setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('idle')
    }
  }

  function handleSaveClick() {
    flushAll()
    // Efter flush vil handleField blive kaldt af hver input med pending værdi
  }

  async function handleCvrLookup() {
    const cvr = (org.cvr || '').trim()
    if (!cvr) {
      toast.error('Indtast CVR-nummer først')
      return
    }
    setCvrLoading(true)
    try {
      const info = await lookupCvr(cvr)
      const patch = {}
      if (info.name && !org.name?.trim()) patch.name = info.name
      if (info.name && org.name?.trim() !== info.name) {
        // Overwrite kun hvis brugeren bekræfter
        if (confirm(`Skift firmanavn til "${info.name}"?`)) patch.name = info.name
      }
      if (info.full_address) patch.address = info.full_address
      if (info.email && !org.contact_email?.trim()) patch.contact_email = info.email
      if (info.phone && !org.contact_phone?.trim()) patch.contact_phone = info.phone

      if (Object.keys(patch).length === 0) {
        toast.info(`${info.name} fundet — ingen felter opdateret`)
      } else {
        await updateOrg(patch)
        setStatus('saved')
        setHasPending(false)
        clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => setStatus('idle'), 2500)
        toast.success(`${info.name} hentet fra CVR`)
      }
    } catch (err) {
      toast.error(err.message || 'CVR-opslag fejlede')
    } finally {
      setCvrLoading(false)
    }
  }

  function handleSeedDemoCrew() {
    const existingEmails = new Set((team || []).map((t) => t.email?.toLowerCase()))
    let added = 0
    for (const m of DEMO_MONTORER) {
      if (existingEmails.has(m.email.toLowerCase())) continue
      addTeamMember(m)
      added++
    }
    if (added === 0) toast.info('Demo-montører findes allerede')
    else toast.success(`${added} demo-montør${added === 1 ? '' : 'er'} tilføjet`)
  }

  function handleRemoveDemoCrew() {
    const demos = (team || []).filter((u) => u.name?.startsWith('[DEMO]'))
    if (demos.length === 0) {
      toast.info('Ingen demo-montører at fjerne')
      return
    }
    if (!confirm(`Fjern ${demos.length} demo-montør${demos.length === 1 ? '' : 'er'}?`)) return
    demos.forEach((u) => removeTeamMember(u.id))
    toast.success(`${demos.length} demo-montør${demos.length === 1 ? '' : 'er'} fjernet`)
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => handleField('logo_url', reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3 flex-wrap sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur py-2 -mt-2 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Indstillinger</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Auto-gemmes løbende · klik &quot;Gem alle&quot; for at gemme alle ændringer straks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SaveIndicator status={status} />
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!hasPending && status !== 'saving'}
            className={clsx(
              'btn-primary',
              !hasPending && status !== 'saving' && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Save className="w-4 h-4 text-white" strokeWidth={2.25} />
            Gem alle
          </button>
        </div>
      </header>

      <Section title="Organisation" icon={Building2}>
        <Field label="Navn">
          <DebouncedInput
            value={org.name || ''}
            onSave={(v) => handleField('name', v)}
            onPendingChange={setHasPending}
            registerApi={registerInput}
            type="text"
          />
        </Field>
        <div>
          <Field label="CVR">
            <div className="flex gap-2">
              <div className="flex-1">
                <DebouncedInput
                  value={org.cvr || ''}
                  onSave={(v) => handleField('cvr', v)}
                  onPendingChange={setHasPending}
                  registerApi={registerInput}
                  type="text"
                  placeholder="12345678"
                />
              </div>
              <button
                type="button"
                onClick={handleCvrLookup}
                disabled={cvrLoading}
                className="btn-secondary flex-shrink-0"
                title="Hent firmainfo fra CVR-registret"
              >
                {cvrLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-slate-700 animate-spin" strokeWidth={2} />
                    Søger…
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-4 h-4 text-slate-700" strokeWidth={2} />
                    Slå op
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Indtast 8-cifret CVR-nummer og klik &quot;Slå op&quot; for at hente adresse + kontakt automatisk.
            </p>
          </Field>
        </div>
        <Field label="Adresse">
          <DebouncedInput
            value={org.address || ''}
            onSave={(v) => handleField('address', v)}
            onPendingChange={setHasPending}
            registerApi={registerInput}
            type="text"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Kontakt-email">
            <DebouncedInput
              value={org.contact_email || ''}
              onSave={(v) => handleField('contact_email', v)}
              onPendingChange={setHasPending}
              registerApi={registerInput}
              type="email"
            />
          </Field>
          <Field label="Kontakt-telefon">
            <DebouncedInput
              value={org.contact_phone || ''}
              onSave={(v) => handleField('contact_phone', v)}
              onPendingChange={setHasPending}
              registerApi={registerInput}
              type="tel"
            />
          </Field>
        </div>
      </Section>

      <Section title="Branding" icon={Palette}>
        <Field label="Logo">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
              {org.logo_url ? (
                <img src={org.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-7 h-7 text-slate-400" strokeWidth={2} />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
              <ImagePlus className="w-4 h-4 text-slate-700" strokeWidth={2} />
              {org.logo_url ? 'Skift logo' : 'Upload logo'}
            </button>
            {org.logo_url && (
              <button
                type="button"
                onClick={() => handleField('logo_url', null)}
                className="text-sm text-rose-600 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <X className="w-4 h-4" strokeWidth={2} />
                Fjern
              </button>
            )}
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPickerField
            label="Primær farve"
            value={org.primary_color || '#0EA5E9'}
            onChange={(c) => handleField('primary_color', c)}
            presets={PRESET_COLORS}
          />
          <ColorPickerField
            label="Accent-farve"
            value={org.accent_color || '#F59E0B'}
            onChange={(c) => handleField('accent_color', c)}
            presets={ACCENT_COLORS}
          />
        </div>
      </Section>

      <Section title="CREW — team & montører" icon={UsersIcon}>
        <div className="flex items-center justify-between flex-wrap gap-2 -mt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {team.length} medlem{team.length === 1 ? '' : 'mer'} · {team.filter((u) => u.active).length} aktive
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSeedDemoCrew}
              className="btn-secondary text-xs"
              title="Tilføj 4 demo-montører (markeret [DEMO])"
            >
              <Sparkles className="w-4 h-4 text-amber-500" strokeWidth={2} />
              Tilføj demo-montører
            </button>
            {team.some((u) => u.name?.startsWith('[DEMO]')) && (
              <button
                type="button"
                onClick={handleRemoveDemoCrew}
                className="btn-secondary text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
                Fjern demo
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddUser(true)}
              className="btn-primary text-xs"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={2.25} />
              Tilføj bruger
            </button>
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {team.map((u) => (
            <li
              key={u.id}
              className={clsx(
                'rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center gap-3',
                !u.active && 'opacity-60'
              )}
            >
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 flex items-center justify-center flex-shrink-0">
                {u.role === 'org_admin' ? (
                  <Shield className="w-5 h-5" strokeWidth={2} />
                ) : (
                  <UserIcon className="w-5 h-5" strokeWidth={2} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {u.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {u.email} · {ROLES.find((r) => r.value === u.role)?.label || u.role}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Fjern ${u.name}?`)) removeTeamMember(u.id)
                }}
                className="w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center justify-center flex-shrink-0"
                aria-label="Fjern"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {showAddUser && (
        <AddUserInlineDialog
          onClose={() => setShowAddUser(false)}
          onSave={(data) => {
            addTeamMember(data)
            toast.success(`${data.name} tilføjet`)
            setShowAddUser(false)
          }}
        />
      )}

      <Section title="Standard-priser">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Timeløn (kr, ekskl. moms)">
            <DebouncedInput
              type="number"
              min="0"
              value={org.default_hourly_rate || 0}
              onSave={(v) => handleField('default_hourly_rate', Number(v) || 0)}
              onPendingChange={setHasPending}
              registerApi={registerInput}
            />
          </Field>
          <Field label="Standard markup på varer (%)">
            <DebouncedInput
              type="number"
              min="0"
              max="200"
              value={org.default_markup_percent || 0}
              onSave={(v) => handleField('default_markup_percent', Number(v) || 0)}
              onPendingChange={setHasPending}
              registerApi={registerInput}
            />
          </Field>
        </div>
      </Section>
    </div>
  )
}

function SaveIndicator({ status }) {
  if (status === 'saving') {
    return (
      <span className="chip bg-sky-100 text-sky-800">
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
        Gemmer…
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="chip bg-emerald-100 text-emerald-800">
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        Gemt
      </span>
    )
  }
  return (
    <span className="chip bg-slate-100 text-slate-500">
      Auto-save aktiv
    </span>
  )
}

// Debounced input:
// - Opdaterer lokalt straks
// - Gemmer efter 500ms (eller ved blur eller ved eksternt flush())
// - Signalerer pending-state opad via onPendingChange
// - Registerer en flush-API saa "Gem alle"-knap kan tvinge gem paa tvaers af felter
// Eksplicit destructuring saa onPendingChange/registerApi/onSave ikke laekker til <input>
function DebouncedInput(allProps) {
  const {
    value,
    onSave,
    onPendingChange,
    registerApi,
    delay = 500,
    ...props
  } = allProps
  const [local, setLocal] = useState(value ?? '')
  const timerRef = useRef(null)
  const dirtyRef = useRef(false)
  const latestRef = useRef(value ?? '')

  useEffect(() => {
    latestRef.current = local
  }, [local])

  useEffect(() => {
    if (!dirtyRef.current) setLocal(value ?? '')
  }, [value])

  function markPending(pending) {
    if (onPendingChange) onPendingChange((prev) => prev || pending)
  }

  function fire(v) {
    if (v === (value ?? '')) {
      dirtyRef.current = false
      return
    }
    onSave?.(v)
    dirtyRef.current = false
  }

  function handleChange(e) {
    const v = e.target.value
    dirtyRef.current = true
    markPending(true)
    setLocal(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fire(v), delay)
  }

  function handleBlur() {
    clearTimeout(timerRef.current)
    fire(latestRef.current)
  }

  useEffect(() => {
    if (!registerApi) return
    const api = {
      flush() {
        clearTimeout(timerRef.current)
        fire(latestRef.current)
      },
    }
    const unreg = registerApi(api)
    return unreg
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <input
      {...props}
      className="input"
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="card p-5 space-y-4">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-500" strokeWidth={2} />}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  )
}

function AddUserInlineDialog({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('montor')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), role, active: true })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex-1">
            Tilføj bruger
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="label">Navn</label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+45 20 12 34 56" />
          </div>
          <div>
            <label className="label">Rolle</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={clsx(
                    'rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors',
                    role === r.value
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuller</button>
          <button type="submit" className="btn-primary flex-1">
            <Check className="w-5 h-5 text-white" strokeWidth={2.25} />
            Tilføj
          </button>
        </footer>
      </form>
    </div>
  )
}

function ColorPickerField({ label, value, onChange, presets }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-10 h-10 rounded-2xl border border-slate-200"
          style={{ backgroundColor: value }}
        />
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
              'w-7 h-7 rounded-xl border-2 transition',
              value.toLowerCase() === c.toLowerCase()
                ? 'border-slate-900 scale-110'
                : 'border-slate-200'
            )}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>
    </Field>
  )
}
