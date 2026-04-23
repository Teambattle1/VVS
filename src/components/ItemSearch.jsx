import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, X, Package as PackageIcon } from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../contexts/JobsContext.jsx'
import { ITEM_CATEGORIES, UNITS } from '../lib/mockItems.js'
import { formatDKK } from '../lib/pricing.js'

export default function ItemSearch({ onPick, onClose }) {
  const { items, searchItems, createItem } = useJobs()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200)
    return () => clearTimeout(t)
  }, [query])

  const results = useMemo(() => searchItems(debounced), [items, debounced, searchItems])

  function handlePick(item) {
    onPick(item, 1)
  }

  if (creating) {
    return (
      <CreateItemForm
        initialName={query}
        onCancel={() => setCreating(false)}
        onCreate={(data) => {
          const newItem = createItem(data)
          onPick(newItem, 1)
        }}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col">
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Tilføj vare</h2>
            <p className="text-xs text-slate-500">Søg i din varedatabase eller opret ny.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Luk"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </header>

        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              strokeWidth={2}
            />
            <input
              type="search"
              className="input pl-11"
              placeholder="Søg på navn, SKU eller kategori…"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <PackageIcon className="w-6 h-6" strokeWidth={2} />
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Ingen varer matcher &quot;{query}&quot;.
              </p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="btn-primary mx-auto"
              >
                <Plus className="w-5 h-5 text-white" strokeWidth={2.25} />
                Opret ny vare
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(it)}
                    className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-slate-50"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                      <PackageIcon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{it.name}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {it.sku ? `${it.sku} · ` : ''}
                        {ITEM_CATEGORIES.find((c) => c.value === it.category)?.label || it.category}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-slate-900">{formatDKK(it.sales_price)}</div>
                      <div className="text-xs text-slate-500">pr. {it.unit}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="btn-secondary w-full"
          >
            <Plus className="w-5 h-5 text-slate-700" strokeWidth={2.25} />
            Opret ny vare
          </button>
        </footer>
      </div>
    </div>
  )
}

function CreateItemForm({ initialName, onCreate, onCancel, onClose }) {
  const [name, setName] = useState(initialName || '')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('andet')
  const [unit, setUnit] = useState('stk')
  const [salesPrice, setSalesPrice] = useState('')
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const canSubmit = name.trim().length > 0 && Number(salesPrice) > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onCreate({ name, sku, category, unit, sales_price: salesPrice })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[92vh] flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Opret ny vare</h2>
            <p className="text-xs text-slate-500">Tilføjes til din varedatabase.</p>
          </div>
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
            <label htmlFor="item-name" className="label">Navn</label>
            <input
              id="item-name"
              ref={nameRef}
              type="text"
              className="input"
              placeholder="Fx: Toilet Ifö Spira"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-sku" className="label">SKU (valgfri)</label>
              <input
                id="item-sku"
                type="text"
                className="input"
                placeholder="TOI-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="item-unit" className="label">Enhed</label>
              <select
                id="item-unit"
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="item-cat" className="label">Kategori</label>
            <select
              id="item-cat"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="item-price" className="label">Salgspris (kr, ekskl. moms)</label>
            <input
              id="item-price"
              type="number"
              min="0"
              step="1"
              className="input"
              placeholder="1890"
              value={salesPrice}
              onChange={(e) => setSalesPrice(e.target.value)}
              required
            />
          </div>
        </div>

        <footer className="p-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Tilbage
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={clsx('btn-primary flex-1', !canSubmit && 'opacity-50 cursor-not-allowed')}
          >
            Opret og tilføj
          </button>
        </footer>
      </form>
    </div>
  )
}
