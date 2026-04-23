import { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  Clock,
  StickyNote,
  CalendarClock,
  Camera,
  Circle as CircleIcon,
  Square as SquareIcon,
  Diamond,
  Palette,
} from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../contexts/JobsContext.jsx'
import { formatDKK, packageTotal, packageLaborTotal, packageItemsTotal } from '../lib/pricing.js'
import LucideByName from './LucideByName.jsx'
import ItemSearch from './ItemSearch.jsx'
import PhotoGallery from './PhotoGallery.jsx'

const SHAPES = [
  { value: 'circle',  label: 'Cirkel',  icon: CircleIcon },
  { value: 'rounded', label: 'Rundet',  icon: SquareIcon, stroke: 1.5 },
  { value: 'square',  label: 'Firkant', icon: SquareIcon },
  { value: 'diamond', label: 'Rombe',   icon: Diamond },
]

const SIZES = [
  { value: 'sm', label: 'S', px: 32 },
  { value: 'md', label: 'M', px: 44 },
  { value: 'lg', label: 'L', px: 60 },
  { value: 'xl', label: 'XL', px: 80 },
]

const MARKER_COLORS = [
  '#E11D48', // rose
  '#0EA5E9', // sky
  '#059669', // emerald
  '#F59E0B', // amber
  '#7C3AED', // violet
  '#EA580C', // orange
  '#0F172A', // slate
  '#EC4899', // pink
]

const MODELS = [
  { value: 'fixed', label: 'Fast pris' },
  { value: 'hourly', label: 'Timer × rate' },
  { value: 'package_plus', label: 'Pakke + tillæg' },
]

