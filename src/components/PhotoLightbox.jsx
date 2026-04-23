import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PhotoLightbox({ photos, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % photos.length)
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length, onClose])

  if (!photos || photos.length === 0) return null
  const current = photos[idx]

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <header className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-semibold">
          {current?.caption || `Foto ${idx + 1}`}
          <span className="text-xs text-slate-300 ml-2">
            {idx + 1} / {photos.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
          aria-label="Luk"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>

      <div
        className="flex-1 flex items-center justify-center p-2 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 md:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Forrige"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          </button>
        )}
        <img
          src={current.url}
          alt={current.caption || 'Foto'}
          className="max-w-full max-h-full object-contain rounded-xl"
        />
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-2 md:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Næste"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={2} />
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <div
          className="px-4 py-3 overflow-x-auto flex gap-2 justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, i) => (
            <button
              key={p.id || i}
              type="button"
              onClick={() => setIdx(i)}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                i === idx ? 'border-white scale-110' : 'border-white/30 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
