import { X, Sparkles } from 'lucide-react'
import clsx from 'clsx'

export default function ChangelogDialog({ changelog, onlyNew = false, onClose, title }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title || (onlyNew ? 'Nye features siden sidst' : 'Flow-log')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Oversigt over hvad der er nyt i VVS FLOW
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {changelog.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Ingen nye features siden du sidst var logget ind.
            </p>
          ) : (
            changelog.map((entry) => (
              <article key={entry.version} className="space-y-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {entry.title || `Version ${entry.version}`}
                  </h3>
                  <span className="chip bg-slate-100 text-slate-600 text-[10px] dark:bg-slate-800 dark:text-slate-400">
                    v{entry.version}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(entry.date)}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {entry.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <span className="text-base flex-shrink-0 leading-6">{f.icon || '✨'}</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>

        <footer className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Fedt, videre!
          </button>
        </footer>
      </div>
    </div>
  )
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
