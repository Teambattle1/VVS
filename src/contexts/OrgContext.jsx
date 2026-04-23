import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'
import { hasSupabase, supabase } from '../lib/supabase.js'
import { INITIAL_TEAM } from '../lib/mockUsers.js'
import { INITIAL_ORGS } from '../lib/mockOrgs.js'

const OrgContext = createContext(null)

const MOCK_ORG = INITIAL_ORGS[0]

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const ACTIVE_ORG_STORAGE = 'vvs.activeOrgId'

function getStoredActiveOrg(userId) {
  try {
    const map = JSON.parse(localStorage.getItem(ACTIVE_ORG_STORAGE) || '{}')
    return map[userId] || null
  } catch {
    return null
  }
}
function setStoredActiveOrg(userId, orgId) {
  try {
    const map = JSON.parse(localStorage.getItem(ACTIVE_ORG_STORAGE) || '{}')
    if (orgId) map[userId] = orgId
    else delete map[userId]
    localStorage.setItem(ACTIVE_ORG_STORAGE, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

export function OrgProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const [org, setOrg] = useState(null) // aktive org (=homeOrg for ikke-super-admins)
  const [homeOrgId, setHomeOrgId] = useState(null) // brugerens egen org fra vvs_users
  const [userRole, setUserRole] = useState(null)
  // Alle brugere faar default-kode '1234' medmindre anden angivet
  const [team, setTeam] = useState(() =>
    INITIAL_TEAM.map((u) => ({ ...u, password: u.password || '1234' }))
  )
  const [allOrgs, setAllOrgs] = useState(hasSupabase ? [] : INITIAL_ORGS)

  function reportDbError(where, err) {
    // eslint-disable-next-line no-console
    console.warn(`[OrgContext] ${where}:`, err)
    toast?.error?.(`${where}: ${err?.message || err}`, { duration: 6000 })
  }

  useEffect(() => {
    let cancelled = false

    async function loadOrgForUser() {
      if (!user) {
        setOrg(null)
        setHomeOrgId(null)
        setUserRole(null)
        return
      }

      if (hasSupabase) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('vvs_users')
            .select('organization_id, name, role')
            .eq('user_id', user.id)
            .eq('active', true)
            .maybeSingle()

          if (profileError) throw profileError

          if (profile?.organization_id) {
            if (!cancelled) {
              setHomeOrgId(profile.organization_id)
              setUserRole(profile.role)
            }

            // Super-admin: brug gemt activeOrgId hvis den findes, ellers home
            const isSuperAdmin = profile.role === 'super_admin'
            const storedActive = isSuperAdmin ? getStoredActiveOrg(user.id) : null
            const targetOrgId = storedActive || profile.organization_id

            const { data: orgRow, error: orgError } = await supabase
              .from('vvs_organizations')
              .select('*')
              .eq('id', targetOrgId)
              .maybeSingle()

            if (orgError) throw orgError
            if (!cancelled && orgRow) {
              setOrg(orgRow)
              return
            }
          }

          if (!cancelled) setOrg(MOCK_ORG)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[OrgContext] Supabase org-lookup fejlede, bruger mock:', err.message)
          if (!cancelled) setOrg(MOCK_ORG)
        }
      } else {
        setOrg(MOCK_ORG)
        setHomeOrgId(MOCK_ORG.id)
        setUserRole('super_admin') // mock-mode: super-admin saa features kan testes
      }
    }

    loadOrgForUser()
    return () => {
      cancelled = true
    }
  }, [user])

  async function switchActiveOrg(orgId) {
    if (!user) return
    if (userRole !== 'super_admin') {
      toast?.error?.('Kun super-admin kan skifte organisation')
      return
    }
    setStoredActiveOrg(user.id, orgId === homeOrgId ? null : orgId)

    if (hasSupabase) {
      try {
        const { data } = await supabase
          .from('vvs_organizations')
          .select('*')
          .eq('id', orgId)
          .maybeSingle()
        if (data) {
          setOrg(data)
          toast?.success?.(`Skiftet til ${data.name}`)
        }
      } catch (err) {
        reportDbError('Kunne ikke skifte organisation', err)
      }
    } else {
      const next = allOrgs.find((o) => o.id === orgId)
      if (next) {
        setOrg(next)
        toast?.success?.(`Skiftet til ${next.name}`)
      }
    }
  }

  function resetToHomeOrg() {
    if (homeOrgId) switchActiveOrg(homeOrgId)
  }

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

  async function updateOrg(patch) {
    const currentId = org?.id
    // Optimistic local update
    setOrg((prev) => (prev ? { ...prev, ...patch, updated_at: new Date().toISOString() } : prev))
    setAllOrgs((prev) =>
      prev.map((o) => (o.id === currentId ? { ...o, ...patch } : o))
    )

    // Persist til Supabase (kun rigtige UUID'er — ikke mock 'org-mock-*')
    if (hasSupabase && currentId && !currentId.startsWith('org-mock')) {
      try {
        const { error } = await supabase
          .from('vvs_organizations')
          .update(patch)
          .eq('id', currentId)
        if (error) throw error
      } catch (err) {
        reportDbError('Kunne ikke gemme org-ændring', err)
        throw err
      }
    }
  }

  function addTeamMember({ name, email, phone, role, password, active }) {
    const newUser = {
      id: uid('u'),
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      role: role || 'montor',
      active: active !== false,
      password: (password && password.trim()) || '1234',
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

  async function addOrg(data) {
    const payload = {
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
    }

    // Persist til Supabase hvis muligt
    if (hasSupabase) {
      try {
        const { data: dbRow, error } = await supabase
          .from('vvs_organizations')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setAllOrgs((prev) => [{ ...dbRow, users_count: 0 }, ...prev])
        return dbRow
      } catch (err) {
        reportDbError('Kunne ikke oprette organisation', err)
        throw err
      }
    }

    // Mock fallback
    const newOrg = { id: uid('org'), ...payload, created_at: new Date().toISOString(), users_count: 0 }
    setAllOrgs((prev) => [newOrg, ...prev])
    return newOrg
  }

  async function updateOrgById(orgId, patch) {
    setAllOrgs((prev) => prev.map((o) => (o.id === orgId ? { ...o, ...patch } : o)))
    if (org?.id === orgId) setOrg((prev) => ({ ...prev, ...patch }))

    if (hasSupabase && orgId && !orgId.startsWith('org-mock') && !orgId.startsWith('org-')) {
      try {
        const { error } = await supabase
          .from('vvs_organizations')
          .update(patch)
          .eq('id', orgId)
        if (error) throw error
      } catch (err) {
        reportDbError('Kunne ikke gemme org-ændring', err)
      }
    }
  }

  // Load alle orgs (til super-admin) ved login
  useEffect(() => {
    if (!hasSupabase || !user) return
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('vvs_organizations')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (!cancelled) setAllOrgs(data || [])
      } catch (err) {
        // Ignorer - ikke alle brugere kan se alle orgs (RLS), og det er OK
        // eslint-disable-next-line no-console
        console.warn('[OrgContext] Kunne ikke loade allOrgs:', err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const isSuperAdmin = userRole === 'super_admin'
  const isSwitched = homeOrgId && org?.id && org.id !== homeOrgId

  const value = useMemo(
    () => ({
      org,
      setOrg,
      updateOrg,
      userRole,
      isSuperAdmin,
      homeOrgId,
      isSwitched,
      switchActiveOrg,
      resetToHomeOrg,
      team,
      addTeamMember,
      updateTeamMember,
      removeTeamMember,
      allOrgs,
      addOrg,
      updateOrgById,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [org, team, allOrgs, userRole, homeOrgId, isSuperAdmin, isSwitched]
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg skal bruges indenfor <OrgProvider>')
  return ctx
}
