import clsx from 'clsx'
import BrandIcon from './BrandIcon.jsx'

// Viser org's uploadede logo hvis det findes, ellers VVS FLOW brand-ikonet.
export default function OrgLogo({ org, size = 40, className }) {
  if (org?.logo_url) {
    return (
      <div
        className={clsx(
          'rounded-2xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center flex-shrink-0',
          className
        )}
        style={{ width: size, height: size }}
      >
        <img src={org.logo_url} alt={org.name || 'Logo'} className="w-full h-full object-contain" />
      </div>
    )
  }
  return <BrandIcon size={size} className={className} />
}
