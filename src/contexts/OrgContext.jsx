import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'
import { hasSupabase, supabase } from '../lib/supabase.js'
import { INITIAL_TEAM } from '../lib/mockUsers.js'
import { INITIAL_ORGS } from '../lib/mockOrgs.js'
import * as teamRepo from '../lib/teamRepo.js'

// ============================================
// Single-tenant OrgContext.
// Appen er bygget til ét firma — der findes ingen org-switcher,
// ingen super-admin, ingen multi-org listing. Det første firma i
// vvs_organizations indlæses som "the org", og oprettes hvis tomt.
// ============================================

const OrgContext = createContext(null)

const MOCK_ORG = INITIAL_ORGS[0]

const DEFAULT_ORG_PAYLOAD = {
  name: 'Mit VVS-firma',
  slug: 'mit-vvs-firma',
  cvr: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  primary_color: '#0EA5E9',
  accent_color: '#F59E0B',
  logo_url: null,
  default_hourly_rate: 650,
  default_markup_percent: 25,
  subscription_tier: 'pro',
  subscription_status: 'active',
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function OrgProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const [org, setOrg] = useState(null)
  const [team, setTeam] = useState(() =>
    INITIAL_TEAM.map((u) => ({ ...u, password: u.password || '1234' }))
  )

  function reportDbError(where, err) {
    // eslint-disable-next-line no-console
    console.warn(`[OrgContext] ${where}:`, err)
    toast?.error?.(`${where}: ${err?.message || err}`, { duration: 6000 })
  }

  async function refreshTeam(orgId) {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!hasSupabase || !orgId || !UUID_RE.test(String(orgId))) return
    try {
      const rows = await teamRepo.loadTeam(orgId)
      if (rows.length === 0) {
        // Første gang: seed INITIAL_TEAM så demo-brugerne findes
        for (const u of INITIAL_TEAM) {
          // eslint-disable-next-line no-await-in-loop
          await teamRepo
            .createTeamMember({ orgId, ...u, password: u.password || '1234' })
            .catch(() => {})
        }
        const seeded = await teamRepo.loadTeam(orgId)
        setTeam(seeded)
      } else {
        setTeam(rows)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[OrgContext] kunne ikke loade team fra DB:', err?.message)
    }
  }

  // Indlæs (eller opret) det ene firma
  useEffect(() => {
    let cancelled = false
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    async function loadOrCreateOrg() {
      if (!user) {
        setOrg(null)
        return
      }

      if (!hasSupabase) {
        setOrg(MOCK_ORG)
        return
      }

      // 1. Hvis demo-login allerede har leveret org-data, brug den
      if (user.organization) {
        if (!cancelled) setOrg(user.organization)
        return
      }

      // 2. Mock-brugere (id ikke UUID) springer DB over — undgår 400/401/RLS-stoej
      if (!UUID_RE.test(String(user.id))) {
        if (!cancelled) setOrg(MOCK_ORG)
        return
      }

      try {
        // 3. Hent første firma fra DB
        const { data: existing, error } = await supabase
          .from('vvs_organizations')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (error) throw error

        if (existing) {
          if (!cancelled) setOrg(existing)
          return
        }

        // 4. Tomt: forsøg at oprette default-firma. Fejler hvis RLS blokerer
        // anon-insert — så falder vi tilbage til MOCK_ORG.
        const { data: created, error: createError } = await supabase
          .from('vvs_organizations')
          .insert(DEFAULT_ORG_PAYLOAD)
          .select()
          .single()
        if (createError) throw createError
        if (!cancelled) {
          setOrg(created)
          toast?.success?.('Firma oprettet — udfyld dine oplysninger under Indstillinger')
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[OrgContext] kunne ikke loade/oprette org — bruger MOCK_ORG:', err.message)
        if (!cancelled) setOrg(MOCK_ORG)
      }
    }

    loadOrCreateOrg()
    return () => {
      cancelled = true
    }
  }, [user])

  // Synk brand-farver til CSS custom properties
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

  // Load team når org-id ændres
  useEffect(() => {
    if (org?.id) refreshTeam(org.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id])

  async function updateOrg(patch) {
    const currentId = org?.id
    setOrg((prev) => (prev ? { ...prev, ...patch, updated_at: new Date().toISOString() } : prev))

    if (hasSupabase && currentId && !String(currentId).startsWith('org-mock')) {
      try {
        const { error } = await supabase
          .from('vvs_organizations')
          .update(patch)
          .eq('id', currentId)
        if (error) throw error
      } catch (err) {
        reportDbError('Kunne ikke gemme firma-ændring', err)
        throw err
      }
    }
  }

  async function addTeamMember({ name, email, phone, role, password, active }) {
    const input = {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      role: role || 'montor',
      active: active !== false,
      password: (password && password.trim()) || '1234',
    }
    if (hasSupabase && org?.id) {
      try {
        const created = await teamRepo.createTeamMember({ orgId: org.id, ...input })
        setTeam((prev) => [created, ...prev])
        return created
      } catch (err) {
        reportDbError('Kunne ikke gemme bruger', err)
        throw err
      }
    }
    const local = { id: uid('u'), ...input }
    setTeam((prev) => [local, ...prev])
    return local
  }

  async function updateTeamMember(userId, patch) {
    setTeam((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)))
    if (hasSupabase && org?.id && !String(userId).startsWith('u-')) {
      try {
        const updated = await teamRepo.updateTeamMemberDb(userId, patch)
        setTeam((prev) => prev.map((u) => (u.id === userId ? updated : u)))
      } catch (err) {
        reportDbError('Kunne ikke opdatere bruger', err)
      }
    }
  }

  async function removeTeamMember(userId) {
    setTeam((prev) => prev.filter((u) => u.id !== userId))
    if (hasSupabase && !String(userId).startsWith('u-')) {
      try {
        await teamRepo.deleteTeamMember(userId)
      } catch (err) {
        reportDbError('Kunne ikke slette bruger', err)
      }
    }
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [org, team]
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg skal bruges indenfor <OrgProvider>')
  return ctx
}
