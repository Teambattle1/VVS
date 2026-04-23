import { formatDKK, toInclVat } from '../lib/pricing.js'

export default function PriceSummary({
  excl,
  vatHandling = 'incl',
  label = 'I alt',
  size = 'md',
  align = 'right',
}) {
  const incl = toInclVat(excl || 0)
  const isLarge = size === 'lg'
  // 'both' er deprecated - fallback til 'incl'
  const mode = vatHandling === 'excl' ? 'excl' : 'incl'

  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      {label && (
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
          {label}
        </div>
      )}
      {mode === 'incl' ? (
        <>
          <div className={isLarge ? 'text-3xl font-extrabold text-slate-900' : 'text-lg font-bold text-slate-900'}>
            {formatDKK(incl)}
          </div>
          <div className="text-xs text-slate-500">inkl. moms</div>
        </>
      ) : (
        <>
          <div className={isLarge ? 'text-3xl font-extrabold text-slate-900' : 'text-lg font-bold text-slate-900'}>
            {formatDKK(excl)}
          </div>
          <div className="text-xs text-slate-500">
            ekskl. moms <span className="text-slate-400">({formatDKK(incl)} inkl.)</span>
          </div>
        </>
      )}
    </div>
  )
}
