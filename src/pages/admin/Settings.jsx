import { useRef, useState } from 'react'
import { ImagePlus, Check, X, Palette, Building2 } from 'lucide-react'
import clsx from 'clsx'
import { useOrg } from '../../contexts/OrgContext.jsx'

const PRESET_COLORS = ['#0EA5E9', '#DC2626', '#059669', '#7C3AED', '#EA580C', '#0F172A']
const ACCENT_COLORS = ['#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#F43F5E']

export default function AdminSettings() {
  const { org, updateOrg } = useOrg()
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  if (!org) return null

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateOrg({ logo_url: reader.result })
      flashSaved()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleField(field, value) {
    updateOrg({ [field]: value })
    flashSaved()
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Indstillinger</h1>
          <p className="text-sm text-slate-500">
            Organisation, branding og standard-priser. Gemmes automatisk.
          </p>
        </div>
        {saved && (
          <span className="chip bg-emerald-100 text-emerald-800 animate-pulse">
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Gemt
          </span>
        )}
      </header>

      <Section title="Organisation" icon={Building2}>
        <Field label="Navn">
          <input
            type="text"
            className="input"
            value={org.name || ''}
            onChange={(e) => handleField('name', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CVR">
            <input
              type="text"
              className="input"
              value={org.cvr || ''}
              onChange={(e) => handleField('cvr', e.target.value)}
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
          <input
            type="text"
            className="input"
            value={org.address || ''}
            onChange={(e) => handleField('address', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Kontakt-email">
            <input
              type="email"
              className="input"
              value={org.contact_email || ''}
              onChange={(e) => handleField('contact_email', e.target.value)}
            />
          </Field>
          <Field label="Kontakt-telefon">
            <input
              type="tel"
              className="input"
              value={org.contact_phone || ''}
              onChange={(e) => handleField('contact_phone', e.target.value)}
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
            <input
              type="number"
              min="0"
              className="input"
              value={org.default_hourly_rate || 0}
              onChange={(e) => handleField('default_hourly_rate', Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Standard markup på varer (%)">
            <input
              type="number"
              min="0"
              max="200"
              className="input"
              value={org.default_markup_percent || 0}
              onChange={(e) =>
                handleField('default_markup_percent', Number(e.target.value) || 0)
              }
            />
          </Field>
        </div>
      </Section>
    </div>
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
