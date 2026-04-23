export const VERSION = '1.0.9'

// Sammenlign versioner (x.y.z format). Returns -1/0/1.
export function compareVersions(a, b) {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0)
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff < 0 ? -1 : 1
  }
  return 0
}
