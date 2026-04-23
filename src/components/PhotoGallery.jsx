import { useRef } from 'react'
import { Camera, X, ImagePlus } from 'lucide-react'
import clsx from 'clsx'

export default function PhotoGallery({ photos = [], onAdd, onRemove, readOnly = false, maxCount = 6 }) {
  const fileRef = useRef(null)

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
        {photos.map((p) => (
          <div
            key={p.id}
            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group"
          >
            <img src={p.url} alt={p.name || 'Foto'} className="w-full h-full object-cover" />
            {!readOnly && (
              <button
                type="button"
                onClick={() => onRemove?.(p.id)}
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
    </div>
  )
}
