import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import BrandIcon from './BrandIcon.jsx'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="card p-8 max-w-md w-full text-center">
        <BrandIcon size={56} className="mx-auto mb-4 text-slate-900 opacity-60" />
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-6 h-6" strokeWidth={2} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">Siden findes ikke</h1>
        <p className="text-sm text-slate-600 mb-5">
          Det ser ud til at linket er forkert eller siden er flyttet.
        </p>
        <Link to="/" className="btn-primary inline-flex">
          Til forsiden
        </Link>
      </div>
    </div>
  )
}
