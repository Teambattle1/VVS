import { useState } from 'react'
import { X, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import { useToast } from '../contexts/ToastContext.jsx'
import { sendSMS } from '../lib/notifications.js'

export default function ShareDialog({ url, customerPhone, customerName, jobNumber, orgName, onClose }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const [phone, setPhone] = useState(customerPhone || '')
  const [sending, setSending] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link kopieret')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Kunne ikke kopiere — marker manuelt')
    }
  }

  async function handleSendSms() {
    if (!phone.trim()) {
      toast.error('Indtast telefonnummer først')
      return
    }
    setSending(true)
    const msg = `Hej ${customerName || ''}! ${orgName || 'VVS FLOW'} har sendt dig et tilbud: ${url}`
    try {
      const res = await sendSMS({ to: phone.trim(), message: msg })
      if (res?.mocked) {
        toast.info('SMS-afsending er BETA — log-only indtil CPSMS er konfigureret', { duration: 5000 })
      } else if (res?.ok) {
        toast.success(`SMS sendt til ${phone}`)
      } else {
        toast.error('SMS-afsending fejlede')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Del med kunde</h2>
            <p className="text-xs text-slate-500">
              {jobNumber} · kopier link eller send som SMS
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div>
            <div className="label">Kundelink</div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={url}
                onFocus={(e) => e.target.select()}
                className="input flex-1 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={clsx(
                  'btn-primary flex-shrink-0',
                  copied && 'bg-emerald-500'
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    Kopieret
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" strokeWidth={2} />
                    Kopier
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => window.open(url, '_blank')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold mt-2 inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
              Åbn som kunde
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
            <div className="label flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-slate-500" strokeWidth={2} />
              Send som SMS
              <span className="chip bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider">
                BETA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Kræver CPSMS-konfiguration. Indtil da logges SMS-indhold kun i konsollen.
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                className="input flex-1"
                placeholder="+45 20 12 34 56"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSendSms}
                disabled={sending || !phone.trim()}
                className={clsx(
                  'btn-primary flex-shrink-0',
                  (sending || !phone.trim()) && 'opacity-60 cursor-not-allowed'
                )}
              >
                <MessageSquare className="w-4 h-4 text-white" strokeWidth={2} />
                {sending ? 'Sender…' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-slate-100 text-[11px] text-slate-500">
          Tilbuddet opdateres live — kunden kan godkende, kommentere og ændre valg direkte via linket.
        </footer>
      </div>
    </div>
  )
}
