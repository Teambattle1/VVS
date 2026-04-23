import { createContext, useContext, useEffect, useState } from 'react'
import { hasSupabase, supabase } from '../lib/supabase.js'
import { logAuthEvent } from '../lib/authEvents.js'

const AuthContext = createContext(null)

const STORAGE_KEY = 'vvs.mockAuth'

const MOCK_USER = {
  id: 'mock-user-1',
  email: 'demo@vvs-kbh.dk',
  name: 'Mikkel Montør',
  role: 'montor',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      if (hasSupabase) {
        // Rigtig Supabase Auth
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        if (data.session?.user) {
          const u = await enrichUserWithProfile(data.session.user)
          setUser(u)
        }
        setLoading(false)

        // Abonnér på auth-state changes
        const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const u = await enrichUserWithProfile(session.user)
            setUser(u)
            if (event === 'SIGNED_IN') {
              logAuthEvent({ type: 'login', userId: u.id, userEmail: u.email, userName: u.name })
            }
          } else {
            setUser((prev) => {
              if (prev && event === 'SIGNED_OUT') {
                logAuthEvent({ type: 'logout', userId: prev.id, userEmail: prev.email, userName: prev.name })
              }
              return null
            })
          }
        })
        return () => sub.subscription.unsubscribe()
      } else {
        // Mock-fallback (localStorage)
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) setUser(JSON.parse(saved))
        } catch (_) {
          /* ignore */
        }
        setLoading(false)
      }
    }

    const cleanup = init()
    return () => {
      mounted = false
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])

  async function signIn({ email, password }) {
    if (!email || !password) {
      throw new Error('Udfyld både email og adgangskode')
    }

    if (hasSupabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Dansk fejlbesked
        if (error.message.toLowerCase().includes('invalid')) {
          throw new Error('Forkert email eller adgangskode')
        }
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Emailen er ikke bekræftet endnu')
        }
        throw new Error(error.message)
      }
      const next = await enrichUserWithProfile(data.user)
      setUser(next)
      logAuthEvent({ type: 'login', userId: next.id, userEmail: next.email, userName: next.name })
      return next
    }

    // Mock-fallback
    await new Promise((r) => setTimeout(r, 400))
    const next = { ...MOCK_USER, email }
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    logAuthEvent({ type: 'login', userId: next.id, userEmail: next.email, userName: next.name })
    return next
  }

  async function signOut() {
    if (user) {
      logAuthEvent({ type: 'logout', userId: user.id, userEmail: user.email, userName: user.name })
    }
    if (hasSupabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

function userFromSupabase(authUser) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Bruger',
    role: authUser.user_metadata?.role || 'montor',
  }
}

// Beriger auth-user med data fra vvs_users-tabellen (navn + rolle)
// saa UI viser det rigtige navn i stedet for user_metadata eller email-prefix.
async function enrichUserWithProfile(authUser) {
  const base = userFromSupabase(authUser)
  if (!hasSupabase) return base
  try {
    const { data } = await supabase
      .from('vvs_users')
      .select('name, role')
      .eq('user_id', authUser.id)
      .eq('active', true)
      .maybeSingle()
    if (data) {
      return {
        ...base,
        name: data.name || base.name,
        role: data.role || base.role,
      }
    }
  } catch {
    /* ignorer - fallback til base */
  }
  return base
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth skal bruges indenfor <AuthProvider>')
  return ctx
}
