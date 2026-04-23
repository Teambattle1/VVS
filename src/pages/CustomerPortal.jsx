import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Home,
  Building2,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  History,
} from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../contexts/JobsContext.jsx'
import { useOrg } from '../contexts/OrgContext.jsx'
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx'
import { notifyMontorCustomerAction } from '../lib/notifications.js'
import { useJobRealtime } from '../hooks/useRealtime.js'
import { jobTotal, roomTotal, packageTotal, formatDKK, toInclVat } from '../lib/pricing.js'
import { ROOM_TYPES } from '../lib/mockTemplates.js'
import BrandIcon from '../components/BrandIcon.jsx'
import FloorplanCanvas from '../components/FloorplanCanvas.jsx'
import LucideByName from '../components/LucideByName.jsx'
import CustomerPackageSheet from '../components/CustomerPackageSheet.jsx'
import SignOfferDialog from '../components/SignOfferDialog.jsx'

// Public route - ingen auth. OrgContext giver mock org til whitelabel-theme.
const FALLBACK_ORG = {
  name: 'VVS København ApS',
  primary_color: '#0EA5E9',
  accent_color: '#F59E0B',
  contact_email: 'kontakt@vvs-kbh.dk',
  contact_phone: '+45 70 20 30 40',
}

export default function CustomerPortal() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { getJobByShareToken, signOffer, rejectOffer } = useJobs()
  const { org } = useOrg()
  const { customer: loggedInCustomer } = useCustomerAuth()

  const displayOrg = org || FALLBACK_ORG

  const job = getJobByShareToken(token)

  // Supabase Realtime: scaffold - aktiveres naar VITE_SUPABASE_URL er sat
  useJobRealtime(job?.id, () => {
    // State kommer fra JobsContext som re-rendrer automatisk naar data aendrer
    // Naar Supabase er paa plads skal JobsContext refetche her.
  })

  const [activePackage, setActivePackage] = useState(null)
  const [customerName, setCustomerName] = useState(() => {
    return loggedInCustomer?.name || localStorage.getItem('vvs.customerName') || ''
  })
  const [signMode, setSignMode] = useState(null)

  useEffect(() => {
    if (customerName) localStorage.setItem('vvs.customerName', customerName)
  }, [customerName])

  const total = useMemo(() => (job ? jobTotal(job) : 0), [job])

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
        <div className="card p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" strokeWidth={2} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Linket er ikke gyldigt</h1>
          <p className="text-sm text-slate-600 mb-4">
            Tjek at du har kopieret hele linket fra din SMS eller email.
          </p>
          <Link to="/" className="btn-secondary">
            Til forside
          </Link>
        </div>
      </div>
    )
  }

  const isLocked = job.status === 'approved' || job.status === 'rejected'
  const isApproved = job.status === 'approved'
  const isRejected = job.status === 'rejected'
  const showIncl = job.vat_handling === 'incl' || job.vat_handling === 'both'
  const showExcl = job.vat_handling === 'excl' || job.vat_handling === 'both'

  const offerStatus = isApproved
    ? { label: 'Godkendt', color: 'bg-emerald-100 text-emerald-800' }
    : isRejected
    ? { label: 'Afvist', color: 'bg-rose-100 text-rose-800' }
    : { label: 'Afventer din godkendelse', color: 'bg-amber-100 text-amber-800' }

  const approvedCount = (job.rooms || []).reduce(
    (n, r) => n + (r.packages?.filter((p) => p.status === 'approved_by_customer').length || 0),
    0
  )
  const totalPackages = (job.rooms || []).reduce((n, r) => n + (r.packages?.length || 0), 0)

  function handleSignConfirm({ name, email, reason, signature }) {
    setCustomerName(name)
    if (signMode === 'approve') {
      signOffer(job.id, { customerName: name, customerEmail: email, signature })
    } else {
      rejectOffer(job.id, { customerName: name, customerEmail: email, reason })
    }
    // Notifér montøren (kræver edge function i produktion)
    notifyMontorCustomerAction({
      job,
      org: displayOrg,
      assignedEmail: displayOrg.contact_email,
      actorName: name,
      action: signMode === 'approve' ? 'sign_offer' : 'reject',
      message: signMode === 'reject' ? reason : null,
    })
    setSignMode(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-12">
      <header
        className="bg-white border-b border-slate-200 sticky top-0 z-20"
        style={{ borderTopColor: displayOrg.primary_color, borderTopWidth: 4 }}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <BrandIcon size={40} className="flex-shrink-0 text-slate-900" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 truncate">{displayOrg.name}</div>
            <div className="text-sm font-bold text-slate-900 truncate">
              Tilbud {job.job_number}
            </div>
          </div>
          <span className={clsx('chip', offerStatus.color)}>{offerStatus.label}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-5 space-y-5">
        <section className="card p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                {job.customer.customer_type === 'business' ? (
                  <Building2 className="w-5 h-5" strokeWidth={2} />
                ) : (
                  <UserIcon className="w-5 h-5" strokeWidth={2} />
                )}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{job.title}</h1>
                <div className="text-sm text-slate-600 mt-1">Til: {job.customer.name}</div>
                <div className="text-xs text-slate-500">{job.customer.address}</div>
              </div>
            </div>

            <div className="md:text-right">
              {showIncl && (
                <div className="text-3xl md:text-4xl font-extrabold text-slate-900">
                  {formatDKK(toInclVat(total))}
                </div>
              )}
              {showExcl && !showIncl && (
                <div className="text-3xl md:text-4xl font-extrabold text-slate-900">
                  {formatDKK(total)}
                </div>
              )}
              <div className="text-xs text-slate-500">
                {job.vat_handling === 'both'
                  ? `inkl. moms · ${formatDKK(total)} ekskl.`
                  : job.vat_handling === 'incl'
                  ? 'inkl. moms'
                  : 'ekskl. moms'}
              </div>
              {totalPackages > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  {approvedCount} af {totalPackages} pakker godkendt
                </div>
              )}
            </div>
          </div>
        </section>

        {job.rooms?.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-slate-600">Tilbuddet er ved at blive klargjort.</p>
          </div>
        ) : (
          <section className="space-y-6">
            {job.rooms.map((room) => (
              <RoomSection
                key={room.id}
                job={job}
                room={room}
                onPackageClick={(pkg) => setActivePackage({ room, pkg })}
                readOnly={isLocked}
              />
            ))}
          </section>
        )}

        <section className="card p-5 bg-gradient-to-br from-sky-50 to-white">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-sky-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <h3 className="font-bold text-slate-900">Sådan fungerer tilvalg</h3>
              <p className="text-sm text-slate-600 mt-1">
                Tryk på en pakke for at se detaljer. Du kan fravælge enkelte varer, skrive en
                kommentar, eller godkende pakken. Den samlede pris opdateres automatisk.
              </p>
            </div>
          </div>
        </section>

        <section className="card p-5 bg-gradient-to-br from-white to-sky-50">
          <div className="flex items-start gap-3">
            {loggedInCustomer ? (
              <>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <History className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">Logget ind som {loggedInCustomer.name}</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Se alle dine tilbud samlet ét sted.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/kunde')}
                    className="btn-secondary"
                  >
                    <History className="w-4 h-4 text-slate-700" strokeWidth={2} />
                    Se mine tilbud
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">Opret konto for historik</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Få adgang til alle dine tilbud samlet ét sted — valgfrit.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/kunde/login', {
                          state: { mode: 'signup', email: job.customer.email, from: `/k/${token}` },
                        })
                      }
                      className="btn-primary"
                    >
                      Opret konto
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/kunde/login', { state: { from: `/k/${token}` } })}
                      className="btn-secondary"
                    >
                      Log ind
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-slate-500" strokeWidth={2} />
            <h3 className="font-bold text-slate-900">Kontakt</h3>
          </div>
          <div className="text-sm text-slate-700 space-y-1">
            <div>{displayOrg.name}</div>
            {displayOrg.contact_phone && <div>Tlf: {displayOrg.contact_phone}</div>}
            {displayOrg.contact_email && <div>Email: {displayOrg.contact_email}</div>}
          </div>
        </section>
      </main>

      {!isLocked && (
        <footer className="fixed inset-x-0 bottom-0 z-30 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Samlet tilbud
              </div>
              <div className="text-lg md:text-xl font-extrabold text-slate-900">
                {showIncl ? formatDKK(toInclVat(total)) : formatDKK(total)}
                <span className="text-xs font-semibold text-slate-500 ml-1.5">
                  {showIncl ? 'inkl. moms' : 'ekskl. moms'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:flex gap-2">
              <button
                type="button"
                onClick={() => setSignMode('reject')}
                className="btn-secondary"
              >
                <XCircle className="w-5 h-5 text-slate-700" strokeWidth={2} />
                Afvis
              </button>
              <button
                type="button"
                onClick={() => setSignMode('approve')}
                className="btn-primary"
              >
                <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.25} />
                Godkend tilbud
              </button>
            </div>
          </div>
        </footer>
      )}

      {isApproved && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-emerald-50 border-t border-emerald-200">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" strokeWidth={2} />
            <div className="flex-1">
              <div className="text-sm font-bold text-emerald-900">Tilbuddet er godkendt</div>
              {job.signed_by && (
                <div className="text-xs text-emerald-700">Underskrevet af {job.signed_by}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-rose-50 border-t border-rose-200">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" strokeWidth={2} />
            <div className="flex-1 text-sm font-bold text-rose-900">
              Du har afvist dette tilbud
            </div>
          </div>
        </div>
      )}

      {activePackage && (
        <CustomerPackageSheet
          job={job}
          room={activePackage.room}
          pkg={activePackage.pkg}
          customerName={customerName || 'Kunde'}
          readOnly={isLocked}
          onClose={() => setActivePackage(null)}
        />
      )}

      {signMode && (
        <SignOfferDialog
          total={total}
          vatHandling={job.vat_handling}
          orgName={displayOrg.name}
          mode={signMode}
          onClose={() => setSignMode(null)}
          onConfirm={handleSignConfirm}
        />
      )}
    </div>
  )
}

