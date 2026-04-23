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
  switch (vatHandling) {
    case 'incl':
      return formatDKK(incl) + ' inkl. moms'
    case 'excl':
      return formatDKK(excl) + ' ekskl. moms'
    case 'both':
    default:
      return `${formatDKK(excl)} ekskl. / ${formatDKK(incl)} inkl. moms`
  }
}
