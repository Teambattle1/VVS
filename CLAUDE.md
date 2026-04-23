# VVS FLOW - Claude Code instruktioner

## Projekt

White-label SaaS til danske VVS-virksomheder: multi-tenant webapp hvor montører opretter jobs, tegner grundplan, placerer pakker (toilet, bad, håndvask m.m.), beregner pris, og deler med kunde via unikt link med live updates. Kunden kan se tilbud, godkende, kommentere og tilvælge/fravælge items - alt live synkroniseret tilbage til montøren.

**Domain:** `vvs.eventday.dk`
**Ejer:** Thomas Sunke / TeamBattle Danmark
**Repo:** `teambattle1/vvs-tilbud`

## Tech stack

- **React 18 + Vite** - start altid med `npx vite`, konfigurer `server: { open: true }` i `vite.config.js`
- **Tailwind CSS v3** (IKKE v4 - v3 er det kendte setup)
- **Supabase Pro** - dedikeret projekt (auth, DB, realtime, storage)
- **react-konva** - grundplan canvas med touch support
- **lucide-react** - ikoner (konsistent med øvrige Thomas-projekter)
- **react-router-dom** - routing
- **@react-pdf/renderer** - PDF-eksport af tilbud
- **Netlify** - deploy target

## Coding preferences

- Funktionelle React komponenter med hooks (ingen class components)
- Ingen inline styles - kun Tailwind utility-klasser
- **Dansk UI-tekst altid** - alle labels, knapper, fejlbeskeder på dansk
- Mock-first udvikling: byg UI med mock data først, så integrér Supabase
- Mobile-first responsive design
- Filnavne: PascalCase for komponenter, camelCase for hooks/utils
- Brug `clsx` eller `tailwind-merge` til conditional classes
- Alle DB-queries skal respektere `organization_id` (multi-tenant isolation)

## Multi-tenant regler (KRITISK)

Dette er en white-label SaaS. Hver VVS-virksomhed er en "organization" med fuldt isoleret data.

- Hver tabel (undtagen globale pakke-skabeloner) har `organization_id` kolonne
- `OrgContext` wrapper alle authed routes og eksponerer nuværende org
- Alle Supabase-queries skal filtrere på `organization_id`
- RLS policies håndhæver isolation på DB-niveau (safety net)
- Super-admin (Thomas) bruger service_role nøgle, kun i edge functions
- Globale pakke-skabeloner har `organization_id = NULL` - kan kopieres til org's egen liste

## Moms-håndtering

- Alle priser gemmes **EKSKL. moms** i database
- Dansk moms = 25%
- `vvs_customers.default_vat_handling` sættes ved oprettelse (`incl` | `excl` | `both`)
- `vvs_jobs.vat_handling` arver fra kunde, kan overrides pr. job
- UI viser felter baseret på `vat_handling`:
  - `incl`: kun inkl. moms
  - `excl`: kun ekskl. moms
  - `both`: begge side om side
- Kunde-type (`private` | `business`) sættes på kunden, påvirker default

## Design

- **Farver default:** primær `#0EA5E9` (VVS-blå), accent `#F59E0B` (rav)
- **Org-farver** overrides via CSS custom properties når org loader
- **Font:** Manrope (Google Fonts)
- **Komponenter:** `rounded-2xl`, `shadow-sm`, generøs padding
- **Tap-targets:** min 44px på mobil
- **Mobil nav:** bottom nav (Jobs / Kunder / Katalog / Mig)
- **Ikoner:** lucide-react - aldrig emoji i UI

## Database

