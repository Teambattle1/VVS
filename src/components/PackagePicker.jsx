import { useMemo, useState } from 'react'
import { X, Search, Check } from 'lucide-react'
import clsx from 'clsx'
import { templatesForRoomType } from '../lib/mockTemplates.js'
import { formatDKK } from '../lib/pricing.js'
import LucideByName from './LucideByName.jsx'

const PRICING_LABEL = {
  fixed: 'Fast pris',
  hourly: 'Timer × rate',
  package_plus: 'Pakke + tillæg',
}

export default function PackagePicker({ roomType, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const templates = useMemo(() => templatesForRoomType(roomType), [roomType])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => t.name.toLowerCase().includes(q))
  }, [templates, query])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col">
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 bg-white rounded-t-3xl">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Vælg pakke</h2>
            <p className="text-xs text-slate-500">Vælg en VVS-pakke der skal placeres i rummet.</p>
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

        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              strokeWidth={2}
            />
            <input
              type="search"
              className="input pl-11"
              placeholder="Søg i pakker…"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-8">
              Ingen pakker matcher &quot;{query}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelect(t)}
                  className="group text-left border border-slate-200 hover:border-sky-500 rounded-2xl p-3 flex items-center gap-3 transition-colors bg-white"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100">
                    <LucideByName name={t.lucide_icon} className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{t.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {PRICING_LABEL[t.pricing_model]} · {' '}
                      {t.pricing_model === 'hourly'
                        ? `${t.base_hours} t × ${formatDKK(t.hourly_rate)}`
                        : formatDKK(t.base_price)}
                    </div>
                  </div>
                  <Check
                    className={clsx(
                      'w-5 h-5 text-sky-500 opacity-0 group-hover:opacity-100 flex-shrink-0'
                    )}
                    strokeWidth={2.5}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Tip: Du kan altid justere pris og tilføje varer efter placering.
        </footer>
      </div>
    </div>
  )
}
