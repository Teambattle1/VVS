export function applyOrgTheme(org) {
  if (!org) return
  const root = document.documentElement
  if (org.primary_color) root.style.setProperty('--brand-primary', org.primary_color)
  if (org.accent_color) root.style.setProperty('--brand-accent', org.accent_color)
}

export function resetTheme() {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', '#0EA5E9')
  root.style.setProperty('--brand-accent', '#F59E0B')
}