export default function PackageDetail({ jobId, roomId, pkg, onClose }) {
  const {
    updatePackage,
    deletePackage,
    addItemToPackage,
    updatePackageItem,
    removePackageItem,
    addPackagePhoto,
    removePackagePhoto,
  } = useJobs()
  const [showItemSearch, setShowItemSearch] = useState(false)

  if (!pkg) return null

  function setField(patch) {
    updatePackage(jobId, roomId, pkg.id, patch)
  }

  function handleDelete() {
    if (!confirm('Slet denne pakke?')) return
    deletePackage(jobId, roomId, pkg.id)
    onClose?.()
  }

  const labor = packageLaborTotal(pkg)
  const itemsSum = packageItemsTotal(pkg)
  const total = packageTotal(pkg)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[440px] bg-white z-50 rounded-t-3xl md:rounded-none shadow-2xl flex flex-col max-h-[92vh] md:max-h-none md:h-screen"
        role="dialog"
        aria-label={`Pakke: ${pkg.name}`}
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-start gap-3 sticky top-0 bg-white">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <LucideByName name={pkg.lucide_icon} className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              className="w-full text-lg font-bold text-slate-900 bg-transparent outline-none focus:bg-slate-50 rounded-lg px-1"
              value={pkg.name}
              onChange={(e) => setField({ name: e.target.value })}
            />
            <div className="text-xs text-slate-500 mt-0.5">Tryk for at omdøbe</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 flex items-center justify-center flex-shrink-0"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <section>
            <h3 className="label flex items-center gap-1.5 mb-2">
              <Palette className="w-4 h-4 text-slate-500" strokeWidth={2} />
              Markør på grundplan
            </h3>
            <div className="space-y-2">
              <div>
                <div className="text-[11px] text-slate-500 mb-1">Form</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {SHAPES.map((s) => {
                    const Icon = s.icon
                    const active = (pkg.shape || 'circle') === s.value
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setField({ shape: s.value })}
                        className={clsx(
                          'rounded-2xl border-2 p-2.5 flex flex-col items-center gap-1 transition-colors min-h-[60px]',
                          active
                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <Icon className="w-5 h-5" strokeWidth={s.stroke || 2} />
                        <span className="text-[10px] font-semibold">{s.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-1">Størrelse</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {SIZES.map((s) => {
                    const active = (pkg.size || 'md') === s.value
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setField({ size: s.value })}
                        className={clsx(
                          'rounded-2xl border-2 py-2 flex flex-col items-center gap-1 transition-colors',
                          active
                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <div
                          className="rounded-full"
                          style={{
                            width: Math.max(10, s.px / 4),
                            height: Math.max(10, s.px / 4),
                            backgroundColor: active ? '#0EA5E9' : '#94A3B8',
                          }}
                        />
                        <span className="text-[10px] font-bold">{s.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-1">Farve</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {MARKER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setField({ color: c })}
                      className={clsx(
                        'w-8 h-8 rounded-xl border-2 transition-transform',
                        (pkg.color || '#E11D48').toLowerCase() === c.toLowerCase()
                          ? 'border-slate-900 scale-110 shadow-md'
                          : 'border-slate-200 hover:scale-105'
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={pkg.color || '#E11D48'}
                    onChange={(e) => setField({ color: e.target.value })}
                    className="w-11 h-8 rounded-xl border border-slate-200 cursor-pointer ml-1"
                    title="Brugerdefineret farve"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="label mb-2">Prismodel</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {MODELS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setField({ pricing_model: m.value })}
                  className={clsx(
                    'rounded-2xl px-2 py-2.5 text-xs font-semibold border-2 transition-colors',
                    pkg.pricing_model === m.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          {pkg.pricing_model === 'fixed' && (
            <PriceField
              label="Fast pris (kr, ekskl. moms)"
              value={pkg.fixed_price}
              onChange={(v) => setField({ fixed_price: Number(v) || 0 })}
            />
          )}

          {pkg.pricing_model === 'hourly' && (
            <div className="grid grid-cols-2 gap-3">
              <PriceField
                label="Timer"
                value={pkg.hours}
                step="0.25"
                onChange={(v) => setField({ hours: Number(v) || 0 })}
              />
              <PriceField
                label="Timeløn (kr)"
                value={pkg.hourly_rate || 0}
                onChange={(v) => setField({ hourly_rate: Number(v) || 0 })}
              />
            </div>
          )}

          {pkg.pricing_model === 'package_plus' && (
            <>
              <PriceField
                label="Grundpakke (kr, ekskl. moms)"
                value={pkg.fixed_price}
                onChange={(v) => setField({ fixed_price: Number(v) || 0 })}
              />
              <p className="text-xs text-slate-500 -mt-3">Ekstra varer tilføjes nedenfor.</p>
            </>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="label mb-0 flex items-center gap-1.5">
                Varer på pakken
                <span className="chip bg-slate-100 text-slate-700 text-[10px]">
                  {pkg.items?.length || 0}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowItemSearch(true)}
                className="text-sm font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Tilføj vare
              </button>
            </div>

            {pkg.items?.length > 0 ? (
              <ul className="space-y-2">
                {pkg.items.map((it) => (
                  <li
                    key={it.id}
                    className="rounded-2xl border border-slate-200 px-3 py-2.5 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {it.name_snapshot}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDKK(it.unit_price)} × {it.quantity} = {' '}
                        <span className="font-semibold text-slate-700">
                          {formatDKK(it.unit_price * it.quantity)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={it.quantity}
                      onChange={(e) =>
                        updatePackageItem(jobId, roomId, pkg.id, it.id, {
                          quantity: Number(e.target.value) || 0,
                        })
                      }
                      className="w-16 text-center rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removePackageItem(jobId, roomId, pkg.id, it.id)}
                      className="w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center justify-center flex-shrink-0"
                      aria-label="Fjern vare"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-500 italic px-1">Ingen varer tilføjet endnu.</div>
            )}
          </section>

          <section>
            <label htmlFor="pkg-notes" className="label flex items-center gap-1.5">
              <StickyNote className="w-4 h-4 text-slate-500" strokeWidth={2} />
              Noter til kunden
            </label>
            <textarea
              id="pkg-notes"
              rows={3}
              className="input"
              placeholder="Fx: Leveringstid 1 uge, kunden sørger selv for fliselægning."
              value={pkg.notes || ''}
              onChange={(e) => setField({ notes: e.target.value })}
            />
          </section>

          <section>
            <label htmlFor="pkg-timeline" className="label flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-slate-500" strokeWidth={2} />
              Tidsplan
            </label>
            <input
              id="pkg-timeline"
              type="text"
              className="input"
              placeholder="Fx: 2-3 dages arbejde"
              value={pkg.timeline_text || ''}
              onChange={(e) => setField({ timeline_text: e.target.value })}
            />
          </section>

          <section>
            <div className="label flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-slate-500" strokeWidth={2} />
              Foto-dokumentation
            </div>
            <PhotoGallery
              photos={pkg.photos || []}
              onAdd={(photo) => addPackagePhoto(jobId, roomId, pkg.id, photo)}
              onRemove={(photoId) => removePackagePhoto(jobId, roomId, pkg.id, photoId)}
            />
          </section>

          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
            Slet pakke
          </button>
        </div>

        <footer className="border-t border-slate-100 bg-slate-50 p-5 space-y-2">
          <Row label="Arbejde" value={labor} icon={Clock} />
          <Row label="Varer" value={itemsSum} />
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Pakke i alt</span>
            <span className="text-xl font-extrabold text-slate-900">{formatDKK(total)}</span>
          </div>
          <p className="text-[11px] text-slate-500 text-right">Ekskl. moms</p>
        </footer>
      </aside>

      {showItemSearch && (
        <ItemSearch
          onClose={() => setShowItemSearch(false)}
          onPick={(item, qty) => {
            addItemToPackage(jobId, roomId, pkg.id, { item, quantity: qty })
            setShowItemSearch(false)
          }}
        />
      )}
    </>
  )
}

function Row({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600 flex items-center gap-1.5">
        {Icon && <Icon className="w-4 h-4 text-slate-400" strokeWidth={2} />}
        {label}
      </span>
      <span className="font-semibold text-slate-900">{formatDKK(value)}</span>
    </div>
  )
}

function PriceField({ label, value, onChange, step = '1' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min="0"
        step={step}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
