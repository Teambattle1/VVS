import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Droplets, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Kunne ikke logge ind. Prøv igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-gradient-to-b from-sky-50 via-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center shadow-sm mb-4">
            <Droplets className="w-7 h-7 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">VVS FLOW</h1>
          <p className="text-sm text-slate-500 mt-1">Log ind for at se dine sager</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                strokeWidth={2}
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input pl-11"
                placeholder="din@vvs-firma.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">Adgangskode</label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                strokeWidth={2}
              />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input pl-11"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-500" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" strokeWidth={2} />
                Logger ind…
              </>
            ) : (
              'Log ind'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-brand-primary font-semibold hover:underline"
              onClick={() => alert('Glemt adgangskode kommer i Fase 2')}
            >
              Glemt adgangskode?
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl bg-white/70 border border-slate-200 px-4 py-3 text-xs text-slate-500 text-center">
          Mock-login: Udfyld vilkårlig email + adgangskode og tryk <strong className="text-slate-700">Log ind</strong>.
        </div>
      </div>
    </div>
  )
}
