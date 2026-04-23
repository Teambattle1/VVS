import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { hasSupabase, supabase } from '../lib/supabase.js'
import { INITIAL_TEAM } from '../lib/mockUsers.js'
import { INITIAL_ORGS } from '../lib/mockOrgs.js'

const OrgContext = createContext(null)

const MOCK_ORG = INITIAL_ORGS[0]

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function OrgProvider({ children }) {
  const { user } = useAuth()
  const [org, setOrg] = useState(null)
  const [team, setTeam] = useState(INITIAL_TEAM)
  const [allOrgs, setAllOrgs] = useState(INITIAL_ORGS)

  useEffect(() => {
    let cancelled = false

    async function loadOrgForUser() {
      if (!user) {
        setOrg(null)
        return
      }

      if (hasSupabase) {
        // Slå vvs_users op for at finde organization_id for denne auth-user
        try {
          const { data: profile, error: profileError } = await supabase
            .from('vvs_users')
            .select('organization_id, name, role')
            .eq('user_id', user.id)
            .eq('active', true)
            .maybeSingle()

          if (profileError) throw profileError

          if (profile?.organization_id) {
            const { data: orgRow, error: orgError } = await supabase
              .from('vvs_organizations')
              .select('*')
              .eq('id', profile.organization_id)
              .maybeSingle()

            if (orgError) throw orgError
            if (!cancelled && orgRow) {
              setOrg(orgRow)
              return
            }
          }

          // Ingen vvs_users-record endnu (fx ny bruger som ikke er linket til org)
          // Fall back til mock så UI ikke er tomt
          if (!cancelled) setOrg(MOCK_ORG)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[OrgContext] Supabase org-lookup fejlede, bruger mock:', err.message)
          if (!cancelled) setOrg(MOCK_ORG)
        }
      } else {
        setOrg(MOCK_ORG)
      }
    }

    loadOrgForUser()
    return () => {
      cancelled = true
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

  function updateOrg(patch) {
    setOrg((prev) => (prev ? { ...prev, ...patch, updated_at: new Date().toISOString() } : prev))
    setAllOrgs((prev) =>
      prev.map((o) => (o.id === org?.id ? { ...o, ...patch } : o))
    )
  }

  function addTeamMember({ name, email, phone, role }) {
    const newUser = {
      id: uid('u'),
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      role: role || 'montor',
      active: true,
    }
    setTeam((prev) => [newUser, ...prev])
    return newUser
  }

  function updateTeamMember(userId, patch) {
    setTeam((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)))
  }

  function removeTeamMember(userId) {
    setTeam((prev) => prev.filter((u) => u.id !== userId))
  }

  function addOrg(data) {
    const newOrg = {
      id: uid('org'),
      name: data.name.trim(),
      slug: data.slug?.trim() || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      cvr: data.cvr?.trim() || '',
      contact_email: data.contact_email?.trim() || '',
      contact_phone: data.contact_phone?.trim() || '',
      address: data.address?.trim() || '',
      primary_color: data.primary_color || '#0EA5E9',
      accent_color: data.accent_color || '#F59E0B',
      logo_url: data.logo_url || null,
      default_hourly_rate: Number(data.default_hourly_rate) || 650,
      default_markup_percent: Number(data.default_markup_percent) || 25,
      subscription_tier: data.subscription_tier || 'trial',
      subscription_status: 'active',
      created_at: new Date().toISOString(),
      users_count: 0,
    }
    setAllOrgs((prev) => [newOrg, ...prev])
    return newOrg
  }

  function updateOrgById(orgId, patch) {
    setAllOrgs((prev) => prev.map((o) => (o.id === orgId ? { ...o, ...patch } : o)))
    if (org?.id === orgId) setOrg((prev) => ({ ...prev, ...patch }))
  }

  const value = useMemo(
    () => ({
      org,
      setOrg,
      updateOrg,
      team,
      addTeamMember,
      updateTeamMember,
      removeTeamMember,
      allOrgs,
      addOrg,
      updateOrgById,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [org, team, allOrgs]
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg skal bruges indenfor <OrgProvider>')
  return ctx
}
