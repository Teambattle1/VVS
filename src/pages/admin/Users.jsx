import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, X, Mail, Phone, Shield, User as UserIcon } from 'lucide-react'
import clsx from 'clsx'
import { useOrg } from '../../contexts/OrgContext.jsx'
import { ROLES } from '../../lib/mockUsers.js'

export default function AdminUsers() {
  const { team, addTeamMember, updateTeamMember, removeTeamMember } = useOrg()
  const [editing, setEditing] = useState(null)

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500">
            {team.length} medlemmer · {team.filter((u) => u.active).length} aktive
          </p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="btn-primary">
          <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
          Inviter person
        </button>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {team.map((u) => (
          <li
            key={u.id}
            className={clsx('card p-4 flex items-start gap-3', !u.active && 'opacity-60')}
          >
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              {u.role === 'org_admin' ? (
                <Shield className="w-5 h-5" strokeWidth={2} />
              ) : (
                <UserIcon className="w-5 h-5" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-bold text-slate-900 truncate">{u.name}</div>
                <span
                  className={clsx(
                    'chip text-[10px]',
                    u.role === 'org_admin'
                      ? 'bg-violet-100 text-violet-800'
                      : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {ROLES.find((r) => r.value === u.role)?.label || u.role}
                </span>
                {!u.active && (
                  <span className="chip bg-slate-100 text-slate-500 text-[10px]">Inaktiv</span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Mail className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="truncate">{u.email}</span>
              </div>
              {u.phone && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" strokeWidth={2} />
                  {u.phone}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditing(u)}
                className="w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                aria-label="Rediger"
              >
                <Edit2 className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Fjern ${u.name} fra teamet?`)) removeTeamMember(u.id)
                }}
                className="w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                aria-label="Fjern"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <UserDialog
          user={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing === 'new') addTeamMember(data)
            else updateTeamMember(editing.id, data)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function UserDialog({ user, onSave, onClose }) {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [role, setRole] = useState(user?.role || 'montor')
  const [active, setActive] = useState(user?.active !== false)

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ name, email, phone, role, active })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex-1">
            {user ? 'Rediger person' : 'Inviter person'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="label">Navn</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Telefon</label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+45 20 12 34 56"
            />
          </div>

          <div>
            <label className="label">Rolle</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={clsx(
                    'rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors',
                    role === r.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {user && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Aktiv bruger</div>
                <div className="text-xs text-slate-500">
                  Inaktive kan ikke logge ind.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActive((a) => !a)}
                className={clsx(
                  'w-12 h-7 rounded-full relative transition-colors',
                  active ? 'bg-emerald-500' : 'bg-slate-300'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform',
                    active ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Annuller
          </button>
          <button type="submit" className="btn-primary flex-1">
            <Check className="w-5 h-5 text-white" strokeWidth={2.25} />
            Gem
          </button>
        </footer>
      </form>
    </div>
  )
}
