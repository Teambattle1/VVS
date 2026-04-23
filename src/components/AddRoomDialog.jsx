import { useState } from 'react'
import { X, Ruler } from 'lucide-react'
import clsx from 'clsx'
import { ROOM_TYPES } from '../lib/mockTemplates.js'

export default function AddRoomDialog({ onCreate, onClose }) {
  const [name, setName] = useState('')
  const [roomType, setRoomType] = useState('bathroom')
  const [width, setWidth] = useState(300)
  const [length, setLength] = useState(400)

  const canSubmit = name.trim().length > 0 && width > 0 && length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onCreate({
      name,
      room_type: roomType,
      width_cm: Number(width),
      length_cm: Number(length),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Tilføj rum</h2>
            <p className="text-xs text-slate-500">Giv rummet et navn og mål det op.</p>
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

        <div className="p-5 space-y-4 overflow-y-auto">
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
            <label className="label">Rumtype</label>
            <div className="grid grid-cols-2 gap-2">
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
              Mål (cm) — rektangel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  id="room-width"
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
                  id="room-length"
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
          </div>
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
