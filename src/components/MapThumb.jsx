import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { X, ExternalLink, MapPin, Maximize2, Plus as PlusIcon, Minus, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import 'leaflet/dist/leaflet.css'

// Custom marker uden behov for eksterne billeder (undgaar bundler-fejl)
function customPin(color = '#0EA5E9') {
  return L.divIcon({
    className: 'vvs-map-pin',
    html: `
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity="0.3"/>
        </filter>
        <path filter="url(#s)" d="M16 0C7.2 0 0 7.2 0 16c0 11.2 16 24 16 24s16-12.8 16-24c0-8.8-7.2-16-16-16z" fill="${color}"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  })
}

function ZoomBadge() {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  useMapEvents({
    zoom: () => setZoom(map.getZoom()),
    zoomend: () => setZoom(map.getZoom()),
  })
  return (
    <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/85 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none">
      Zoom {zoom}
    </div>
  )
}

function CustomZoomControl() {
  const map = useMap()
  return (
    <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          map.zoomIn()
        }}
        className="w-9 h-9 bg-white hover:bg-slate-50 rounded-xl shadow-md flex items-center justify-center text-slate-700 border border-slate-200"
        aria-label="Zoom ind"
      >
        <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          map.zoomOut()
        }}
        className="w-9 h-9 bg-white hover:bg-slate-50 rounded-xl shadow-md flex items-center justify-center text-slate-700 border border-slate-200"
        aria-label="Zoom ud"
      >
        <Minus className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}

// Geocode-cache pr. adresse saa vi ikke fetcher igen for samme string
const GEO_CACHE = new Map()

async function geocodeAddress(address) {
  if (!address) return null
  if (GEO_CACHE.has(address)) return GEO_CACHE.get(address)
  try {
    const res = await fetch(
      `https://api.dataforsyningen.dk/autocomplete?type=adresse&q=${encodeURIComponent(address)}&per_side=1&fuzzy&srid=4326`
    )
    if (!res.ok) return null
    const data = await res.json()
    const hit = data?.[0]?.adresse || data?.[0]?.data
    if (hit?.x && hit?.y) {
      const coords = { lat: Number(hit.y), lon: Number(hit.x) }
      GEO_CACHE.set(address, coords)
      return coords
    }
  } catch {
    /* ignore */
  }
  GEO_CACHE.set(address, null)
  return null
}

export default function MapThumb({ lat, lon, address, size = 'md' }) {
  const [full, setFull] = useState(false)
  const [resolvedCoords, setResolvedCoords] = useState(null)
  const [geocoding, setGeocoding] = useState(false)

  // Geocode adressen hvis vi ikke har lat/lon men har en adresse
  useEffect(() => {
    if (lat && lon) {
      setResolvedCoords(null)
      return
    }
    if (!address || address.trim().length < 5) return
    setGeocoding(true)
    let cancelled = false
    geocodeAddress(address).then((c) => {
      if (!cancelled) {
        setResolvedCoords(c)
        setGeocoding(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [lat, lon, address])

  const finalLat = lat || resolvedCoords?.lat
  const finalLon = lon || resolvedCoords?.lon

  if (!finalLat || !finalLon) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400',
          size === 'sm' ? 'w-16 h-16' : 'w-32 h-24 md:w-40 md:h-28'
        )}
        title={geocoding ? 'Finder adressen…' : 'Intet kort — adresse ikke fundet'}
      >
        {geocoding ? (
          <Loader2 className="w-6 h-6 animate-spin" strokeWidth={2} />
        ) : (
          <MapPin className="w-6 h-6" strokeWidth={2} />
        )}
      </div>
    )
  }

  const dims =
    size === 'sm' ? 'w-24 h-24' : size === 'lg' ? 'w-56 h-40' : 'w-40 h-28 md:w-48 md:h-32'

  const thumbZoom = 16

  return (
    <>
      <button
        type="button"
        onClick={() => setFull(true)}
        className={clsx(
          'relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm hover:shadow-md transition-shadow group flex-shrink-0',
          dims
        )}
        title="Klik for at forstørre"
      >
        <div className="absolute inset-0 pointer-events-none">
          <MapContainer
            center={[finalLat, finalLon]}
            zoom={thumbZoom}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            touchZoom={false}
            keyboard={false}
            style={{ width: '100%', height: '100%', background: '#e2e8f0' }}
          >
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[finalLat, finalLon]} icon={customPin('#E11D48')} />
          </MapContainer>
        </div>
        <div className="absolute bottom-1.5 left-1.5 bg-slate-900/85 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none z-[500]">
          Zoom {thumbZoom}
        </div>
        <div className="absolute top-1.5 right-1.5 bg-white/95 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-[500] pointer-events-none">
          <Maximize2 className="w-3.5 h-3.5 text-slate-700" strokeWidth={2.5} />
        </div>
      </button>

      {full && <FullMap lat={finalLat} lon={finalLon} address={address} onClose={() => setFull(false)} />}
    </>
  )
}

function FullMap({ lat, lon, address, onClose }) {
  const osmExternalUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="relative w-full max-w-5xl h-[75vh] md:h-[85vh] bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
          <MapPin className="w-5 h-5 text-rose-500" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">{address}</div>
            <div className="text-xs text-slate-500">
              {Number(lat).toFixed(5)}, {Number(lon).toFixed(5)}
            </div>
          </div>
          <a
            href={osmExternalUrl}
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
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="relative flex-1">
          <MapContainer
            center={[lat, lon]}
            zoom={18}
            zoomControl={false}
            attributionControl={true}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
              maxZoom={19}
            />
            <Marker position={[lat, lon]} icon={customPin('#E11D48')} />
            <ZoomBadge />
            <CustomZoomControl />
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
