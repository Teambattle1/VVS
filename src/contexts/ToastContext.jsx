import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'

const ToastContext = createContext(null)

const META = {
  success: { icon: CheckCircle2, color: 'bg-emerald-500 text-white', bar: 'border-emerald-600' },
  error:   { icon: AlertTriangle, color: 'bg-rose-500 text-white',    bar: 'border-rose-600' },
  info:    { icon: Info, color: 'bg-slate-900 text-white',            bar: 'border-slate-700' },
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message, { type = 'info', duration = 3500 } = {}) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  const value = {
    show,
    success: (m, o) => show(m, { ...o, type: 'success' }),
    error: (m, o) => show(m, { ...o, type: 'error' }),
    info: (m, o) => show(m, { ...o, type: 'info' }),
    dismiss,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const meta = META[t.type] || META.info
          const Icon = meta.icon
          return (
            <div
              key={t.id}
              className={clsx(
                'pointer-events-auto rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border-l-4 animate-in slide-in-from-right-5',
                meta.color,
                meta.bar
              )}
              role="status"
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <div className="flex-1 text-sm font-semibold">{t.message}</div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="w-6 h-6 rounded-lg hover:bg-white/20 flex items-center justify-center flex-shrink-0"
                aria-label="Luk"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast skal bruges indenfor <ToastProvider>')
  return ctx
}
