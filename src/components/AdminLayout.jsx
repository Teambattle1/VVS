import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Package,
  Boxes,
  Users2,
  Settings as SettingsIcon,
  ArrowLeft,
  LogOut,
  FileText,
  Plug,
  Activity,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useOrg } from '../contexts/OrgContext.jsx'
import BrandIcon from './BrandIcon.jsx'

const NAV = [
  { to: '/admin/packages', label: 'Pakke-skabeloner', icon: Package },
  { to: '/admin/items', label: 'Varedatabase', icon: Boxes },
  { to: '/admin/users', label: 'Team', icon: Users2 },
  { to: '/admin/activity', label: 'Aktivitetslog', icon: Activity },
  { to: '/admin/settings', label: 'Indstillinger', icon: SettingsIcon },
  { to: '/admin/integrations', label: 'Integrationer', icon: Plug },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { org } = useOrg()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Tilbage til jobs"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <BrandIcon size={36} className="text-slate-900" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 truncate">{org?.name || 'Org-admin'}</div>
            <div className="text-sm font-bold text-slate-900 truncate">Administration</div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Log ud"
          >
            <LogOut className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
        <aside className="md:sticky md:top-20 md:self-start">
          <nav className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px]',
                      isActive
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <div className="hidden md:block mt-4 px-2 text-[11px] text-slate-400 leading-relaxed">
            <FileText className="w-3.5 h-3.5 inline mr-1" strokeWidth={2} />
            Ændringer gælder for hele din organisation.
          </div>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
