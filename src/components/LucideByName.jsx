// Curated ikon-mapping for pakke-skabeloner.
// Undgaar `import * from 'lucide-react'` som traekker hele library (~750kB).
// Lucide har ikke altid eksakte match (fx Toilet) - vi mapper til naermeste.
import {
  Package,
  ShowerHead,
  Bath,
  Droplet,
  Droplets,
  Waves,
  CircleDot,
  Flame,
  Thermometer,
  Wind,
  Utensils,
  Refrigerator,
  Filter,
  Container,
  Settings2,
  Sprout,
  CloudRain,
  GitBranch,
  Drill,
  ArrowDownToLine,
  Shield,
  Camera,
  Armchair,
  WashingMachine,
} from 'lucide-react'

// Alias-mapping: pakke-navn -> faktisk Lucide-komponent
const ICONS = {
  Package,
  ShowerHead,
  Bath,
  Droplet,
  Droplets,
  Waves,
  CircleDot,
  Flame,
  Thermometer,
  Wind,
  Utensils,
  Refrigerator,
  Filter,
  Container,
  Settings2,
  Sprout,
  CloudRain,
  GitBranch,
  Drill,
  ArrowDownToLine,
  Shield,
  Camera,
  Armchair,
  WashingMachine,
  // Aliaser for ikoner uden direkte match
  Toilet: Armchair,
}

export default function LucideByName({ name, fallback = 'Package', ...props }) {
  const Icon = ICONS[name] || ICONS[fallback] || Package
  return <Icon {...props} />
}
