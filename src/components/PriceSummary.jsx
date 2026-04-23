import { formatDKK, toInclVat } from '../lib/pricing.js'

export default function PriceSummary({
  excl,
  vatHandling = 'both',
  label = 'I alt',
  size = 'md',
  align = 'right',
}) {
  const incl = toInclVat(excl || 0)
  const isLarge = size === 'lg'

  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      {label && (
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
          {label}
        </div>
      )}
      {vatHandling === 'incl' && (
        <>
          <div className={isLarge ? 'text-3xl font-extrabold text-slate-900' : 'text-lg font-bold text-slate-900'}>
            {formatDKK(incl)}
          </div>
          <div className="text-xs text-slate-500">inkl. moms</div>
        </>
      )}
      {vatHandling === 'excl' && (
        <>
          <div className={isLarge ? 'text-3xl font-extrabold text-slate-900' : 'text-lg font-bold text-slate-900'}>
            {formatDKK(excl)}
          </div>
          <div className="text-xs text-slate-500">ekskl. moms</div>
        </>
      )}
      {vatHandling === 'both' && (
        <div className="flex flex-col items-end gap-0.5">
          <div className={isLarge ? 'text-3xl font-extrabold text-slate-900' : 'text-lg font-bold text-slate-900'}>
            {formatDKK(incl)}
            <span className="text-xs font-semibold text-slate-500 ml-1">inkl.</span>
          </div>
          <div className="text-sm text-slate-500">
            {formatDKK(excl)} <span className="text-xs">ekskl.</span>
          </div>
        </div>
      )}
    </div>
  )
}
