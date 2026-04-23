import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx'
import BrandIcon from '../components/BrandIcon.jsx'

export default function CustomerLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp } = useCustomerAuth()

  const [mode, setMode] = useState(location.state?.mode === 'signup' ? 'signup' : 'signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(location.state?.email || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from || '/kunde'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUp({ name, email, password })
      } else {
        await signIn({ email, password })
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-gradient-to-b from-sky-50 via-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <BrandIcon size={56} className="mb-4 text-slate-900" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            VVS <span className="text-sky-500">FLOW</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signup' ? 'Opret kundekonto' : 'Log ind som kunde'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="label">Dit navn</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="input pl-11"
                  placeholder="Fornavn Efternavn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input pl-11"
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">Adgangskode</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="input pl-11"
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-slate-500 mt-1">Mindst 6 tegn.</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-500" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" strokeWidth={2} />
                {mode === 'signup' ? 'Opretter…' : 'Logger ind…'}
              </>
            ) : mode === 'signup' ? (
              'Opret konto'
            ) : (
              'Log ind'
            )}
          </button>

          <div className="text-center text-sm">
            {mode === 'signup' ? (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-sky-600 font-semibold hover:underline"
              >
                Har du allerede en konto? Log ind
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-sky-600 font-semibold hover:underline"
              >
                Ny kunde? Opret konto
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link to="/login" className="hover:underline">Log ind som VVS-medarbejder i stedet</Link>
        </div>
      </div>
    </div>
  )
}
