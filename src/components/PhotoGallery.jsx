import { useRef, useState, useEffect } from 'react'
import { Camera, X, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

export default function PhotoGallery({ photos = [], onAdd, onRemove, readOnly = false, maxCount = 6 }) {
  const fileRef = useRef(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      if (photos.length >= maxCount) return
      const reader = new FileReader()
      reader.onload = () => onAdd?.({ id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, url: reader.result, name: file.name })
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  return (
    <div>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((p, idx) => (
          <div
            key={p.id}
            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="w-full h-full block"
              aria-label="Vis foto i stor størrelse"
            >
              <img src={p.url} alt={p.name || 'Foto'} className="w-full h-full object-cover" />
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove?.(p.id)
                }}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Fjern foto"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}

        {!readOnly && photos.length < maxCount && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={clsx(
                'aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50',
                'flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/40 transition-colors'
              )}
            >
              <Camera className="w-6 h-6" strokeWidth={2} />
              <span className="text-[11px] font-semibold">Tilføj</span>
            </button>
          </>
        )}
      </div>
      {!readOnly && photos.length === 0 && (
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          <ImagePlus className="w-3.5 h-3.5" strokeWidth={2} />
          Tag et billede med kameraet eller vælg fra galleri.
        </p>
      )}

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}

function Lightbox({ photos, index, onChange, onClose }) {
  const photo = photos[index]
  const prev = () => onChange((index - 1 + photos.length) % photos.length)
  const next = () => onChange((index + 1) % photos.length)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, photos.length])

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
        aria-label="Luk"
      >
        <X className="w-6 h-6" strokeWidth={2} />
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Forrige"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Næste"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={2} />
          </button>
        </>
      )}

      <img
        src={photo.url}
        alt={photo.name || 'Foto'}
        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  )
}
