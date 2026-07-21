#!/usr/bin/env node
// Holder Supabase-projektet vågent med en let, ægte DB-læsning gennem PostgREST.
// Køres automatisk af GitHub Actions (.github/workflows/supabase-keepalive.yml)
// to gange om ugen — eller manuelt med: npm run keepalive

import { readFileSync } from 'node:fs'

// Lokal kørsel: fald tilbage til .env hvis nøglerne ikke er sat i miljøet
function readDotEnv() {
  try {
    const env = {}
    for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
      const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
      if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
    return env
  } catch {
    return {}
  }
}

const dotEnv = readDotEnv()
const url =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  dotEnv.VITE_SUPABASE_URL ||
  'https://ogfbsvhmtejqkacnjccp.supabase.co'
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  dotEnv.VITE_SUPABASE_ANON_KEY

if (!anonKey) {
  console.error('Mangler SUPABASE_ANON_KEY i miljøet (eller VITE_SUPABASE_ANON_KEY i .env).')
  process.exit(1)
}

const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/vvs_organizations?select=id&limit=1`
const started = Date.now()

try {
  const res = await fetch(endpoint, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  })
  const ms = Date.now() - started

  if (!res.ok) {
    console.error(`Keepalive fejlede: HTTP ${res.status} efter ${ms} ms`)
    console.error(await res.text())
    process.exit(1)
  }

  const rows = await res.json()
  const count = Array.isArray(rows) ? rows.length : 0
  console.log(`OK: Supabase svarede HTTP ${res.status} på ${ms} ms (${count} række læst) — projektet er vågent.`)
} catch (err) {
  console.error(`Keepalive fejlede: ${err.message}`)
  process.exit(1)
}
