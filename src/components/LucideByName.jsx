// Backwards-compatible navn paa ikon-renderer.
// Bruger VVS-ikon-biblioteket (Lucide + custom VVS SVG'er).
import { VVS_ICONS } from '../lib/vvsIcons.jsx'
import { Package } from 'lucide-react'

export default function LucideByName({ name, fallback = 'Package', ...props }) {
  const Icon = VVS_ICONS[name] || VVS_ICONS[fallback] || Package
  return <Icon {...props} />
}