function RoomSection({ job, room, onPackageClick, readOnly }) {
  const [selectedId, setSelectedId] = useState(null)
  const roomTypeLabel = ROOM_TYPES.find((t) => t.value === room.room_type)?.label || room.room_type
  const total = roomTotal(room)
  const showIncl = job.vat_handling === 'incl' || job.vat_handling === 'both'

  return (
    <article className="card p-5">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{room.name}</h2>
            <div className="text-xs text-slate-500">
              {roomTypeLabel} · {room.width_cm} × {room.length_cm} cm · {room.packages?.length || 0} pakker
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-slate-900">
            {showIncl ? formatDKK(toInclVat(total)) : formatDKK(total)}
          </div>
          <div className="text-xs text-slate-500">
            {showIncl ? 'inkl. moms' : 'ekskl. moms'}
          </div>
        </div>
      </header>

      {room.packages?.length > 0 && (
        <div className="mb-4">
          <FloorplanCanvas
            room={room}
            readOnly
            selectedPackageId={selectedId}
            onSelectPackage={(id) => {
              setSelectedId(id)
              const pkg = room.packages.find((p) => p.id === id)
              if (pkg) onPackageClick(pkg)
            }}
          />
        </div>
      )}

      {room.packages?.length > 0 ? (
        <ul className="space-y-2">
          {room.packages.map((pkg) => (
            <CustomerPackageRow
              key={pkg.id}
              pkg={pkg}
              vatHandling={job.vat_handling}
              onClick={() => onPackageClick(pkg)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 italic">Ingen pakker i dette rum.</p>
      )}
    </article>
  )
}

function CustomerPackageRow({ pkg, vatHandling, onClick }) {
  const total = packageTotal(pkg)
  const showIncl = vatHandling === 'incl' || vatHandling === 'both'
  const isApproved = pkg.status === 'approved_by_customer'
  const isRejected = pkg.status === 'rejected_by_customer'
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'w-full text-left rounded-2xl border-2 px-3 py-3 flex items-center gap-3 transition-colors',
          isApproved
            ? 'border-emerald-400 bg-emerald-50/50'
            : isRejected
            ? 'border-rose-400 bg-rose-50/50'
            : 'border-slate-200 bg-white hover:border-sky-300'
        )}
      >
        <div
          className={clsx(
            'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
            isApproved
              ? 'bg-emerald-100 text-emerald-700'
              : isRejected
              ? 'bg-rose-100 text-rose-700'
              : 'bg-sky-50 text-sky-600'
          )}
        >
          <LucideByName name={pkg.lucide_icon} className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">{pkg.name}</div>
          <div className="text-xs text-slate-500">
            {pkg.items?.length || 0} varer
            {pkg.timeline_text ? ` · ${pkg.timeline_text}` : ''}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-slate-900">
            {showIncl ? formatDKK(toInclVat(total)) : formatDKK(total)}
          </div>
          <div className="flex items-center gap-1 justify-end text-xs">
            {isApproved && (
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                Godkendt
              </span>
            )}
            {isRejected && (
              <span className="text-rose-700 font-semibold flex items-center gap-0.5">
                <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                Afvist
              </span>
            )}
            {!isApproved && !isRejected && (
              <span className="text-slate-500">Se detaljer</span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}
