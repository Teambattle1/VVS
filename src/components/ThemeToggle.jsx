import { Sun, Moon, Monitor } from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext.jsx'

const LABELS = {
  light: 'Lyst tema',
  dark: 'Mørkt tema',
  system: 'Følg system',
}

export default function ThemeToggle({ className, size = 40 }) {
  const { theme, cycle } = useTheme()
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <button
      type="button"
      onClick={cycle}
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl transition-colors',
        'text-slate-500 hover:bg-slate-100',
        'dark:text-slate-400 dark:hover:bg-slate-800',
        className
      )}
      style={{ width: size, height: size }}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
    >
      <Icon className="w-5 h-5" strokeWidth={2} />
    </button>
  )
}
