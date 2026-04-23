import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const OrgContext = createContext(null)

const MOCK_ORG = {
  id: 'org-mock-1',
  name: 'VVS København ApS',
  slug: 'vvs-kbh',
  logo_url: null,
  primary_color: '#0EA5E9',
  accent_color: '#F59E0B',
  contact_email: 'kontakt@vvs-kbh.dk',
  contact_phone: '+45 70 20 30 40',
  default_hourly_rate: 695,
  subscription_tier: 'pro',
}

export function OrgProvider({ children }) {
  const { user } = useAuth()
  const [org, setOrg] = useState(null)

  useEffect(() => {
    if (user) {
      setOrg(MOCK_ORG)
    } else {
      setOrg(null)
    }
  }, [user])

  useEffect(() => {
    const root = document.documentElement
    if (org) {
      root.style.setProperty('--brand-primary', org.primary_color || '#0EA5E9')
      root.style.setProperty('--brand-accent', org.accent_color || '#F59E0B')
    } else {
      root.style.setProperty('--brand-primary', '#0EA5E9')
      root.style.setProperty('--brand-accent', '#F59E0B')
    }
  }, [org])

  const value = useMemo(() => ({ org, setOrg }), [org])

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg skal bruges indenfor <OrgProvider>')
  return ctx
}
