import clsx from 'clsx'

// VVS FLOW brand: split lyn-bolt — groen venstre, blaa hoejre,
// paa hvid cirkel med moerk ramme. Matches logo fra brandguide.
export default function BrandIcon({ size = 48, className, rounded = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(className)}
      role="img"
      aria-label="VVS FLOW"
    >
      <defs>
        <linearGradient id="vvs-bolt-split" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.5" stopColor="#22C55E" />
          <stop offset="0.5" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      {rounded && (
        <>
          <circle cx="32" cy="32" r="30" fill="#FFFFFF" />
          <circle cx="32" cy="32" r="30" fill="none" stroke="#0F172A" strokeWidth="3" />
        </>
      )}
      {/* Stiliseret lyn-bolt med hard split i midten */}
      <path
        d="M34 10 L16 36 L28 36 L24 54 L48 28 L34 28 L40 10 Z"
        fill="url(#vvs-bolt-split)"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
