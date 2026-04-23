import { useState } from 'react'
import { X, ExternalLink, MapPin, Maximize2 } from 'lucide-react'
import clsx from 'clsx'

// OpenStreetMap embed - gratis, ingen API-noegle
function bboxAround(lat, lon, delta = 0.004) {
  return `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
}

function osmEmbedUrl(lat, lon, delta) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bboxAround(lat, lon, delta)}&layer=mapnik&marker=${lat},${lon}`
}

function osmExternalUrl(lat, lon) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
}

export default function MapThumb({ lat, lon, address, size = 'md' }) {
  const [full, setFull] = useState(false)

  if (!lat || !lon) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400',
          size === 'sm' ? 'w-16 h-16' : 'w-32 h-24 md:w-40 md:h-28'
        )}
        title="Intet kort — adresse mangler koordinater"
      >
        <MapPin className="w-6 h-6" strokeWidth={2} />
      </div>
    )
  }

  const dims =
    size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-48 h-32' : 'w-32 h-24 md:w-40 md:h-28'

  return (
    <>
      <button
        type="button"
        onClick={() => setFull(true)}
        className={clsx(
          'relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm hover:shadow-md transition-shadow group flex-shrink-0',
          dims
        )}
        title="Klik for at se i fuld størrelse"
      >
        <iframe
          title={`Kort for ${address || 'adresse'}`}
          src={osmEmbedUrl(lat, lon, 0.003)}
          className="pointer-events-none w-full h-full"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors" />
        <div className="absolute bottom-1.5 right-1.5 bg-white/90 backdrop-blur rounded-lg px-1.5 py-1 flex items-center gap-0.5 text-[10px] font-semibold text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-3 h-3" strokeWidth={2.5} />
          Forstør
        </div>
      </button>

      {full && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          onClick={() => setFull(false)}
          role="dialog"
        >
          <div
            className="relative w-full max-w-4xl h-[70vh] md:h-[80vh] bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
              <MapPin className="w-5 h-5 text-sky-500" strokeWidth={2} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{address}</div>
                <div className="text-xs text-slate-500">
                  {lat.toFixed(5)}, {lon.toFixed(5)}
                </div>
              </div>
              <a
                href={osmExternalUrl(lat, lon)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4 text-slate-700" strokeWidth={2} />
                Åbn i OSM
              </a>
              <button
                type="button"
                onClick={() => setFull(false)}
                className="w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                aria-label="Luk"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </header>
            <iframe
              title={`Stort kort for ${address || 'adresse'}`}
              src={osmEmbedUrl(lat, lon, 0.012)}
              className="w-full h-full flex-1"
            />
          </div>
        </div>
      )}
    </>
  )
}
