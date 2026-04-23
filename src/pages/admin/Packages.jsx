import { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Power, Search, X, Check, Sparkles, Trash } from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../../contexts/JobsContext.jsx'
import { formatDKK } from '../../lib/pricing.js'
import { DEMO_TEMPLATES, isDemoTemplate } from '../../lib/demoTemplates.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import LucideByName from '../../components/LucideByName.jsx'

const CATEGORIES = [
  { value: 'bathroom', label: 'Badeværelse' },
  { value: 'kitchen', label: 'Køkken' },
  { value: 'utility', label: 'Bryggers' },
  { value: 'technical', label: 'Teknikrum' },
  { value: 'outdoor', label: 'Udendørs' },
  { value: 'misc', label: 'Diverse' },
]

const PRICING_MODELS = [
  { value: 'fixed', label: 'Fast pris' },
  { value: 'hourly', label: 'Timer × rate' },
  { value: 'package_plus', label: 'Pakke + tillæg' },
]

export default function AdminPackages() {
  const { templates, createTemplate, updateTemplate, deleteTemplate, toggleTemplateActive } = useJobs()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState(null) // template object or 'new'

  const demoTemplates = useMemo(() => templates.filter(isDemoTemplate), [templates])

  function handleAddDemo() {
    DEMO_TEMPLATES.forEach((t) => createTemplate(t))
    toast.success(`${DEMO_TEMPLATES.length} demo-pakker tilføjet`)
  }

  function handleRemoveAllDemo() {
    if (!demoTemplates.length) return
    if (!confirm(`Fjern ${demoTemplates.length} demo-pakker?`)) return
    demoTemplates.forEach((t) => deleteTemplate(t.id))
    toast.success(`${demoTemplates.length} demo-pakker fjernet`)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      if (!q) return true
      return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    })
  }, [templates, query, categoryFilter])

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pakke-skabeloner</h1>
          <p className="text-sm text-slate-500">
            {templates.length} pakker
            {demoTemplates.length > 0 && <span className="text-amber-700 font-semibold"> · {demoTemplates.length} demo</span>}
            {' '}· Rediger priser og timer for din org.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
          Ny pakke
        </button>
      </header>

      <div className="card p-4 flex flex-col md:flex-row md:items-center gap-3 bg-gradient-to-br from-amber-50 to-white border-amber-200">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">Demo-pakker</div>
            <p className="text-xs text-slate-600">
              Prøv appen med {DEMO_TEMPLATES.length} eksempel-pakker. Alle markeres med{' '}
              <span className="chip bg-amber-100 text-amber-800 text-[10px] font-bold">DEMO</span>
              {' '}så de kan fjernes samlet igen.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleAddDemo}
            className="btn-secondary border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            Tilføj demo-pakker
          </button>
          <button
            type="button"
            onClick={handleRemoveAllDemo}
            disabled={demoTemplates.length === 0}
            className={clsx(
              'btn-secondary',
              demoTemplates.length === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'border-rose-300 text-rose-700 hover:bg-rose-50'
            )}
          >
            <Trash className="w-4 h-4" strokeWidth={2} />
            Fjern alle demo
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
          <input
            type="search"
            className="input pl-11"
            placeholder="Søg i pakker…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input md:w-56"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Alle kategorier</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[auto_1fr_140px_140px_120px_auto] px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div className="w-10"></div>
          <div>Navn</div>
          <div>Kategori</div>
          <div>Prismodel</div>
          <div className="text-right">Pris</div>
          <div></div>
        </div>
        <ul className="divide-y divide-slate-100">
          {filtered.map((t) => {
            const catLabel = CATEGORIES.find((c) => c.value === t.category)?.label || t.category
            const pricingLabel = PRICING_MODELS.find((p) => p.value === t.pricing_model)?.label
            return (
              <li
                key={t.id}
                className={clsx(
                  'px-4 py-3 grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_140px_140px_120px_auto] items-center gap-3',
                  !t.active && 'opacity-50'
                )}
              >
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <LucideByName name={t.lucide_icon} className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                    {isDemoTemplate(t) && (
                      <span className="chip bg-amber-100 text-amber-800 text-[10px] font-bold flex-shrink-0">DEMO</span>
                    )}
                    {t.name}
                  </div>
                  <div className="text-xs text-slate-500 md:hidden">
                    {catLabel} · {pricingLabel}
                  </div>
                </div>
                <div className="hidden md:block text-sm text-slate-600">{catLabel}</div>
                <div className="hidden md:block text-sm text-slate-600">{pricingLabel}</div>
                <div className="hidden md:block text-sm text-slate-700 font-semibold text-right">
                  {t.pricing_model === 'hourly'
                    ? `${t.base_hours}t × ${formatDKK(t.hourly_rate)}`
                    : formatDKK(t.base_price)}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleTemplateActive(t.id)}
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center',
                      t.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
                    )}
                    aria-label={t.active ? 'Deaktiver' : 'Aktivér'}
                    title={t.active ? 'Deaktiver' : 'Aktivér'}
                  >
                    <Power className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(t)}
                    className="w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                    aria-label="Rediger"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Slet "${t.name}"?`)) deleteTemplate(t.id)
                    }}
                    className="w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                    aria-label="Slet"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Ingen pakker matcher søgningen.
            </li>
          )}
        </ul>
      </div>

      {editing && (
        <TemplateDialog
          template={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing === 'new') {
              createTemplate(data)
            } else {
              updateTemplate(editing.id, data)
            }
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function TemplateDialog({ template, onSave, onClose }) {
  const [name, setName] = useState(template?.name || '')
  const [category, setCategory] = useState(template?.category || 'misc')
  const [icon, setIcon] = useState(template?.lucide_icon || 'Package')
  const [pricingModel, setPricingModel] = useState(template?.pricing_model || 'fixed')
  const [basePrice, setBasePrice] = useState(template?.base_price || 0)
  const [baseHours, setBaseHours] = useState(template?.base_hours || 0)
  const [hourlyRate, setHourlyRate] = useState(template?.hourly_rate || 695)

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      name,
      category,
      lucide_icon: icon,
      pricing_model: pricingModel,
      base_price: Number(basePrice) || 0,
      base_hours: Number(baseHours) || 0,
      hourly_rate: pricingModel === 'hourly' ? Number(hourlyRate) || 0 : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex-1">
            {template ? 'Rediger pakke' : 'Ny pakke'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="label">Navn</label>
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
              <label className="label">Kategori</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Lucide-ikon</label>
              <input
                type="text"
                className="input"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Toilet, ShowerHead, Wrench..."
              />
            </div>
          </div>

          <div>
            <label className="label">Prismodel</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRICING_MODELS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPricingModel(m.value)}
                  className={clsx(
                    'rounded-2xl px-2 py-2.5 text-xs font-semibold border-2 transition-colors',
                    pricingModel === m.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {(pricingModel === 'fixed' || pricingModel === 'package_plus') && (
            <div>
              <label className="label">Grundpris (kr, ekskl. moms)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
            </div>
          )}

          {pricingModel === 'hourly' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Timer</label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  className="input"
                  value={baseHours}
                  onChange={(e) => setBaseHours(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Timeløn (kr)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Annuller
          </button>
          <button type="submit" className="btn-primary flex-1">
            <Check className="w-5 h-5 text-white" strokeWidth={2.25} />
            Gem
          </button>
        </footer>
      </form>
    </div>
  )
}
