import * as Icons from 'lucide-react'

// Helper: render et lucide-ikon ud fra string-navn (fra template.lucide_icon)
export default function LucideByName({ name, fallback = 'Package', ...props }) {
  const Icon = Icons[name] || Icons[fallback] || Icons.Package
  return <Icon {...props} />
}
