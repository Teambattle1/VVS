import { useState } from 'react'
import { X, Ruler, Pencil, Upload, LayoutTemplate, Square, Trash2, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { ROOM_TYPES } from '../lib/mockTemplates.js'
import { ROOM_PRESETS } from '../lib/roomTemplates.js'
import { useJobs } from '../contexts/JobsContext.jsx'

const MODES = [
  { value: 'rectangle', label: 'Rektangel', icon: Square, hint: 'Indtast bredde × længde' },
  { value: 'template',  label: 'Skabelon',  icon: LayoutTemplate, hint: 'Vælg færdigt rum' },
  { value: 'freehand',  label: 'Fri tegning', icon: Pencil, hint: 'Tegn rummet frit' },
  { value: 'upload',    label: 'Upload',    icon: Upload, hint: 'Billede som baggrund' },
]

export default function AddRoomDialog({ onCreate, onClose }) {
  const { roomTemplates, deleteRoomTemplate } = useJobs()
  const [mode, setMode] = useState('rectangle')
  const [name, setName] = useState('')
  const [roomType, setRoomType] = useState('bathroom')
  const [width, setWidth] = useState(300)
  const [length, setLength] = useState(400)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [selectedCustom, setSelectedCustom] = useState(null)

  const canSubmit =
    name.trim().length > 0 &&
    ((mode !== 'template' && width > 0 && length > 0) ||
      (mode === 'template' && (selectedPreset || selectedCustom)))

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    if (mode === 'template') {
      if (selectedCustom) {
        const tpl = roomTemplates.find((t) => t.id === selectedCustom)
        onCreate({
          name,
          room_type: tpl.room_type,
          width_cm: tpl.width_cm,
          length_cm: tpl.length_cm,
          floorplan_mode: 'rectangle',
          preset_packages: tpl.packages || [],
        })
        return
      }
      const preset = ROOM_PRESETS.find((p) => p.id === selectedPreset)
      onCreate({
        name,
        room_type: preset.room_type,
        width_cm: preset.width_cm,
        length_cm: preset.length_cm,
        floorplan_mode: 'rectangle',
        suggested_templates: preset.suggested_templates || [],
      })
      return
    }

    onCreate({
      name,
      room_type: roomType,
      width_cm: Number(width),
      length_cm: Number(length),
      floorplan_mode: mode,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Tilføj rum</h2>
            <p className="text-xs text-slate-500">Vælg hvordan du vil skabe grundplanen.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="p-5 space-y-5 overflow-y-auto">
          <div>
            <label htmlFor="room-name" className="label">Navn på rum</label>
            <input
              id="room-name"
              type="text"
              className="input"
              placeholder="Fx: Badeværelse 1. sal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="label">Grundplan-tilstand</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MODES.map((m) => {
                const Icon = m.icon
                const active = mode === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={clsx(
                      'rounded-2xl border-2 px-3 py-3 text-left transition-colors',
                      active
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <Icon
                      className={clsx('w-5 h-5 mb-2', active ? 'text-sky-600' : 'text-slate-500')}
                      strokeWidth={2}
                    />
                    <div className={clsx('text-sm font-bold', active ? 'text-sky-900' : 'text-slate-900')}>
                      {m.label}
                    </div>
                    <div className="text-[11px] text-slate-500">{m.hint}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {mode === 'template' ? (
            <div className="space-y-3">
              {roomTemplates.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" strokeWidth={2} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Dine egne skabeloner ({roomTemplates.length})
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {roomTemplates.map((t) => {
                      const type = ROOM_TYPES.find((rt) => rt.value === t.room_type)
                      const active = selectedCustom === t.id
                      return (
                        <li key={t.id} className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustom(t.id)
                              setSelectedPreset(null)
                            }}
                            className={clsx(
                              'flex-1 text-left rounded-2xl border-2 px-4 py-3 transition-colors flex items-center gap-3',
                              active
                                ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-900/20'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-800'
                            )}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-5 h-5 text-amber-600" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{t.name}</div>
                              <div className="text-xs text-slate-500">
                                {type?.label} · {t.width_cm} × {t.length_cm} cm · {(t.packages || []).length} pakker
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Slet skabelon "${t.name}"?`)) deleteRoomTemplate(t.id)
                            }}
                            className="w-11 h-11 rounded-2xl text-rose-500 hover:bg-rose-50 flex items-center justify-center flex-shrink-0"
                            aria-label="Slet skabelon"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Standard-skabeloner
                </div>
                <ul className="space-y-2">
                  {ROOM_PRESETS.map((p) => {
                    const type = ROOM_TYPES.find((t) => t.value === p.room_type)
                    const active = selectedPreset === p.id
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset(p.id)
                            setSelectedCustom(null)
                          }}
                          className={clsx(
                            'w-full text-left rounded-2xl border-2 px-4 py-3 transition-colors flex items-center gap-3',
                            active
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-800'
                          )}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 relative">
                            <div
                              className="border-2 border-slate-400 bg-slate-50"
                              style={{
                                width: Math.min(36, p.width_cm / 12),
                                height: Math.min(36, p.length_cm / 12),
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.label}</div>
                            <div className="text-xs text-slate-500">
                              {type?.label} · {p.width_cm} × {p.length_cm} cm · {p.hint}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 flex-shrink-0">
                            {p.suggested_templates?.length || 0} pakker
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Rumtype</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ROOM_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setRoomType(t.value)}
                      className={clsx(
                        'rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors text-left',
                        roomType === t.value
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-slate-500" strokeWidth={2} />
                  Mål (cm)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      className="input"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      required
                    />
                    <div className="text-xs text-slate-500 text-center mt-1">Bredde</div>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      className="input"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      required
                    />
                    <div className="text-xs text-slate-500 text-center mt-1">Længde</div>
                  </div>
                </div>
                {mode === 'upload' && (
                  <p className="text-xs text-slate-500 mt-2">
                    Du kan uploade et billede på næste trin.
                  </p>
                )}
                {mode === 'freehand' && (
                  <p className="text-xs text-slate-500 mt-2">
                    Du kan tegne grundplanen på næste trin.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <footer className="p-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Annuller
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={clsx('btn-primary flex-1', !canSubmit && 'opacity-50 cursor-not-allowed')}
          >
            Opret rum
          </button>
        </footer>
      </form>
    </div>
  )
}
