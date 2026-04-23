import clsx from 'clsx'

const OPTIONS = [
  { value: 'incl', label: 'Inkl.' },
  { value: 'excl', label: 'Ekskl.' },
  { value: 'both', label: 'Begge' },
]

export default function VatToggle({ value, onChange, size = 'md' }) {
  return (
    <div
      className={clsx(
        'inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}
      role="group"
      aria-label="Moms-visning"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={clsx(
            'px-3 rounded-xl font-semibold transition-colors',
            size === 'sm' ? 'py-1' : 'py-1.5',
            value === opt.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {opt.label} moms
        </button>
      ))}
    </div>
  )
}