- **Supabase projekt-ID:** `ogfbsvhmtejqkacnjccp`
- **Supabase URL:** `https://ogfbsvhmtejqkacnjccp.supabase.co`
- **Anon key:** i `.env` som `VITE_SUPABASE_ANON_KEY` (hentes fra Supabase dashboard → Settings → API)
- **Service role key:** KUN i edge functions, aldrig i frontend
- **Alle tabeller prefixet:** `vvs_`
- **RLS aktiveret** på alle tabeller uden undtagelse
- **Migrations** i `supabase/migrations/` - navngiv `YYYYMMDDHHMMSS_description.sql`
- **Seed data** (globale pakker) i `supabase/seed.sql`

### Tabeller (se PLAN.md sektion 4 for fulde schemas)

- `vvs_organizations` - tenants
- `vvs_users` - montører + org-admins
- `vvs_customers` - kunder pr. org
- `vvs_jobs` - sager
- `vvs_rooms` - rum i et job
- `vvs_package_templates` - skabeloner (globale + org-specifikke)
- `vvs_room_packages` - placerede pakker
- `vvs_items` - varedatabase pr. org
- `vvs_package_items` - items tilføjet til pakker
- `vvs_customer_actions` - kommentarer, godkendelser, toggles
- `vvs_activity_log` - live feed

## Git workflow (VIGTIGT)

- **ALDRIG `git push`** uden eksplicit besked fra Thomas
- **ALDRIG deploy til Netlify** uden eksplicit besked fra Thomas
- Commit lokalt ofte med beskrivende beskeder
- Commit-format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` + kort beskrivelse
- Brug feature branches til større features

## Kommunikation med Thomas

- Thomas er **UI/UX ekspert** - ikke udvikler. Undgå dybe kode-forklaringer.
- Vis **progress som TODO-checkbokse** efter hvert trin
- Thomas foretrækker **dansk** i beskeder og UI
- Spørg én ting ad gangen når afklaringer er nødvendige
- Moderne, visuelt feedback > lange tekstforklaringer

## Grundplan editor (Konva)

- Mode 1: **Rektangel** - indtast bredde/længde i cm → Konva.Rect med gitter
- Mode 2: **Fri tegning** - freehand Konva.Line med touch/mus
- Mode 3: **Upload** - billede som baggrund-layer (Supabase Storage)
- Mode 4: **Skabelon** - preset Konva.Group (std badeværelse, std køkken, osv.)
- Pakker = Konva.Group med Lucide-ikon + label-chip med delsum
- Tap/klik på pakke → åbner bottom-sheet (mobil) / modal (desktop)

## Live updates (Supabase Realtime)

Abonnér på ændringer på:
- `vvs_room_packages` - pris/items ændret af montør eller kunde
- `vvs_package_items` - kunde toggler tilvalg/fravalg
- `vvs_customer_actions` - nye kommentarer/godkendelser

Opdatér UI optimistisk, reconcil med server-state ved modtagelse.

## Kunde-portal (unikt link)

- URL-mønster: `/k/:share_token`
- Ingen auth krævet - `share_token` er UUID
- Supabase RLS policy matcher token via edge function eller custom JWT
- Kunde kan: se, kommentere, toggle items, godkende/afvise
- Efter godkendelse af samlet tilbud: job låses, ingen flere ændringer
- Valgfri opgradering til konto kobler `vvs_customers.user_id`

## Prismodeller (pr. pakke)

- `fixed`: fast pris uanset timer
- `hourly`: timer × timeløn + items
- `package_plus`: grundpakke-pris + mulighed for ekstra items

Hver `vvs_package_template` har en default, men montør kan ændre pr. placeret pakke.

## Status-flow

**Job statuses:** `draft` → `sent` → `approved` / `rejected` → `in_progress` → `done`

**Pakke statuses:** `draft` → `approved_by_customer` / `rejected_by_customer`

## Miljøvariabler (.env)

```
VITE_SUPABASE_URL=https://ogfbsvhmtejqkacnjccp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Service role key bruges KUN i edge functions - aldrig i frontend.

## Skal gennemlæses før start

- `PLAN.md` - komplet build plan (datamodel, flows, faser)
- Denne fil - coding rules
