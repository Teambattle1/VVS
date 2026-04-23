import { createContext, useContext, useEffect, useState } from 'react'

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
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setUser(JSON.parse(saved))
    } catch (_) {
      /* ignore */
    }
    setLoading(false)
  }, [])

  async function signIn({ email, password }) {
    await new Promise((r) => setTimeout(r, 400))
    if (!email || !password) {
      throw new Error('Udfyld både email og adgangskode')
    }
    const next = { ...MOCK_USER, email }
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  }

  function signOut() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth skal bruges indenfor <AuthProvider>')
  return ctx
}
