// Demo-varer til varedatabasen - navne starter altid med [DEMO]
// saa de er lette at fjerne igen.

export const DEMO_ITEM_PREFIX = '[DEMO] '

export function isDemoItem(item) {
  return (item?.name || '').startsWith(DEMO_ITEM_PREFIX)
}

export const DEMO_ITEMS = [
  { name: DEMO_ITEM_PREFIX + 'Toilet Geberit AquaClean',     sku: 'DEMO-TOI-01', category: 'toilet',    unit: 'stk', sales_price: 24500 },
  { name: DEMO_ITEM_PREFIX + 'Toilet Ifö Cera Plus',         sku: 'DEMO-TOI-02', category: 'toilet',    unit: 'stk', sales_price: 2990 },
  { name: DEMO_ITEM_PREFIX + 'Håndvask Villeroy & Boch 65cm', sku: 'DEMO-HV-01', category: 'hvask',     unit: 'stk', sales_price: 3890 },
  { name: DEMO_ITEM_PREFIX + 'Håndvask Duravit Happy D.2',   sku: 'DEMO-HV-02', category: 'hvask',     unit: 'stk', sales_price: 2750 },
  { name: DEMO_ITEM_PREFIX + 'Blandingsbatteri Vola HV1',    sku: 'DEMO-ARM-01',category: 'armatur',   unit: 'stk', sales_price: 4290 },
  { name: DEMO_ITEM_PREFIX + 'Brusesæt Hansgrohe Croma',     sku: 'DEMO-ARM-02',category: 'armatur',   unit: 'stk', sales_price: 1890 },
  { name: DEMO_ITEM_PREFIX + 'Kobberrør 15mm (præmium)',     sku: 'DEMO-ROR-01',category: 'ror',       unit: 'm',   sales_price: 95 },
  { name: DEMO_ITEM_PREFIX + 'Pex-rør 20mm rød (varmt vand)',sku: 'DEMO-ROR-02',category: 'ror',       unit: 'm',   sales_price: 58 },
  { name: DEMO_ITEM_PREFIX + 'Gulvafløb Unidrain 800mm',     sku: 'DEMO-AFL-01',category: 'aflob',     unit: 'stk', sales_price: 2890 },
  { name: DEMO_ITEM_PREFIX + 'Varmtvandsbeholder 200L Metro',sku: 'DEMO-VVB-01',category: 'teknik',    unit: 'stk', sales_price: 6890 },
  { name: DEMO_ITEM_PREFIX + 'Cirkulationspumpe Grundfos Magna', sku: 'DEMO-PUM-01', category: 'teknik', unit: 'stk', sales_price: 3490 },
  { name: DEMO_ITEM_PREFIX + 'Isolering 22mm rør/m',         sku: 'DEMO-ISO-01',category: 'isolering', unit: 'm',   sales_price: 65 },
]
