import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Settings2 } from 'lucide-react'
import { useJobs } from '../contexts/JobsContext.jsx'
import { roomTotal } from '../lib/pricing.js'
import FloorplanCanvas from '../components/FloorplanCanvas.jsx'
import PackagePicker from '../components/PackagePicker.jsx'
import PackageDetail from '../components/PackageDetail.jsx'
import PriceSummary from '../components/PriceSummary.jsx'
import LucideByName from '../components/LucideByName.jsx'

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
  } = useJobs()

  const [placing, setPlacing] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState(null)
  const [pendingTemplate, setPendingTemplate] = useState(null)

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

  function startPlacing() {
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
          <div className="card p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <Settings2 className="w-4 h-4 text-slate-400" strokeWidth={2} />
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

          <FloorplanCanvas
            room={room}
            placing={placing}
            selectedPackageId={selectedPackageId}
            onPlace={handlePlacedAt}
            onSelectPackage={setSelectedPackageId}
            onMovePackage={handleMove}
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
