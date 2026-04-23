import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ImagePlus, Check, X, Palette, Building2, Loader2, Save } from 'lucide-react'
import clsx from 'clsx'
import { useOrg } from '../../contexts/OrgContext.jsx'

const PRESET_COLORS = ['#0EA5E9', '#DC2626', '#059669', '#7C3AED', '#EA580C', '#0F172A']
const ACCENT_COLORS = ['#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#F43F5E']

export default function AdminSettings() {
  const { org, updateOrg } = useOrg()
  const [status, setStatus] = useState('idle') // idle | dirty | saving | saved
  const [hasPending, setHasPending] = useState(false)
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
      <header className="flex items-center justify-between gap-3 flex-wrap sticky top-0 bg-slate-50/95 backdrop-blur py-2 -mt-2 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Indstillinger</h1>
          <p className="text-sm text-slate-500">
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="CVR">
            <DebouncedInput
              value={org.cvr || ''}
              onSave={(v) => handleField('cvr', v)}
              onPendingChange={setHasPending}
              registerApi={registerInput}
              type="text"
            />
          </Field>
          <Field label="Abonnement">
            <input
              type="text"
              className="input bg-slate-50"
              value={`${(org.subscription_tier || 'trial').toUpperCase()} · ${org.subscription_status || 'active'}`}
              disabled
            />
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
function DebouncedInput({
  value,
  onSave,
  onPendingChange,
  registerApi,
  delay = 500,
  ...props
}) {
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
