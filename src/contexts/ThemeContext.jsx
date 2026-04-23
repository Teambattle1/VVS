import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'vvs.theme'

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function apply(theme) {
  if (typeof document === 'undefined') return
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', isDark)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    apply(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  // Lyt på system-ændringer når theme='system'
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => apply('system')
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [theme])

  function setTheme(next) {
    setThemeState(next)
  }

  function cycle() {
    // light -> dark -> system -> light
    setThemeState((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme skal bruges indenfor <ThemeProvider>')
  return ctx
}
