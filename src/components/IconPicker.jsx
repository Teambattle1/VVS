import { useState } from 'react'
import { X, Check } from 'lucide-react'
import clsx from 'clsx'
import { ICON_CATEGORIES } from '../lib/vvsIcons.jsx'
import LucideByName from './LucideByName.jsx'

export default function IconPicker({ value, color = '#E11D48', onChange, onClose }) {
  const [activeCategory, setActiveCategory] = useState(ICON_CATEGORIES[0].id)
  const category = ICON_CATEGORIES.find((c) => c.id === activeCategory) || ICON_CATEGORIES[0]

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-1">
            Vælg ikon
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          {ICON_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors',
                activeCategory === c.id
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {category.icons.map((icon) => {
              const active = value === icon.id
              return (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => {
                    onChange(icon.id)
                    onClose?.()
                  }}
                  className={clsx(
                    'relative aspect-square rounded-2xl border-2 p-2 flex flex-col items-center justify-center gap-1 transition-all',
                    active
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 scale-105'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                  title={icon.label}
                >
                  <LucideByName
                    name={icon.id}
                    strokeWidth={2}
                    style={{ width: 28, height: 28, color: active ? '#0EA5E9' : color }}
                  />
                  <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 text-center leading-tight line-clamp-1">
                    {icon.label}
                  </span>
                  {active && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <footer className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          Nuværende: <strong>{value || 'Package'}</strong>
        </footer>
      </div>
    </div>
  )
}
