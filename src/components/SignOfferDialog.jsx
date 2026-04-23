import { useState } from 'react'
import { X, CheckCircle2, PenLine } from 'lucide-react'
import clsx from 'clsx'
import { formatDKK, toInclVat } from '../lib/pricing.js'
import SignaturePad from './SignaturePad.jsx'

export default function SignOfferDialog({
  total,
  vatHandling,
  orgName,
  onConfirm,
  onClose,
  mode = 'approve',
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [signature, setSignature] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit =
    name.trim().length >= 2 &&
    (mode === 'reject'
      ? true
      : /.+@.+\..+/.test(email) && signature)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 300))
    onConfirm({
      name: name.trim(),
      email: email.trim(),
      reason: reason.trim(),
      signature,
    })
  }

  const isReject = mode === 'reject'

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
              isReject ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            )}
          >
            {isReject ? (
              <X className="w-5 h-5" strokeWidth={2} />
            ) : (
              <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">
              {isReject ? 'Afvis tilbud' : 'Godkend og underskriv'}
            </h2>
            <p className="text-xs text-slate-500">
              {isReject
                ? `Du afviser tilbuddet fra ${orgName}.`
                : `Bekræft samlet pris på ${formatDKK(toInclVat(total))} inkl. moms.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 flex items-center justify-center flex-shrink-0"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto">
          {!isReject && (
            <div className="rounded-2xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
              Ved at underskrive godkender du tilbuddet. Du vil modtage en kopi på din email.
            </div>
          )}

          <div>
            <label htmlFor="sign-name" className="label">Dit navn</label>
            <input
              id="sign-name"
              type="text"
              className="input"
              placeholder="Fornavn Efternavn"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {!isReject && (
            <>
              <div>
                <label htmlFor="sign-email" className="label">Din email</label>
                <input
                  id="sign-email"
                  type="email"
                  className="input"
                  placeholder="din@email.dk"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Din underskrift</label>
                <SignaturePad value={signature} onChange={setSignature} />
              </div>
            </>
          )}

          {isReject && (
            <div>
              <label htmlFor="sign-reason" className="label">Begrundelse (valgfrit)</label>
              <textarea
                id="sign-reason"
                rows={3}
                className="input"
                placeholder="Fx: Vi har valgt en anden leverandør."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Annuller
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={clsx(
              'flex-1',
              isReject
                ? 'btn inline-flex items-center justify-center gap-2 bg-rose-600 text-white hover:brightness-110 shadow-sm min-h-[44px] rounded-2xl font-semibold text-sm px-4 py-3'
                : 'btn-primary',
              (!canSubmit || submitting) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isReject ? (
              'Afvis tilbud'
            ) : (
              <>
                <PenLine className="w-5 h-5 text-white" strokeWidth={2.25} />
                Underskriv og godkend
              </>
            )}
          </button>
        </footer>
      </form>
    </div>
  )
}
