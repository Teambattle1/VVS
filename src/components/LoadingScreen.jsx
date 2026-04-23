import { Loader2 } from 'lucide-react'
import BrandIcon from './BrandIcon.jsx'

export default function LoadingScreen({ message = 'Indlæser…' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <BrandIcon size={56} className="text-slate-900 opacity-60" />
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
          {message}
        </div>
      </div>
    </div>
  )
}
