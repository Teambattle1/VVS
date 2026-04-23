import { useMemo, useRef, useState } from 'react'
import { Plus, Edit2, Trash2, Search, X, Check, Upload, Download, Sparkles, Trash } from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../../contexts/JobsContext.jsx'
import { ITEM_CATEGORIES, UNITS } from '../../lib/mockItems.js'
import { DEMO_ITEMS, isDemoItem } from '../../lib/demoItems.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { formatDKK } from '../../lib/pricing.js'

export default function AdminItems() {
  const { items, createItem, updateItem, deleteItem, importItemsCSV } = useJobs()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const fileRef = useRef(null)

  const demoItems = useMemo(() => items.filter(isDemoItem), [items])

  function handleAddDemo() {
    DEMO_ITEMS.forEach((it) => createItem(it))
    toast.success(`${DEMO_ITEMS.length} demo-varer tilføjet`)
  }

  function handleRemoveAllDemo() {
    if (!demoItems.length) return
    if (!confirm(`Fjern ${demoItems.length} demo-varer?`)) return
    demoItems.forEach((it) => deleteItem(it.id))
    toast.success(`${demoItems.length} demo-varer fjernet`)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (categoryFilter !== 'all' && it.category !== categoryFilter) return false
      if (!q) return true
      return (
        it.name.toLowerCase().includes(q) ||
        (it.sku || '').toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q)
      )
    })
  }, [items, query, categoryFilter])

  function handleCSVUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result
      const rows = parseCSV(text)
      const n = importItemsCSV(rows).length
      alert(`${n} varer importeret.`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleDownloadCSV() {
    const header = 'name,sku,category,unit,sales_price\n'
    const body = items
      .map(
        (it) =>
          `"${it.name}","${it.sku || ''}","${it.category || ''}","${it.unit || ''}",${it.sales_price}`
      )
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vvs-varer.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Varedatabase</h1>
          <p className="text-sm text-slate-500">
            {items.length} varer
            {demoItems.length > 0 && <span className="text-amber-700 font-semibold"> · {demoItems.length} demo</span>}
            {' '}· CSV-import/eksport tilgængelig.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button type="button" onClick={handleDownloadCSV} className="btn-secondary">
            <Download className="w-4 h-4 text-slate-700" strokeWidth={2} />
            Eksporter CSV
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
            <Upload className="w-4 h-4 text-slate-700" strokeWidth={2} />
            Importer CSV
          </button>
          <button type="button" onClick={() => setEditing('new')} className="btn-primary">
            <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
            Ny vare
          </button>
        </div>
      </header>

      <div className="card p-4 flex flex-col md:flex-row md:items-center gap-3 bg-gradient-to-br from-amber-50 to-white border-amber-200">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">Demo-varer</div>
            <p className="text-xs text-slate-600">
              Prøv varedatabasen med {DEMO_ITEMS.length} eksempel-varer. Alle markeres med{' '}
              <span className="chip bg-amber-100 text-amber-800 text-[10px] font-bold">DEMO</span>
              {' '}så de kan fjernes samlet igen.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleAddDemo}
            className="btn-secondary border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            Tilføj demo-varer
          </button>
          <button
            type="button"
            onClick={handleRemoveAllDemo}
            disabled={demoItems.length === 0}
            className={clsx(
              'btn-secondary',
              demoItems.length === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'border-rose-300 text-rose-700 hover:bg-rose-50'
            )}
          >
            <Trash className="w-4 h-4" strokeWidth={2} />
            Fjern alle demo
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
          <input
            type="search"
            className="input pl-11"
            placeholder="Søg på navn, SKU eller kategori…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input md:w-52"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Alle kategorier</option>
          {ITEM_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[1fr_140px_140px_80px_120px_auto] px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div>Navn</div>
          <div>SKU</div>
          <div>Kategori</div>
          <div>Enhed</div>
          <div className="text-right">Pris</div>
          <div></div>
        </div>
        <ul className="divide-y divide-slate-100">
          {filtered.map((it) => {
            const catLabel = ITEM_CATEGORIES.find((c) => c.value === it.category)?.label || it.category
            return (
              <li
                key={it.id}
                className="px-4 py-3 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_140px_140px_80px_120px_auto] items-center gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                    {isDemoItem(it) && (
                      <span className="chip bg-amber-100 text-amber-800 text-[10px] font-bold flex-shrink-0">DEMO</span>
                    )}
                    {it.name}
                  </div>
                  <div className="text-xs text-slate-500 md:hidden">
                    {it.sku ? `${it.sku} · ` : ''}{catLabel} · {formatDKK(it.sales_price)}
                  </div>
                </div>
                <div className="hidden md:block text-sm text-slate-600 font-mono">{it.sku || '—'}</div>
                <div className="hidden md:block text-sm text-slate-600">{catLabel}</div>
                <div className="hidden md:block text-sm text-slate-600">{it.unit}</div>
                <div className="hidden md:block text-sm text-slate-900 font-semibold text-right">
                  {formatDKK(it.sales_price)}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(it)}
                    className="w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                    aria-label="Rediger"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Slet "${it.name}"?`)) deleteItem(it.id)
                    }}
                    className="w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                    aria-label="Slet"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Ingen varer matcher.
            </li>
          )}
        </ul>
      </div>

      {editing && (
        <ItemDialog
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing === 'new') createItem(data)
            else updateItem(editing.id, data)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ItemDialog({ item, onSave, onClose }) {
  const [name, setName] = useState(item?.name || '')
  const [sku, setSku] = useState(item?.sku || '')
  const [category, setCategory] = useState(item?.category || 'andet')
  const [unit, setUnit] = useState(item?.unit || 'stk')
  const [salesPrice, setSalesPrice] = useState(item?.sales_price || 0)

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ name, sku, category, unit, sales_price: salesPrice })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex-1">
            {item ? 'Rediger vare' : 'Ny vare'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="label">Navn</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">SKU</label>
              <input
                type="text"
                className="input"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="TOI-001"
              />
            </div>
            <div>
              <label className="label">Enhed</label>
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Kategori</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Salgspris (kr, ekskl. moms)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={salesPrice}
              onChange={(e) => setSalesPrice(e.target.value)}
              required
            />
          </div>
        </div>

        <footer className="p-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Annuller
          </button>
          <button type="submit" className="btn-primary flex-1">
            <Check className="w-5 h-5 text-white" strokeWidth={2.25} />
            Gem
          </button>
        </footer>
      </form>
    </div>
  )
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return []
  const headers = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((l) => {
    const cols = splitCSVLine(l)
    const row = {}
    headers.forEach((h, i) => {
      row[h] = cols[i] || ''
    })
    return row
  })
}

function splitCSVLine(line) {
  const out = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}
