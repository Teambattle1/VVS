// Globale pakke-skabeloner (organization_id = NULL i DB)
// Matcher supabase/seed.sql

export const PACKAGE_TEMPLATES = [
  // Badeværelse
  { id: 't-bath-01', name: 'Toilet standard',          category: 'bathroom', lucide_icon: 'Toilet',        pricing_model: 'fixed',        base_price: 3200,  base_hours: 2.5, hourly_rate: null },
  { id: 't-bath-02', name: 'Toilet m/ skjult cisterne',category: 'bathroom', lucide_icon: 'Toilet',        pricing_model: 'fixed',        base_price: 6800,  base_hours: 5,   hourly_rate: null },
  { id: 't-bath-03', name: 'Bad / brusekabine',        category: 'bathroom', lucide_icon: 'ShowerHead',    pricing_model: 'package_plus', base_price: 4500,  base_hours: 4,   hourly_rate: null },
  { id: 't-bath-04', name: 'Badekar',                  category: 'bathroom', lucide_icon: 'Bath',          pricing_model: 'package_plus', base_price: 5800,  base_hours: 5,   hourly_rate: null },
  { id: 't-bath-05', name: 'Håndvask enkelt',          category: 'bathroom', lucide_icon: 'Droplet',       pricing_model: 'fixed',        base_price: 1800,  base_hours: 1.5, hourly_rate: null },
  { id: 't-bath-06', name: 'Dobbelt håndvask',         category: 'bathroom', lucide_icon: 'Droplets',      pricing_model: 'fixed',        base_price: 2800,  base_hours: 2.5, hourly_rate: null },
  { id: 't-bath-07', name: 'Blandingsbatteri bad',     category: 'bathroom', lucide_icon: 'Waves',         pricing_model: 'fixed',        base_price: 1400,  base_hours: 1,   hourly_rate: null },
  { id: 't-bath-08', name: 'Blandingsbatteri vask',    category: 'bathroom', lucide_icon: 'Waves',         pricing_model: 'fixed',        base_price: 1200,  base_hours: 1,   hourly_rate: null },
  { id: 't-bath-09', name: 'Gulvafløb',                category: 'bathroom', lucide_icon: 'CircleDot',     pricing_model: 'hourly',       base_price: 0,     base_hours: 4,   hourly_rate: 695 },
  { id: 't-bath-10', name: 'Gulvvarme (vådrum)',       category: 'bathroom', lucide_icon: 'Flame',         pricing_model: 'hourly',       base_price: 0,     base_hours: 8,   hourly_rate: 695 },
  { id: 't-bath-11', name: 'Radiator badeværelse',     category: 'bathroom', lucide_icon: 'Thermometer',   pricing_model: 'fixed',        base_price: 2800,  base_hours: 2.5, hourly_rate: null },
  { id: 't-bath-12', name: 'Ventilation / udsugning',  category: 'bathroom', lucide_icon: 'Wind',          pricing_model: 'fixed',        base_price: 2400,  base_hours: 2,   hourly_rate: null },

  // Køkken
  { id: 't-kit-01', name: 'Køkkenvask enkelt',         category: 'kitchen',  lucide_icon: 'Utensils',      pricing_model: 'fixed',        base_price: 1900,  base_hours: 1.5, hourly_rate: null },
  { id: 't-kit-02', name: 'Køkkenvask dobbelt',        category: 'kitchen',  lucide_icon: 'Utensils',      pricing_model: 'fixed',        base_price: 2600,  base_hours: 2.5, hourly_rate: null },
  { id: 't-kit-03', name: 'Blandingsbatteri køkken',   category: 'kitchen',  lucide_icon: 'Waves',         pricing_model: 'fixed',        base_price: 1300,  base_hours: 1,   hourly_rate: null },
  { id: 't-kit-04', name: 'Opvaskemaskine tilslutning',category: 'kitchen',  lucide_icon: 'Refrigerator',  pricing_model: 'fixed',        base_price: 1200,  base_hours: 1,   hourly_rate: null },
  { id: 't-kit-05', name: 'Vandfilter under vask',     category: 'kitchen',  lucide_icon: 'Filter',        pricing_model: 'fixed',        base_price: 1600,  base_hours: 1.5, hourly_rate: null },

  // Bryggers / Vaskerum
  { id: 't-util-01', name: 'Vaskemaskine tilslutning', category: 'utility',  lucide_icon: 'WashingMachine',pricing_model: 'fixed',        base_price: 1100,  base_hours: 1,   hourly_rate: null },
  { id: 't-util-02', name: 'Tørretumbler',             category: 'utility',  lucide_icon: 'WashingMachine',pricing_model: 'fixed',        base_price: 900,   base_hours: 1,   hourly_rate: null },
  { id: 't-util-03', name: 'Udslagsvask',              category: 'utility',  lucide_icon: 'Droplet',       pricing_model: 'fixed',        base_price: 2200,  base_hours: 2,   hourly_rate: null },
  { id: 't-util-04', name: 'Gulvafløb bryggers',       category: 'utility',  lucide_icon: 'CircleDot',     pricing_model: 'hourly',       base_price: 0,     base_hours: 4,   hourly_rate: 695 },

  // Teknikrum
  { id: 't-tech-01', name: 'Varmtvandsbeholder',       category: 'technical',lucide_icon: 'Container',     pricing_model: 'package_plus', base_price: 8800,  base_hours: 6,   hourly_rate: null },
  { id: 't-tech-02', name: 'Fjernvarmeunit',           category: 'technical',lucide_icon: 'Flame',         pricing_model: 'package_plus', base_price: 14500, base_hours: 8,   hourly_rate: null },
  { id: 't-tech-03', name: 'Cirkulationspumpe',        category: 'technical',lucide_icon: 'CircleDot',     pricing_model: 'fixed',        base_price: 2400,  base_hours: 2,   hourly_rate: null },
  { id: 't-tech-04', name: 'Shuntventil',              category: 'technical',lucide_icon: 'Settings2',     pricing_model: 'fixed',        base_price: 1800,  base_hours: 1.5, hourly_rate: null },
  { id: 't-tech-05', name: 'Ekspansionsbeholder',      category: 'technical',lucide_icon: 'Container',     pricing_model: 'fixed',        base_price: 1400,  base_hours: 1.5, hourly_rate: null },

  // Udendørs
  { id: 't-out-01', name: 'Udendørs vandhane',         category: 'outdoor',  lucide_icon: 'Droplet',       pricing_model: 'fixed',        base_price: 2200,  base_hours: 2,   hourly_rate: null },
  { id: 't-out-02', name: 'Havevanding / drypslange',  category: 'outdoor',  lucide_icon: 'Sprout',        pricing_model: 'hourly',       base_price: 0,     base_hours: 3,   hourly_rate: 695 },
  { id: 't-out-03', name: 'Nedløbsrør tilkobling',     category: 'outdoor',  lucide_icon: 'CloudRain',     pricing_model: 'hourly',       base_price: 0,     base_hours: 2,   hourly_rate: 695 },
  { id: 't-out-04', name: 'Tagbrønd / rendeafløb',     category: 'outdoor',  lucide_icon: 'CloudRain',     pricing_model: 'hourly',       base_price: 0,     base_hours: 4,   hourly_rate: 695 },

  // Diverse / Rørarbejde
  { id: 't-misc-01', name: 'Rørføring pr. meter',      category: 'misc',     lucide_icon: 'GitBranch',     pricing_model: 'hourly',       base_price: 0,     base_hours: 0.5, hourly_rate: 695 },
  { id: 't-misc-02', name: 'Gennemboring væg',         category: 'misc',     lucide_icon: 'Drill',         pricing_model: 'fixed',        base_price: 600,   base_hours: 0.5, hourly_rate: null },
  { id: 't-misc-03', name: 'Dykpumpe',                 category: 'misc',     lucide_icon: 'ArrowDownToLine',pricing_model: 'fixed',       base_price: 3200,  base_hours: 2.5, hourly_rate: null },
  { id: 't-misc-04', name: 'Rottespærre',              category: 'misc',     lucide_icon: 'Shield',        pricing_model: 'fixed',        base_price: 2800,  base_hours: 2,   hourly_rate: null },
  { id: 't-misc-05', name: 'Inspektion med kamera',    category: 'misc',     lucide_icon: 'Camera',        pricing_model: 'hourly',       base_price: 0,     base_hours: 1,   hourly_rate: 895 },
]

export const ROOM_TYPES = [
  { value: 'bathroom',  label: 'Badeværelse',     categories: ['bathroom', 'misc'] },
  { value: 'kitchen',   label: 'Køkken',          categories: ['kitchen', 'misc'] },
  { value: 'utility',   label: 'Bryggers/Vaskerum', categories: ['utility', 'misc'] },
  { value: 'technical', label: 'Teknikrum',       categories: ['technical', 'misc'] },
  { value: 'outdoor',   label: 'Udendørs',        categories: ['outdoor', 'misc'] },
  { value: 'other',     label: 'Andet',           categories: ['bathroom','kitchen','utility','technical','outdoor','misc'] },
]

export function templatesForRoomType(roomType) {
  const def = ROOM_TYPES.find((r) => r.value === roomType)
  const cats = def?.categories || []
  return PACKAGE_TEMPLATES.filter((t) => cats.includes(t.category))
}
