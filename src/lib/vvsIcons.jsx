// VVS-ikon-bibliotek - blanding af Lucide-ikoner og custom SVG'er
// for de ting Lucide ikke har (toilet, håndvask, vandhane).
//
// Hver ikon-definition: { id, label, category, render }
// render = React-komponent der accepterer { size, color, strokeWidth }

import {
  Bath,
  ShowerHead,
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
  WashingMachine,
  Container,
  Settings2,
  Sprout,
  CloudRain,
  GitBranch,
  Drill,
  ArrowDownToLine,
  Shield,
  Camera,
  Wrench,
  Package,
} from 'lucide-react'

// ============================================
// Custom SVG-ikoner - tegnet til at matche Lucide's style
// (24x24 viewBox, stroke-based, 2px default stroke-width)
// ============================================

function svgProps({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
}

function ToiletCustom(props) {
  return (
    <svg {...svgProps(props)}>
      {/* Cisterne */}
      <rect x="6" y="2" width="12" height="5" rx="1" />
      {/* Kumme-top */}
      <path d="M5 7 L19 7" />
      {/* Kumme */}
      <path d="M7 7 L7 14 Q7 17 12 17 Q17 17 17 14 L17 7" />
      {/* Fod */}
      <path d="M9 17 L8 22" />
      <path d="M15 17 L16 22" />
    </svg>
  )
}

function SinkCustom(props) {
  return (
    <svg {...svgProps(props)}>
      {/* Vandhane pibe */}
      <path d="M12 3 L12 7" />
      <path d="M10 3 L14 3" />
      <path d="M8 7 L16 7" />
      <path d="M10 7 L10 9" />
      {/* Håndvask */}
      <path d="M3 11 L21 11 L20 19 Q20 20 19 20 L5 20 Q4 20 4 19 Z" />
      {/* Afløb */}
      <circle cx="12" cy="16" r="1" />
    </svg>
  )
}

function FaucetCustom(props) {
  return (
    <svg {...svgProps(props)}>
      {/* Vertikal pibe */}
      <path d="M12 3 L12 9" />
      {/* Håndtag */}
      <path d="M9 5 L15 5" />
      {/* Hale */}
      <path d="M5 9 L19 9" />
      <path d="M14 9 L14 13" />
      {/* Vanddråbe */}
      <path d="M12 16 Q12 19 14 19 Q16 19 16 16 Q16 14 14 14 Q12 14 12 16 Z" transform="translate(-2 0)" fill="currentColor" />
    </svg>
  )
}

function PipeCustom(props) {
  return (
    <svg {...svgProps(props)}>
      {/* T-stykke rør */}
      <path d="M3 12 L10 12 L10 4 L14 4 L14 12 L21 12" />
      {/* Samlinger */}
      <circle cx="10" cy="12" r="1.5" fill="currentColor" />
      <circle cx="14" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

function RadiatorCustom(props) {
  return (
    <svg {...svgProps(props)}>
      {/* Radiator-krop */}
      <rect x="4" y="5" width="16" height="14" rx="1" />
      {/* Lameller */}
      <path d="M8 5 L8 19" />
      <path d="M12 5 L12 19" />
      <path d="M16 5 L16 19" />
      {/* Topventil */}
      <path d="M6 5 L6 3 L9 3" />
      {/* Bund-ventil */}
      <path d="M18 19 L18 21" />
    </svg>
  )
}

function WaterHeaterCustom(props) {
  return (
    <svg {...svgProps(props)}>
      {/* Tank */}
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      {/* Top-tilslutning */}
      <path d="M10 3 L10 1" />
      <path d="M14 3 L14 1" />
      {/* Display */}
      <rect x="9" y="7" width="6" height="3" rx="0.5" />
      {/* Ventil */}
      <circle cx="18" cy="14" r="1" />
      {/* Base */}
      <path d="M8 21 L8 22" />
      <path d="M16 21 L16 22" />
    </svg>
  )
}

// ============================================
// Samlet icon-bibliotek (id -> renderer)
// ============================================

export const VVS_ICONS = {
  // Custom SVG'er (VVS-specifikke)
  Toilet:       ToiletCustom,
  Sink:         SinkCustom,
  Faucet:       FaucetCustom,
  Pipe:         PipeCustom,
  Radiator:     RadiatorCustom,
  WaterHeater:  WaterHeaterCustom,

  // Lucide-ikoner
  Bath, ShowerHead, Droplet, Droplets, Waves, CircleDot, Flame,
  Thermometer, Wind, Utensils, Refrigerator, Filter, WashingMachine,
  Container, Settings2, Sprout, CloudRain, GitBranch, Drill,
  ArrowDownToLine, Shield, Camera, Wrench, Package,
}

// ============================================
// Picker-liste med kategorier
// ============================================

export const ICON_CATEGORIES = [
  {
    id: 'sanitet',
    label: 'Sanitet',
    icons: [
      { id: 'Toilet', label: 'Toilet' },
      { id: 'Bath', label: 'Badekar' },
      { id: 'ShowerHead', label: 'Brusebad' },
      { id: 'Sink', label: 'Håndvask' },
      { id: 'Droplet', label: 'Dråbe' },
      { id: 'Droplets', label: 'Dobbelt' },
    ],
  },
  {
    id: 'vand',
    label: 'Vand & armatur',
    icons: [
      { id: 'Faucet', label: 'Vandhane' },
      { id: 'Waves', label: 'Blandingsbatteri' },
      { id: 'CircleDot', label: 'Gulvafløb' },
      { id: 'CloudRain', label: 'Regnvand' },
      { id: 'Filter', label: 'Filter' },
      { id: 'ArrowDownToLine', label: 'Pumpe' },
    ],
  },
  {
    id: 'varme',
    label: 'Varme & teknik',
    icons: [
      { id: 'Flame', label: 'Fjernvarme' },
      { id: 'Thermometer', label: 'Temperatur' },
      { id: 'Radiator', label: 'Radiator' },
      { id: 'WaterHeater', label: 'VV-beholder' },
      { id: 'Container', label: 'Tank' },
      { id: 'Settings2', label: 'Ventil' },
    ],
  },
  {
    id: 'kokken',
    label: 'Køkken & bryggers',
    icons: [
      { id: 'Utensils', label: 'Køkken' },
      { id: 'Refrigerator', label: 'Opvaskemaskine' },
      { id: 'WashingMachine', label: 'Vaskemaskine' },
      { id: 'Wind', label: 'Ventilation' },
    ],
  },
  {
    id: 'ror',
    label: 'Rør & værktøj',
    icons: [
      { id: 'Pipe', label: 'T-stykke' },
      { id: 'GitBranch', label: 'Rørføring' },
      { id: 'Wrench', label: 'Værktøj' },
      { id: 'Drill', label: 'Boremaskine' },
      { id: 'Shield', label: 'Rottespærre' },
      { id: 'Camera', label: 'Kamera-inspektion' },
    ],
  },
  {
    id: 'udendors',
    label: 'Udendørs',
    icons: [
      { id: 'Sprout', label: 'Havevanding' },
      { id: 'Package', label: 'Andet' },
    ],
  },
]
