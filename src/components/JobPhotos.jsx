import { useMemo, useState } from 'react'
import { Camera, ImageOff } from 'lucide-react'
import PhotoLightbox from './PhotoLightbox.jsx'

// Samler alle fotos paa tvaers af rum/pakker i et job
// og viser dem som en thumbnail-strip. Klik aabner lightbox.
export default function JobPhotos({ job }) {
  const [startIdx, setStartIdx] = useState(null)

  const photos = useMemo(() => {
    const out = []
    ;(job.rooms || []).forEach((room) => {
      ;(room.packages || []).forEach((pkg) => {
        ;(pkg.photos || []).forEach((p) => {
          out.push({
            ...p,
            caption: `${room.name} · ${pkg.name}`,
            room_id: room.id,
            package_id: pkg.id,
          })
        })
      })
    })
    return out
  }, [job])

  return (
    <section className="card p-5">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-500" strokeWidth={2} />
          Foto-dokumentation
          {photos.length > 0 && (
            <span className="chip bg-slate-100 text-slate-700 text-[10px]">{photos.length}</span>
          )}
        </h3>
      </header>

      {photos.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 italic py-3">
          <ImageOff className="w-4 h-4" strokeWidth={2} />
          Ingen billeder taget endnu — tilføj fra pakke-detaljerne på hvert rum.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id || i}
              type="button"
              onClick={() => setStartIdx(i)}
              className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:shadow-md transition-all relative group"
              title={p.caption}
            >
              <img src={p.url} alt={p.caption || 'Foto'} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] font-semibold text-white line-clamp-2 leading-tight">
                  {p.caption}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {startIdx !== null && (
        <PhotoLightbox
          photos={photos}
          startIndex={startIdx}
          onClose={() => setStartIdx(null)}
        />
      )}
    </section>
  )
}
