import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Building2, Check, Home, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { useOrg } from '../contexts/OrgContext.jsx'

export default function OrgSwitcher({ className }) {
  const { org, allOrgs, isSuperAdmin, isSwitched, homeOrgId, switchActiveOrg, resetToHomeOrg } = useOrg()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (!isSuperAdmin || !org) return null

  return (
    <div ref={wrapRef} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-sm font-semibold border-2 transition-colors',
          isSwitched
            ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
        )}
        title={isSwitched ? 'Du er logget ind som super-admin i en anden org' : 'Skift organisation'}
      >
        {isSwitched ? (
          <ShieldCheck className="w-4 h-4 flex-shrink-0" strokeWidth={2.25} />
        ) : (
          <Building2 className="w-4 h-4 flex-shrink-0 text-slate-500" strokeWidth={2} />
        )}
        <span className="max-w-[140px] md:max-w-[200px] truncate">{org.name}</span>
        <ChevronDown
          className={clsx('w-4 h-4 transition-transform flex-shrink-0', open && 'rotate-180')}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 max-h-[70vh] flex flex-col">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
              Super-admin
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Vælg hvilken organisation du vil arbejde i.
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {isSwitched && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    resetToHomeOrg()
                    setOpen(false)
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Tilbage til min org
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Super-admin platform
                    </div>
                  </div>
                </button>
              </li>
            )}
            {allOrgs.map((o) => {
              const active = o.id === org.id
              const isHome = o.id === homeOrgId
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      switchActiveOrg(o.id)
                      setOpen(false)
                    }}
                    className={clsx(
                      'w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left',
                      active && 'bg-sky-50 dark:bg-sky-900/30'
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{
                        backgroundColor: `${o.primary_color || '#0EA5E9'}15`,
                        borderColor: o.primary_color || '#0EA5E9',
                      }}
                    >
                      {o.logo_url ? (
                        <img src={o.logo_url} alt="" className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <Building2 className="w-4 h-4" strokeWidth={2} style={{ color: o.primary_color || '#0EA5E9' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        {o.name}
                        {isHome && (
                          <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold">
                            HOME
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {o.subscription_tier?.toUpperCase() || 'TRIAL'} · {o.users_count || 0} brugere
                      </div>
                    </div>
                    {active && (
                      <Check className="w-4 h-4 text-sky-600 flex-shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {allOrgs.length === 0 && (
            <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
              Ingen organisationer fundet. Opret en via super-admin panelet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
