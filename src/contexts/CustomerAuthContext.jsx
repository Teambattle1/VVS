import { createContext, useContext, useEffect, useState } from 'react'

const CustomerAuthContext = createContext(null)

const STORAGE_KEY = 'vvs.customerAuth'

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCustomer(JSON.parse(saved))
    } catch (_) {
      /* ignore */
    }
    setLoading(false)
  }, [])

  async function signUp({ name, email, password }) {
    await new Promise((r) => setTimeout(r, 300))
    if (!name || !email || !password) {
      throw new Error('Udfyld navn, email og adgangskode')
    }
    if (password.length < 6) {
      throw new Error('Adgangskoden skal være mindst 6 tegn')
    }
    const next = { id: `cust-${Date.now()}`, name, email, createdAt: new Date().toISOString() }
    setCustomer(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  }

  async function signIn({ email, password }) {
    await new Promise((r) => setTimeout(r, 300))
    if (!email || !password) throw new Error('Udfyld email og adgangskode')
    // Mock: accepterer enhver email+password kombination
    const next = { id: `cust-${Date.now()}`, name: email.split('@')[0], email }
    setCustomer(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  }

  function signOut() {
    setCustomer(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, signUp, signIn, signOut }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth skal bruges indenfor <CustomerAuthProvider>')
  return ctx
}
