import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  User as UserIcon,
  Building2,
  MapPin,
  Send,
  Share2,
  Trash2,
  Home,
  FileDown,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../contexts/JobsContext.jsx'
import { useOrg } from '../contexts/OrgContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import { notifyCustomerOfferSent } from '../lib/notifications.js'
import { useJobRealtime } from '../hooks/useRealtime.js'
import { STATUS_LABELS } from '../lib/mockJobs.js'
import { ROOM_TYPES } from '../lib/mockTemplates.js'
import { jobTotal, roomTotal } from '../lib/pricing.js'
import PriceSummary from '../components/PriceSummary.jsx'
import VatToggle from '../components/VatToggle.jsx'
import AddRoomDialog from '../components/AddRoomDialog.jsx'
import ActivityFeed from '../components/ActivityFeed.jsx'
import MapThumb from '../components/MapThumb.jsx'
import ShareDialog from '../components/ShareDialog.jsx'

export default function JobDetail() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { getJob, updateJob, addRoom, deleteRoom } = useJobs()
  const { org } = useOrg()
  const toast = useToast()
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Supabase Realtime scaffold - lyt paa kunde-handlinger
  useJobRealtime(jobId, () => {
    // State synkes via JobsContext. Naar rigtig Supabase forbindes skal JobsContext refetche.
  })

  const job = getJob(jobId)
  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-slate-600 mb-3">Sagen findes ikke.</p>
          <Link to="/" className="btn-primary">Tilbage til oversigt</Link>
        </div>
      </div>
    )
  }

  const status = STATUS_LABELS[job.status] || STATUS_LABELS.draft
  const total = jobTotal(job)

  function handleCreateRoom(data) {
    const room = addRoom(job.id, data)
    setShowAddRoom(false)
    navigate(`/jobs/${job.id}/rooms/${room.id}`)
  }

  function handleShare() {
    // Marker som sendt hvis stadig i draft
    if (job.status === 'draft') {
      updateJob(job.id, { status: 'sent' })
    }
    setShowShare(true)
  }

  function handlePreview() {
    const url = `${window.location.origin}/k/${job.share_token || job.id}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleDownloadPDF() {
    setExporting(true)
    try {
      // Lazy-load PDF-generatoren først ved klik (sparer ~1MB fra initial bundle)
      const { downloadOfferPDF } = await import('../components/OfferPDF.jsx')
      await downloadOfferPDF(job, org)
      toast.success('PDF downloadet')
    } catch (err) {
      toast.error('Kunne ikke generere PDF: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-slate-50">
      <header className={clsx('sticky top-0 z-30 bg-white border-b-2', status.border)}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Tilbage"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">{job.job_number}</span>
              <span className={clsx('chip', status.color)}>{status.label}</span>
            </div>
            <h1 className="text-sm md:text-base font-bold text-slate-900 truncate">{job.title}</h1>
          </div>
          <button
            type="button"
            onClick={handlePreview}
            className="hidden lg:inline-flex btn-secondary"
            title="Se som kunde ser det"
          >
            <Eye className="w-5 h-5 text-slate-700" strokeWidth={2} />
            Preview
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="hidden lg:inline-flex btn-secondary"
          >
            <FileDown className="w-5 h-5 text-slate-700" strokeWidth={2} />
            {exporting ? 'Genererer…' : 'PDF'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="hidden lg:inline-flex btn-secondary"
          >
            <Share2 className="w-5 h-5 text-slate-700" strokeWidth={2} />
            Del med kunde
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-5 space-y-5">
        <section className="card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                {job.customer.customer_type === 'business' ? (
                  <Building2 className="w-5 h-5" strokeWidth={2} />
                ) : (
                  <UserIcon className="w-5 h-5" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                  {job.customer.customer_type === 'business' ? 'Erhvervskunde' : 'Privatkunde'}
                </div>
                <div className="text-base font-bold text-slate-900 truncate">{job.customer.name}</div>
                <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
                  <span className="truncate">{job.customer.address}</span>
                </div>
              </div>
            </div>
            <MapThumb
              lat={job.customer.lat}
              lon={job.customer.lon}
              address={job.customer.address}
            />
            <PriceSummary excl={total} vatHandling={job.vat_handling} size="lg" label="Job i alt" />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Vis priser:</span>
            <VatToggle
              value={job.vat_handling}
              onChange={(v) => updateJob(job.id, { vat_handling: v })}
              size="sm"
            />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 mb-2">Status (sæt manuelt):</div>
            <div className="flex flex-wrap gap-2">
              <StatusChip
                active={job.status === 'draft'}
                onClick={() => updateJob(job.id, { status: 'draft' })}
                icon={FileText}
                label="Kladde"
                activeCls="bg-rose-500 text-white border-rose-500"
              />
              <StatusChip
                active={job.status === 'sent'}
                onClick={() => updateJob(job.id, { status: 'sent' })}
                icon={Send}
                label="Sendt"
                activeCls="bg-amber-500 text-white border-amber-500"
              />
              <StatusChip
                active={job.status === 'approved'}
                onClick={() => updateJob(job.id, { status: 'approved' })}
                icon={CheckCircle2}
                label="Godkendt"
                activeCls="bg-emerald-500 text-white border-emerald-500"
              />
              <StatusChip
                active={job.status === 'rejected'}
                onClick={() => updateJob(job.id, { status: 'rejected' })}
                icon={XCircle}
                label="Afvist"
                activeCls="bg-sky-500 text-white border-sky-500"
              />
              <StatusChip
                active={job.status === 'in_progress'}
                onClick={() => updateJob(job.id, { status: 'in_progress' })}
                icon={Clock}
                label="I gang"
                activeCls="bg-indigo-500 text-white border-indigo-500"
              />
              <StatusChip
                active={job.status === 'done'}
                onClick={() => updateJob(job.id, { status: 'done' })}
                icon={CheckCircle2}
                label="Færdig"
                activeCls="bg-slate-700 text-white border-slate-700"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900">Rum ({job.rooms?.length || 0})</h2>
            <button
              type="button"
              onClick={() => setShowAddRoom(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
              Tilføj rum
            </button>
          </div>

          {job.rooms?.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Home className="w-6 h-6" strokeWidth={2} />
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Tilføj det første rum for at begynde at placere pakker.
              </p>
              <button
                type="button"
                onClick={() => setShowAddRoom(true)}
                className="btn-primary mx-auto"
              >
                <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
                Tilføj rum
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {job.rooms.map((room) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  jobId={job.id}
                  vatHandling={job.vat_handling}
                  onDelete={() => {
                    if (confirm(`Slet rum "${room.name}"?`)) deleteRoom(job.id, room.id)
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="grid grid-cols-3 lg:hidden gap-2 pt-2">
          <button type="button" onClick={handlePreview} className="btn-secondary">
            <Eye className="w-5 h-5 text-slate-700" strokeWidth={2} />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button type="button" onClick={handleDownloadPDF} disabled={exporting} className="btn-secondary">
            <FileDown className="w-5 h-5 text-slate-700" strokeWidth={2} />
            <span className="hidden sm:inline">{exporting ? 'Genererer…' : 'PDF'}</span>
          </button>
          <button type="button" onClick={handleShare} className="btn-accent">
            <Share2 className="w-5 h-5 text-white" strokeWidth={2.25} />
            <span className="hidden sm:inline">Del med kunde</span>
          </button>
          {job.status === 'draft' && (
            <button
              type="button"
              onClick={() => updateJob(job.id, { status: 'sent' })}
              className="btn-primary flex-1"
            >
              <Send className="w-5 h-5 text-white" strokeWidth={2.25} />
              Marker som sendt
            </button>
          )}
        </section>

        <section>
          <ActivityFeed actions={job.actions || []} />
        </section>
      </main>

      {showAddRoom && (
        <AddRoomDialog
          onClose={() => setShowAddRoom(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {showShare && (
        <ShareDialog
          url={`${window.location.origin}/k/${job.share_token || job.id}`}
          customerPhone={job.customer.phone}
          customerName={job.customer.name}
          jobNumber={job.job_number}
          orgName={org?.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}

function StatusChip({ active, onClick, icon: Icon, label, activeCls }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition',
        active
          ? activeCls
          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
      )}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
      {label}
    </button>
  )
}

function RoomRow({ room, jobId, vatHandling, onDelete }) {
  const roomTypeLabel = ROOM_TYPES.find((t) => t.value === room.room_type)?.label || room.room_type
  const total = roomTotal(room)
  return (
    <li className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <Link
        to={`/jobs/${jobId}/rooms/${room.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
          <Home className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">{room.name}</div>
          <div className="text-xs text-slate-500">
            {roomTypeLabel} · {room.width_cm} × {room.length_cm} cm · {room.packages?.length || 0} pakker
          </div>
        </div>
        <PriceSummary excl={total} vatHandling={vatHandling} label="" />
        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" strokeWidth={2} />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        className="w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center justify-center flex-shrink-0"
        aria-label="Slet rum"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>
    </li>
  )
}
