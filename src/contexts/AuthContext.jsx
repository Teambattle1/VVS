import { createContext, useContext, useEffect, useState } from 'react'
import { hasSupabase, supabase } from '../lib/supabase.js'

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
          setUser(userFromSupabase(data.session.user))
        }
        setLoading(false)

        // Abonnér på auth-state changes
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ? userFromSupabase(session.user) : null)
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
      const next = userFromSupabase(data.user)
      setUser(next)
      return next
    }

    // Mock-fallback
    await new Promise((r) => setTimeout(r, 400))
    const next = { ...MOCK_USER, email }
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  }

  async function signOut() {
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth skal bruges indenfor <AuthProvider>')
  return ctx
}
