import { useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Square,
  Upload,
  LayoutTemplate,
  Undo2,
  X,
  ImagePlus,
} from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../contexts/JobsContext.jsx'
import { roomTotal } from '../lib/pricing.js'
import FloorplanCanvas from '../components/FloorplanCanvas.jsx'
import PackagePicker from '../components/PackagePicker.jsx'
import PackageDetail from '../components/PackageDetail.jsx'
import PriceSummary from '../components/PriceSummary.jsx'
import LucideByName from '../components/LucideByName.jsx'

const MODES = [
  { value: 'rectangle', label: 'Rektangel', icon: Square },
  { value: 'freehand',  label: 'Fri tegning', icon: Pencil },
  { value: 'upload',    label: 'Billede', icon: Upload },
  { value: 'template',  label: 'Skabelon', icon: LayoutTemplate },
]

export default function RoomEditor() {
  const { jobId, roomId } = useParams()
  const navigate = useNavigate()
  const {
    getJob,
    getRoom,
    addPackage,
    updatePackage,
    updateRoom,
    deleteRoom,
    addDrawingLine,
    clearDrawing,
    undoDrawing,
  } = useJobs()

  const [placing, setPlacing] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState(null)
  const [pendingTemplate, setPendingTemplate] = useState(null)
  const fileInputRef = useRef(null)

  const job = getJob(jobId)
  const room = getRoom(jobId, roomId)

  if (!job || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-slate-600 mb-3">Rummet findes ikke.</p>
          <Link to={job ? `/jobs/${job.id}` : '/'} className="btn-primary">Tilbage</Link>
        </div>
      </div>
    )
  }

  const total = roomTotal(room)
  const selectedPackage = room.packages?.find((p) => p.id === selectedPackageId) || null
  const isFreehand = room.floorplan_mode === 'freehand'
  const isUpload = room.floorplan_mode === 'upload'
  const hasDrawing = (room.floorplan_data?.lines?.length || 0) > 0

  function startPlacing() {
    setDrawing(false)
    setShowPicker(true)
  }

  function handleTemplatePicked(template) {
    setPendingTemplate(template)
    setShowPicker(false)
    setPlacing(true)
  }

  function handlePlacedAt(position) {
    if (!pendingTemplate) return
    const pkg = addPackage(job.id, room.id, pendingTemplate, position)
    setPendingTemplate(null)
    setPlacing(false)
    setSelectedPackageId(pkg.id)
  }

  function handleMove(pkgId, position) {
    updatePackage(job.id, room.id, pkgId, {
      position_x: position.x,
      position_y: position.y,
    })
  }

  function handleDeleteRoom() {
    if (!confirm(`Slet rummet "${room.name}" og alle dets pakker?`)) return
    deleteRoom(job.id, room.id)
    navigate(`/jobs/${job.id}`, { replace: true })
  }

  function handleModeChange(nextMode) {
    updateRoom(job.id, room.id, { floorplan_mode: nextMode })
    setDrawing(false)
    setPlacing(false)
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateRoom(job.id, room.id, { floorplan_image_url: reader.result })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleRemoveImage() {
    if (!confirm('Fjern billede-baggrunden?')) return
    updateRoom(job.id, room.id, { floorplan_image_url: null })
  }

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Tilbage"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 truncate">
              {job.job_number} · {job.customer.name}
            </div>
            <input
              type="text"
              className="text-base md:text-lg font-bold text-slate-900 bg-transparent outline-none focus:bg-slate-50 rounded-lg px-1 -ml-1 w-full"
              value={room.name}
              onChange={(e) => updateRoom(job.id, room.id, { name: e.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={handleDeleteRoom}
            className="w-10 h-10 rounded-2xl text-rose-500 hover:bg-rose-50 flex items-center justify-center flex-shrink-0"
            aria-label="Slet rum"
          >
            <Trash2 className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-6 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <div className="card p-3 md:p-4 space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
              {MODES.map((m) => {
                const Icon = m.icon
                const active = room.floorplan_mode === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => handleModeChange(m.value)}
                    className={clsx(
                      'flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold whitespace-nowrap border-2 transition-colors',
                      active
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                    {m.label}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Bredde</span>
                <input
                  type="number"
                  min="50"
                  className="w-20 rounded-xl border border-slate-200 px-2 py-1 text-sm text-center"
                  value={room.width_cm}
                  onChange={(e) =>
                    updateRoom(job.id, room.id, { width_cm: Number(e.target.value) || 100 })
                  }
                />
                <span className="text-slate-600">×</span>
                <input
                  type="number"
                  min="50"
                  className="w-20 rounded-xl border border-slate-200 px-2 py-1 text-sm text-center"
                  value={room.length_cm}
                  onChange={(e) =>
                    updateRoom(job.id, room.id, { length_cm: Number(e.target.value) || 100 })
                  }
                />
                <span className="text-slate-500 text-xs">cm</span>
              </div>

              <button
                type="button"
                onClick={startPlacing}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
                Placer pakke
              </button>
            </div>

            {isFreehand && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setDrawing((d) => !d)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold border-2 min-h-[40px]',
                    drawing
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-sky-500 bg-white text-sky-700 hover:bg-sky-50'
                  )}
                >
                  <Pencil className="w-4 h-4" strokeWidth={2} />
                  {drawing ? 'Stop tegning' : 'Start tegning'}
                </button>
                <button
                  type="button"
                  onClick={() => undoDrawing(job.id, room.id)}
                  disabled={!hasDrawing}
                  className="btn-secondary disabled:opacity-40"
                >
                  <Undo2 className="w-4 h-4 text-slate-700" strokeWidth={2} />
                  Fortryd
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasDrawing) return
                    if (confirm('Slet alle tegnede streger?')) clearDrawing(job.id, room.id)
                  }}
                  disabled={!hasDrawing}
                  className="text-sm text-rose-600 hover:text-rose-700 font-semibold disabled:opacity-40 inline-flex items-center gap-1 px-2"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                  Ryd
                </button>
              </div>
            )}

            {isUpload && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  <ImagePlus className="w-4 h-4 text-slate-700" strokeWidth={2} />
                  {room.floorplan_image_url ? 'Skift billede' : 'Vælg billede'}
                </button>
                {room.floorplan_image_url && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-sm text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 px-2"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                    Fjern
                  </button>
                )}
                <span className="text-xs text-slate-500 ml-auto">
                  Tip: Du kan tage billede direkte med kameraet.
                </span>
              </div>
            )}
          </div>

          <FloorplanCanvas
            room={room}
            placing={placing}
            drawing={drawing}
            selectedPackageId={selectedPackageId}
            onPlace={handlePlacedAt}
            onSelectPackage={setSelectedPackageId}
            onMovePackage={handleMove}
            onAddLine={(points) => addDrawingLine(job.id, room.id, points)}
          />

          {placing && (
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3 text-sm text-sky-900">
              <span>Tryk på grundplanen for at placere <strong>{pendingTemplate?.name}</strong>.</span>
              <button
                type="button"
                onClick={() => {
                  setPlacing(false)
                  setPendingTemplate(null)
                }}
                className="text-sky-700 font-semibold hover:underline"
              >
                Annuller
              </button>
            </div>
          )}

          {drawing && (
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3 text-sm text-sky-900">
              <span>Tegn rummets omrids eller detaljer. Tryk &quot;Stop tegning&quot; når du er færdig.</span>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <PriceSummary excl={total} vatHandling={job.vat_handling} label="Rum i alt" size="lg" />
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Pakker ({room.packages?.length || 0})
              </h3>
              <button
                type="button"
                onClick={startPlacing}
                className="text-sm font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Tilføj
              </button>
            </div>

            {room.packages?.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Ingen pakker i dette rum endnu.</p>
            ) : (
              <ul className="space-y-2">
                {room.packages.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPackageId(p.id)}
                      className={`w-full text-left rounded-2xl border px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
                        p.id === selectedPackageId
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                        <LucideByName name={p.lucide_icon} className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {p.items?.length || 0} varer
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>

      {showPicker && (
        <PackagePicker
          roomType={room.room_type}
          onClose={() => setShowPicker(false)}
          onSelect={handleTemplatePicked}
        />
      )}

      {selectedPackage && (
        <PackageDetail
          jobId={job.id}
          roomId={room.id}
          pkg={selectedPackage}
          onClose={() => setSelectedPackageId(null)}
        />
      )}
    </div>
  )
}
