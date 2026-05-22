# VVS FLOW

White-label SaaS til danske VVS-virksomheder. Multi-tenant webapp hvor montører opretter jobs, tegner grundplan, placerer pakker (toilet, bad, håndvask m.m.), beregner pris, og deler med kunde via unikt link med live updates.

## 📖 Dokumentation

- [`PLAN.md`](./PLAN.md) - Komplet build plan (datamodel, flows, udviklingsfaser)
- [`CLAUDE.md`](./CLAUDE.md) - Instruktioner til Claude Code (coding rules, arkitektur)
- [`EXTERNAL-SYSTEMS.md`](./EXTERNAL-SYSTEMS.md) - Eksterne integrationer (CVR, Resend, e-conomic m.m.)

## 🛠 Tech stack

- React 18 + Vite
- Tailwind CSS v3
- Supabase Pro (auth, DB, realtime, storage)
- react-konva (grundplan editor)
- lucide-react (ikoner)
- Netlify (deploy)

## 🚀 Kom i gang

```bash
npm install
npm run dev         # vite dev server på :5173
```

Andre scripts:

```bash
npm run build       # produktions-build til dist/ (det Netlify deployer)
npm run preview     # serv produktions-build lokalt
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (checkJs på JSDoc + inferens)
npm run e2e         # Playwright smoke-tests
```

Konfigurer Supabase ved at kopiere `.env.example` til `.env` og udfylde `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Uden disse falder appen tilbage til mock-data.

## 🌐 Domain

`vvs.eventday.dk` (deploys fra `main` branch via Netlify)

## 👤 Ejer

Thomas Sunke / TeamBattle Danmark
