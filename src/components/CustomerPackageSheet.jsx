import { useState } from 'react'
import {
  X,
  Check,
  XCircle,
  StickyNote,
  CalendarClock,
  MessageSquarePlus,
  Send,
  CheckCircle2,
  Camera,
} from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../contexts/JobsContext.jsx'
import { packageTotal, formatDKK, toInclVat } from '../lib/pricing.js'
import { notifyMontorCustomerAction } from '../lib/notifications.js'
import LucideByName from './LucideByName.jsx'
import PhotoGallery from './PhotoGallery.jsx'

export default function CustomerPackageSheet({
  job,
  room,
  pkg,
  customerName,
  onClose,
  readOnly = false,
}) {
  const {
    toggleItemSelected,
    addComment,
    approvePackage,
    rejectPackage,
  } = useJobs()
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  if (!pkg) return null

  const total = packageTotal(pkg)
  const isApproved = pkg.status === 'approved_by_customer'
  const isRejected = pkg.status === 'rejected_by_customer'
  const showIncl = job.vat_handling !== 'excl'
  const showExcl = job.vat_handling === 'excl'

  const comments = (job.actions || []).filter(
    (a) => a.action_type === 'comment' && a.room_package_id === pkg.id
  )

  function handleToggle(item) {
    if (readOnly) return
    toggleItemSelected(job.id, room.id, pkg.id, item.id, !item.customer_selected, {
      name: customerName,
    })
  }

  function handleApprove() {
    approvePackage(job.id, room.id, pkg.id, customerName)
    notifyMontorCustomerAction({
      job,
      org: null,
      actorName: customerName,
      action: 'approve',
      message: `Godkendte pakken ${pkg.name}`,
    })
  }

  function handleReject() {
    const reason = prompt('Hvorfor afviser du denne pakke? (valgfrit)') || ''
    rejectPackage(job.id, room.id, pkg.id, { customerName, reason })
    notifyMontorCustomerAction({
      job,
      org: null,
      actorName: customerName,
      action: 'reject',
      message: `Afviste ${pkg.name}${reason ? `: ${reason}` : ''}`,
    })
  }

  function handleSendComment() {
    if (!commentText.trim()) return
    setSendingComment(true)
    addComment(job.id, {
      roomPackageId: pkg.id,
      message: commentText.trim(),
      customerName,
    })
    notifyMontorCustomerAction({
      job,
      org: null,
      actorName: customerName,
      action: 'comment',
      message: commentText.trim(),
    })
    setCommentText('')
    setTimeout(() => setSendingComment(false), 200)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[460px] bg-white z-50 rounded-t-3xl md:rounded-none shadow-2xl flex flex-col max-h-[92vh] md:max-h-none md:h-screen"
        role="dialog"
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-start gap-3 sticky top-0 bg-white">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <LucideByName name={pkg.lucide_icon} className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{pkg.name}</h2>
            <div className="text-xs text-slate-500">{room.name}</div>
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

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isApproved && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <span>Du har godkendt denne pakke.</span>
            </div>
          )}
          {isRejected && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800 flex items-start gap-2">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <span>Du har afvist denne pakke.</span>
            </div>
          )}

          {pkg.notes && (
            <section>
              <h3 className="label flex items-center gap-1.5">
                <StickyNote className="w-4 h-4 text-slate-500" strokeWidth={2} />
                Note fra VVS&apos;eren
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{pkg.notes}</p>
            </section>
          )}

          {pkg.timeline_text && (
            <section>
              <h3 className="label flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-slate-500" strokeWidth={2} />
                Tidsplan
              </h3>
              <p className="text-sm text-slate-700">{pkg.timeline_text}</p>
            </section>
          )}

          {pkg.photos?.length > 0 && (
            <section>
              <h3 className="label flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-500" strokeWidth={2} />
                Fotos fra VVS&apos;eren
              </h3>
              <PhotoGallery photos={pkg.photos} readOnly />
            </section>
          )}

          {pkg.items?.length > 0 && (
            <section>
              <h3 className="label">Varer — vælg til eller fra</h3>
              <ul className="space-y-2">
                {pkg.items.map((it) => {
                  const selected = it.customer_selected !== false
                  return (
                    <li
                      key={it.id}
                      className={clsx(
                        'rounded-2xl border-2 px-3 py-3 flex items-center gap-3 transition-colors',
                        selected ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 bg-white opacity-70'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(it)}
                        disabled={readOnly}
                        className={clsx(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition',
                          selected
                            ? 'bg-sky-500 border-sky-500'
                            : 'border-slate-300 bg-white hover:border-sky-400'
                        )}
                        aria-label={selected ? 'Fravælg' : 'Tilvælg'}
                      >
                        {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={clsx(
                          'text-sm font-semibold truncate',
                          selected ? 'text-slate-900' : 'text-slate-400 line-through'
                        )}>
                          {it.name_snapshot}
                        </div>
                        <div className="text-xs text-slate-500">
                          {it.quantity} × {formatDKK(it.unit_price)}
                        </div>
                      </div>
                      <div className={clsx(
                        'text-sm font-bold',
                        selected ? 'text-slate-900' : 'text-slate-400 line-through'
                      )}>
                        {formatDKK(it.quantity * it.unit_price)}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section>
            <h3 className="label flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-slate-500" strokeWidth={2} />
              Kommentar til VVS&apos;eren
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="Skriv en besked…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={readOnly}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendComment()
                }}
              />
              <button
                type="button"
                onClick={handleSendComment}
                disabled={readOnly || !commentText.trim() || sendingComment}
                className="btn-primary flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" strokeWidth={2.5} />
              </button>
            </div>

            {comments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <div className="font-semibold text-slate-900 text-xs">{c.actor_name}</div>
                    <div className="text-slate-700">{c.message}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Pakke i alt</span>
            <div className="text-right">
              {showIncl && (
                <div className="text-xl font-extrabold text-slate-900">
                  {formatDKK(toInclVat(total))}
                  <span className="text-xs font-semibold text-slate-500 ml-1">inkl.</span>
                </div>
              )}
              {showExcl && (
                <div className="text-sm text-slate-500">
                  {formatDKK(total)} ekskl.
                </div>
              )}
            </div>
          </div>

          {!readOnly && !isApproved && !isRejected && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleReject}
                className="btn-secondary border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
              >
                <XCircle className="w-5 h-5" strokeWidth={2} />
                Afvis
              </button>
              <button type="button" onClick={handleApprove} className="btn-primary">
                <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                Godkend pakke
              </button>
            </div>
          )}
        </footer>
      </aside>
    </>
  )
}
