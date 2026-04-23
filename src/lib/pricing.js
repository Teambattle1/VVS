export const VAT_RATE = 0.25

export function toInclVat(exclAmount) {
  return Math.round(exclAmount * (1 + VAT_RATE) * 100) / 100
}

export function toExclVat(inclAmount) {
  return Math.round((inclAmount / (1 + VAT_RATE)) * 100) / 100
}

export function formatDKK(amount, { withSymbol = true } = {}) {
  if (amount == null || Number.isNaN(amount)) return '—'
  const formatter = new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return withSymbol ? `${formatter.format(amount)} kr` : formatter.format(amount)
}

export function priceLabel(excl, vatHandling) {
  const incl = toInclVat(excl)
  // 'both' er deprecated - fallback til 'incl'
  const mode = vatHandling === 'excl' ? 'excl' : 'incl'
  if (mode === 'excl') {
    return `${formatDKK(excl)} ekskl. moms (${formatDKK(incl)} inkl.)`
  }
  return formatDKK(incl) + ' inkl. moms'
}

// ============================================
// Pakke/rum/job sum-beregninger
// Alle returværdier er EKSKL. moms.
// ============================================

function itemTotal(item) {
  if (!item.customer_selected) return 0
  return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
}

export function packageItemsTotal(pkg) {
  if (!pkg?.items?.length) return 0
  return pkg.items.reduce((sum, it) => sum + itemTotal(it), 0)
}

export function packageLaborTotal(pkg) {
  if (!pkg) return 0
  switch (pkg.pricing_model) {
    case 'fixed':
      return Number(pkg.fixed_price) || 0
    case 'hourly':
      return (Number(pkg.hours) || 0) * (Number(pkg.hourly_rate) || 0)
    case 'package_plus':
      return Number(pkg.fixed_price) || 0
    default:
      return 0
  }
}

export function packageTotal(pkg) {
  return packageLaborTotal(pkg) + packageItemsTotal(pkg)
}

export function roomTotal(room) {
  if (!room?.packages?.length) return 0
  return room.packages.reduce((sum, p) => sum + packageTotal(p), 0)
}

export function jobTotal(job) {
  if (!job?.rooms?.length) return 0
  return job.rooms.reduce((sum, r) => sum + roomTotal(r), 0)
}
