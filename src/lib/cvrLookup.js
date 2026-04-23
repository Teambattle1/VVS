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

  // 10 sekunders timeout — cvrapi.dk hænger undertiden uden CORS-svar
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  let res
  try {
    res = await fetch(
      `${CVR_API}?search=${encodeURIComponent(clean)}&country=dk`,
      { headers: { Accept: 'application/json' }, signal: controller.signal }
    )
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('CVR-opslag timeout — prøv igen eller udfyld manuelt')
    }
    throw new Error('Kunne ikke nå CVR-tjenesten (netværksfejl/CORS)')
  }
  clearTimeout(timeoutId)

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
