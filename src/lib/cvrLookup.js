// Dansk CVR-opslag via cvrapi.dk - gratis, offentlig, CORS-enabled.
// Dokumentation: https://cvrapi.dk/documentation
//
// Returnerer firmainfo (navn, adresse, postnr/by, email, telefon, branche) ud fra CVR-nummer.

const CVR_API = 'https://cvrapi.dk/api'

export async function lookupCvr(cvr) {
  const clean = String(cvr || '').replace(/\D/g, '')
  if (clean.length !== 8) {
    throw new Error('CVR-nummer skal være 8 cifre')
  }

  // cvrapi.dk kræver User-Agent — browseren sætter den automatisk med app-info
  const res = await fetch(
    `${CVR_API}?search=${encodeURIComponent(clean)}&country=dk`,
    { headers: { Accept: 'application/json' } }
  )

  if (res.status === 404) throw new Error('CVR-nummer ikke fundet')
  if (res.status === 429) throw new Error('For mange forespørgsler — prøv igen om lidt')
  if (!res.ok) throw new Error(`CVR-opslag fejlede (${res.status})`)

  const data = await res.json()

  return {
    raw: data,
    name: data.name || '',
    address: [data.address, data.addressco].filter(Boolean).join(', '),
    zip: data.zipcode || '',
    city: data.city || '',
    full_address: [data.address, `${data.zipcode || ''} ${data.city || ''}`.trim()]
      .filter(Boolean)
      .join(', '),
    email: data.email || '',
    phone: data.phone || '',
    industry: data.industrydesc || '',
    employees: data.employees || null,
    startdate: data.startdate || null,
  }
}
