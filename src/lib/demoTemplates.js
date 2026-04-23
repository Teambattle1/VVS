// Demo pakke-skabeloner - navn starter altid med [DEMO]
// saa de nemt kan genkendes og fjernes bulk.

export const DEMO_PREFIX = '[DEMO] '

export function isDemoTemplate(template) {
  return (template?.name || '').startsWith(DEMO_PREFIX)
}

export const DEMO_TEMPLATES = [
  {
    name: DEMO_PREFIX + 'Hurtig toilet-skift',
    category: 'bathroom',
    lucide_icon: 'Armchair',
    pricing_model: 'fixed',
    base_price: 3500,
    base_hours: 2,
    hourly_rate: null,
  },
  {
    name: DEMO_PREFIX + 'Luksus bruseopsætning',
    category: 'bathroom',
    lucide_icon: 'ShowerHead',
    pricing_model: 'package_plus',
    base_price: 8900,
    base_hours: 5,
    hourly_rate: null,
  },
  {
    name: DEMO_PREFIX + 'Mini-køkkenvask',
    category: 'kitchen',
    lucide_icon: 'Utensils',
    pricing_model: 'fixed',
    base_price: 2100,
    base_hours: 1.5,
    hourly_rate: null,
  },
  {
    name: DEMO_PREFIX + 'Vaskemaskine + tumbler',
    category: 'utility',
    lucide_icon: 'WashingMachine',
    pricing_model: 'fixed',
    base_price: 1800,
    base_hours: 1.5,
    hourly_rate: null,
  },
  {
    name: DEMO_PREFIX + 'Timeabonnement (fejlsøgning)',
    category: 'misc',
    lucide_icon: 'Drill',
    pricing_model: 'hourly',
    base_price: 0,
    base_hours: 1,
    hourly_rate: 795,
  },
  {
    name: DEMO_PREFIX + 'Varmtvandsbeholder 200L',
    category: 'technical',
    lucide_icon: 'Container',
    pricing_model: 'package_plus',
    base_price: 11500,
    base_hours: 7,
    hourly_rate: null,
  },
  {
    name: DEMO_PREFIX + 'Udendørs vandhane m/ frostsikring',
    category: 'outdoor',
    lucide_icon: 'Droplet',
    pricing_model: 'fixed',
    base_price: 2800,
    base_hours: 2.5,
    hourly_rate: null,
  },
  {
    name: DEMO_PREFIX + 'Rørinspektion m/ rapport',
    category: 'misc',
    lucide_icon: 'Camera',
    pricing_model: 'hourly',
    base_price: 0,
    base_hours: 1.5,
    hourly_rate: 950,
  },
]
