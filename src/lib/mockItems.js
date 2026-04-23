// Varedatabase - startdata der simulerer organisk opbygget katalog
// I produktion tilhoerer hver vare en organization_id

export const INITIAL_ITEMS = [
  { id: 'i-001', sku: 'TOI-001', name: 'Toilet Ifö Spira',           category: 'toilet',    unit: 'stk', sales_price: 2890, supplier: 'manual' },
  { id: 'i-002', sku: 'TOI-002', name: 'Toiletkumme Duravit',        category: 'toilet',    unit: 'stk', sales_price: 3450, supplier: 'manual' },
  { id: 'i-003', sku: 'CIS-001', name: 'Cisterne Geberit Sigma',     category: 'toilet',    unit: 'stk', sales_price: 2150, supplier: 'manual' },
  { id: 'i-004', sku: 'HV-001',  name: 'Håndvask Ifö Caruso 55cm',   category: 'hvask',     unit: 'stk', sales_price: 1690, supplier: 'manual' },
  { id: 'i-005', sku: 'HV-002',  name: 'Håndvask Duravit Vero 60cm', category: 'hvask',     unit: 'stk', sales_price: 2340, supplier: 'manual' },
  { id: 'i-006', sku: 'ARM-001', name: 'Blandingsbatteri Grohe Eurosmart', category: 'armatur',unit: 'stk', sales_price: 1290, supplier: 'manual' },
  { id: 'i-007', sku: 'ARM-002', name: 'Blandingsbatteri Hansgrohe Focus', category: 'armatur',unit: 'stk', sales_price: 1590, supplier: 'manual' },
  { id: 'i-008', sku: 'ARM-003', name: 'Brusesæt Grohe Tempesta',    category: 'armatur',   unit: 'stk', sales_price: 890,  supplier: 'manual' },
  { id: 'i-009', sku: 'ROR-001', name: 'Kobberrør 15mm',              category: 'ror',       unit: 'm',   sales_price: 78,   supplier: 'manual' },
  { id: 'i-010', sku: 'ROR-002', name: 'Kobberrør 22mm',              category: 'ror',       unit: 'm',   sales_price: 112,  supplier: 'manual' },
  { id: 'i-011', sku: 'ROR-003', name: 'Pex-rør 16mm',                category: 'ror',       unit: 'm',   sales_price: 42,   supplier: 'manual' },
  { id: 'i-012', sku: 'AFL-001', name: 'Gulvafløb Unidrain 300mm',   category: 'aflob',     unit: 'stk', sales_price: 1290, supplier: 'manual' },
  { id: 'i-013', sku: 'AFL-002', name: 'Gulvafløb Blücher 200mm',    category: 'aflob',     unit: 'stk', sales_price: 890,  supplier: 'manual' },
  { id: 'i-014', sku: 'VVB-001', name: 'Varmtvandsbeholder 110L Metro', category: 'teknik', unit: 'stk', sales_price: 4290, supplier: 'manual' },
  { id: 'i-015', sku: 'VVB-002', name: 'Varmtvandsbeholder 160L Metro', category: 'teknik', unit: 'stk', sales_price: 5890, supplier: 'manual' },
  { id: 'i-016', sku: 'PUM-001', name: 'Cirkulationspumpe Grundfos Alpha', category: 'teknik',unit: 'stk', sales_price: 1890, supplier: 'manual' },
  { id: 'i-017', sku: 'FIT-001', name: 'Vinkelfitting 15mm',          category: 'fittings',  unit: 'stk', sales_price: 24,   supplier: 'manual' },
  { id: 'i-018', sku: 'FIT-002', name: 'T-stykke 22mm',               category: 'fittings',  unit: 'stk', sales_price: 32,   supplier: 'manual' },
  { id: 'i-019', sku: 'ISO-001', name: 'Rørisolering 15mm/m',         category: 'isolering', unit: 'm',   sales_price: 48,   supplier: 'manual' },
  { id: 'i-020', sku: 'ARB-001', name: 'Arbejdstid (udskiftning)',    category: 'timer',     unit: 't',   sales_price: 695,  supplier: 'manual' },
]

export const ITEM_CATEGORIES = [
  { value: 'toilet',    label: 'Toilet' },
  { value: 'hvask',     label: 'Håndvask' },
  { value: 'armatur',   label: 'Armatur' },
  { value: 'ror',       label: 'Rør' },
  { value: 'aflob',     label: 'Afløb' },
  { value: 'teknik',    label: 'Teknik' },
  { value: 'fittings',  label: 'Fittings' },
  { value: 'isolering', label: 'Isolering' },
  { value: 'timer',     label: 'Timer' },
  { value: 'andet',     label: 'Andet' },
]

export const UNITS = ['stk', 'm', 't', 'kg', 'sæt', 'rulle']
