import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import clsx from 'clsx'

// Dataforsyningen API (gratis, offentlig, ingen nøgle)
const DAR_URL = 'https://api.dataforsyningen.dk/autocomplete'

export default function AddressAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Vej, nr, postnummer by',
  autoFocus = false,
  required = false,
  id,
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const wrapRef = useRef(null)
  const skipFetchRef = useRef(false)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false
      return
    }
    const q = query.trim()
    if (q.length < 3) {
      setSuggestions([])
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${DAR_URL}?type=adresse&q=${encodeURIComponent(q)}&per_side=6&fuzzy`
        )
        if (!res.ok) throw new Error('Adresse-lookup fejlede')
        const data = await res.json()
        if (!cancelled) {
          setSuggestions(data)
          setActive(-1)
          setOpen(true)
        }
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  // Luk dropdown ved klik udenfor
  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function handleInputChange(e) {
    const v = e.target.value
    setQuery(v)
    onChange?.(v)
    setOpen(true)
  }

  function selectSuggestion(item) {
    const full = item.tekst || item.forslagstekst || ''
    const adr = item.adresse || item.data
    skipFetchRef.current = true
    setQuery(full)
    onChange?.(full)
    onSelect?.({
      address: adr?.vejnavn
        ? `${adr.vejnavn} ${adr.husnr || ''}${adr.etage ? `, ${adr.etage}.` : ''}${adr.dør ? ` ${adr.dør}` : ''}`.trim()
        : full,
      zip: adr?.postnr || null,
      city: adr?.postnrnavn || null,
      full_address: full,
      lat: adr?.y || null, // Dataforsyningen: y = lat
      lon: adr?.x || null, // x = lon
    })
    setOpen(false)
    setSuggestions([])
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(suggestions.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
      <input
        id={id}
        type="text"
        className="input pl-11 pr-10"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        required={required}
        autoComplete="off"
      />
      {loading && (
        <Loader2
          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin"
          strokeWidth={2}
        />
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <li key={s.tekst || idx}>
              <button
                type="button"
                onMouseEnter={() => setActive(idx)}
                onClick={() => selectSuggestion(s)}
                className={clsx(
                  'w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-colors',
                  active === idx ? 'bg-sky-50 text-sky-900' : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <MapPin
                  className={clsx('w-4 h-4 flex-shrink-0', active === idx ? 'text-sky-500' : 'text-slate-400')}
                  strokeWidth={2}
                />
                <span className="truncate">{s.tekst || s.forslagstekst}</span>
              </button>
            </li>
          ))}
          <li className="px-4 py-1.5 text-[10px] text-slate-400 border-t border-slate-100 bg-slate-50">
            Data: Dataforsyningen.dk
          </li>
        </ul>
      )}
    </div>
  )
}
