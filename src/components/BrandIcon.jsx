import clsx from 'clsx'

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
      {rounded && <rect width="64" height="64" rx="14" fill="currentColor" fillOpacity="0.06" />}
      <g
        transform="translate(4 0) scale(2.5)"
        stroke="#E11D48"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </g>
      <path d="M16 50 Q12 55 16 58 Q20 55 16 50 Z" fill="#0EA5E9" />
      <path d="M32 52 Q28 57 32 60 Q36 57 32 52 Z" fill="#0EA5E9" />
      <path d="M48 50 Q44 55 48 58 Q52 55 48 50 Z" fill="#0EA5E9" />
    </svg>
  )
}
