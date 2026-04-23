// Flow-log: alle nye features pr. version.
// Version 1.0.0 er starten, senere versioner appendes øverst (nyeste først).
//
// Regel ved tilføjelse:
// - Ny minor version for nye features (1.0 -> 1.1)
// - Patch for fixes (1.0.0 -> 1.0.1) — vises normalt ikke i popup
// - Major for breaking changes (1.0 -> 2.0)

export const CHANGELOG = [
  {
    version: '1.0.0',
    date: '2026-04-23',
    title: 'VVS FLOW lanceres',
    features: [
      { icon: '🎉', text: 'Første version af VVS FLOW er live' },
      { icon: '🔐', text: 'Supabase Auth - rigtigt login + super-admin' },
      { icon: '📋', text: 'Jobs + rum + pakker + varer med fuld CRUD' },
      { icon: '🗺️', text: 'Adresse-autocomplete + kort med zoom-popup (Dataforsyningen + Leaflet)' },
      { icon: '🎨', text: 'Custom form/farve på pakke-markører på grundplan' },
      { icon: '📱', text: 'Responsive design til mobil/tablet/desktop' },
      { icon: '🌙', text: 'Dark/light theme-toggle i topbar' },
      { icon: '🔗', text: 'Del-med-kunde: kopiér link eller send SMS (beta)' },
      { icon: '👁️', text: 'Preview-knap på alle jobs - se som kunde' },
      { icon: '🏢', text: 'CVR-lookup henter firmainfo automatisk' },
      { icon: '📊', text: 'Aktivitetslog: kunde-handlinger + login/logout' },
      { icon: '🎁', text: 'Demo-pakker + demo-varer kan tilføjes/fjernes bulk' },
      { icon: '🔌', text: 'Integrationer-side med detaljer pr. leverandør (AO, Sanistål, BD, e-conomic m.fl.)' },
    ],
  },
]

export function getFeaturesSince(lastSeenVersion) {
  if (!lastSeenVersion) return CHANGELOG
  return CHANGELOG.filter((entry) => {
    // Vis kun entries nyere end lastSeenVersion
    return compareSimple(entry.version, lastSeenVersion) > 0
  })
}

function compareSimple(a, b) {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  return 0
}
