# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

**Single-tenant webapp** til ÉT specifikt dansk VVS-firma. Montører opretter jobs, tegner grundplan, placerer pakker (toilet, bad, håndvask m.m.), beregner pris, og deler med kunde via unikt link med live updates. Kunden kan se tilbud, godkende, kommentere og tilvælge/fravælge items - alt live synkroniseret tilbage til montøren.

**Vigtigt:** Appen er IKKE et multi-tenant SaaS. Der er ét firma — der findes ingen org-switcher, ingen super-admin, ingen mulighed for at oprette flere firmaer. Der må aldrig genintroduceres multi-tenant UI eller flows.

**Domain:** `vvs.eventday.dk`
**Ejer:** Thomas Sunke / TeamBattle Danmark
**Repo:** `Teambattle1/VVS`

## Tech stack

- **React 18 + Vite** - start altid med `npx vite`, konfigurer `server: { open: true }` i `vite.config.js`
- **Tailwind CSS v3** (IKKE v4 - v3 er det kendte setup)
- **Supabase Pro** - dedikeret projekt (auth, DB, realtime, storage)
- **react-konva** - grundplan canvas med touch support
- **lucide-react** - ikoner (konsistent med øvrige Thomas-projekter)
- **react-router-dom** - routing
- **@react-pdf/renderer** - PDF-eksport af tilbud
- **Netlify** - deploy target

## Kommandoer

```
npm install              # install deps
npm run dev              # vite dev server på :5173 (åbner browser pga server.open i vite.config.js)
npm run build            # vite build → dist/ (det Netlify deployer)
npm run preview          # serv produktions-build lokalt
npm run lint             # ESLint (flat config i eslint.config.js)
npm run lint:fix         # ESLint med --fix
npm run typecheck        # tsc --noEmit med checkJs på src/**/*.js (lib-filer)
npm run e2e              # Playwright smoke tests (på port 7173 for at undgå
                         # konflikt med andre TeamBattle-projekter på :5173)
npm run e2e:ui           # Playwright UI mode (interaktiv debug)
```

Netlify kører selv `npm run build` (se `netlify.toml`), men kør **build + lint + typecheck + e2e** lokalt før push for at fange fejl tidligt — en fejlet deploy støjer i loggen.

**Lint-baseline:** 0 errors, ~26 warnings (mest react-hooks v7 strikse regler + unused vars). Warnings blokerer ikke push; skærp `eslint.config.js` når kodebasen er ryddet op.

**Typecheck-scope:** kun `src/**/*.js` (libs). JSX-komponenter er udeladt fordi TypeScript-inferens på React-props (specielt `key`) producerer for mange false positives. Tilføj JSDoc `@param`-types på lib-funktioner når der pakkes felter ind (se `jobsRepo.createCustomer` for mønster).

**E2E-port:** Playwright bruger 7173, ikke 5173, fordi flere TeamBattle-projekter kører Vite på :5173 lokalt. `reuseExistingServer: true` ville ellers connecte til det forkerte projekt.

**Netlify-gotcha:** `netlify.toml` returnerer bevidst 404 på ukendte `/assets/*` i stedet for SPA-fallback. Hvis en hashed asset mangler efter deploy, ses det som "JS module script fejler" — ikke en hvid side med React-routing.

## Arkitektur (high-level)

### Provider-chain (src/App.jsx)
Hele appen wrappes i denne rækkefølge — vigtigt at bevare når nye providers tilføjes, fordi `JobsContext` læser `useAuth()` og `useOrg()`:

```
ErrorBoundary > ThemeProvider > ToastProvider > AuthProvider
  > CustomerAuthProvider > OrgProvider > JobsProvider > AppRoutes
```

`SplashScreen` overlejrer ved første load; `WhatsNewGate` viser changelog-dialog efter splash.

### Dual-mode: mock vs Supabase (KRITISK at forstå)
Alle context-providers og repo-funktioner detekterer `hasSupabase` (eksporteret fra `src/lib/supabase.js`). Hvis env-vars mangler eller er ugyldige, falder hele appen tilbage til mock-data fra `src/lib/mock*.js` med localStorage-persistens.

**ID-præfikser signalerer mock vs DB:**
- Mock-IDs har præfiks: `job-`, `room-`, `pkg-`, `pi-`, `i-`, `u-`, `org-mock`, `rtpl-`, `t-`
- DB-IDs er rigtige UUIDs (regex `^[0-9a-f]{8}-[0-9a-f]{4}-...$`)
- Mock-org'ens id er specifikt `org-mock-1`. Repo-funktioner tjekker eksplicit på den værdi og springer Supabase-writes over, så vi undgår console-støj når mock-brugere logger ind mod en ufuldstændig DB.

Repo-funktioner i `JobsContext` følger mønsteret: optimistisk lokal mutation → hvis `hasSupabase && orgId && !id.startsWith('mock-prefix')` så persistér til DB → ved success refetch via `refresh()`. **Bryd ikke dette mønster** — det holder UI'et responsivt og lader appen virke uden Supabase under udvikling.

De faktiske DB-implementeringer (insert/update/delete + JOIN-fetches) ligger i [src/lib/jobsRepo.js](src/lib/jobsRepo.js). `JobsContext` orkestrerer; `jobsRepo` rører Supabase.

### Auth: to login-stier
`AuthContext.signIn` prøver først **demo-team login** mod DB-viewet `vvs_login_candidates` (kræver migrations `20260424120000_team_persist` + `20260424130000_login_view_with_org`). Demo-brugere findes ikke i `auth.users` — de gemmes i localStorage som `vvs.mockAuth` og bærer hele `organization`-objektet med sig (så `OrgContext` undgår RLS-blokerede queries). Først ved miss falder vi tilbage til ægte `supabase.auth.signInWithPassword`.

Konsekvens: Når der kodes auth-relateret, husk at `user.organization_id` og `user.organization` kan komme direkte fra demo-login og IKKE fra `vvs_users`-opslag.

### OrgContext (single-tenant)
- `OrgContext` indlæser det FØRSTE firma fra `vvs_organizations` ved login. Hvis tabellen er tom, oprettes automatisk et default-firma så Settings kan bruges til at udfylde resten.
- Demo-login medbringer `user.organization` direkte fra `tryDemoTeamLogin` — den bruges som genvej (RLS blokerer ofte direkte tabel-opslag).
- Hvis Supabase ikke kører, falder `OrgContext` tilbage til `MOCK_ORG` (første entry i `INITIAL_ORGS`).
- Org-tema (`primary_color`, `accent_color`) injiceres som CSS custom properties (`--brand-primary`, `--brand-accent`) på `document.documentElement` — derfor bruger `tailwind.config.js` `var(--brand-primary, #0EA5E9)` for `brand`-farven.
- Eksponerer kun `org`, `setOrg`, `updateOrg`, `team`, `addTeamMember`, `updateTeamMember`, `removeTeamMember`. Ingen `homeOrgId`, `allOrgs`, `switchActiveOrg`, `addOrg`, `isSuperAdmin` — multi-tenant koncepter er bevidst fjernet.

### Routing (src/routes.jsx)
- Tunge ruter (Konva, react-pdf) lazy-loadet
- Public: `/k/:token` (kunde-portal, kun share_token), `/kunde/login`, `/kunde` (CustomerHistory)
- Auth-protected montør-ruter: `/` (Dashboard), `/jobs/new`, `/jobs/:jobId`, `/jobs/:jobId/rooms/:roomId`
- Auth-protected admin-ruter (under `AdminLayout`): `/admin/packages`, `/admin/items`, `/admin/users`, `/admin/activity`, `/admin/settings`, `/admin/integrations`. `/admin` redirecter til `/admin/packages`.
- `ProtectedRoute` redirect'er til `/login` hvis ingen user; `PublicOnlyRoute` redirect'er auth'ede brugere væk fra `/login`
- **Fjernede ruter:** `/super` (SuperAdmin Organizations) og `/onboarding` (org-create wizard) — single-tenant har ikke brug for dem.

## Coding preferences

- Funktionelle React komponenter med hooks (ingen class components)
- Ingen inline styles - kun Tailwind utility-klasser
- **Dansk UI-tekst altid** - alle labels, knapper, fejlbeskeder på dansk
- Mock-first udvikling: byg UI med mock data først, så integrér Supabase
- Mobile-first responsive design
- Filnavne: PascalCase for komponenter, camelCase for hooks/utils
- Brug `clsx` eller `tailwind-merge` til conditional classes
- Alle DB-queries skal respektere `organization_id` (multi-tenant isolation)

## Single-tenant regler (KRITISK)

Appen er bygget til ÉT firma — der findes ingen multi-tenant UI eller flows.

- `vvs_organizations`-tabellen indeholder typisk ét firma. `OrgContext` bruger den første row eller opretter en default hvis tom.
- `organization_id`-kolonner findes stadig på `vvs_*`-tabellerne (DB-artefakt fra tidligere multi-tenant arkitektur). Sat til den ene org's id.
- `RLS`-policies bibeholdes som DB-niveau isolation (safety net), men de blokerer ikke noget UI-flow i practice.
- Globale pakke-skabeloner har `organization_id = NULL` - kan kopieres til org's egen liste.
- **Genintroducér ALDRIG** org-switcher, super-admin, "opret nyt firma"-flows eller multi-org listing UI — appen er specifikt lavet til ét firma og må aldrig breddes ud til andre.

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
- **Migrations** i `supabase/migrations/` - navngiv `YYYYMMDDHHMMSS_description.sql`. Pt. 5 migrationer: init-schema, `team_persist`, `login_view_with_org` (de to demo-team migrationer fra auth-afsnittet), `single_tenant_seed` (seeder ét firma + 5 brugere), og `loosen_rls_all_tables` (åbner RLS på `vvs_*`-datatabeller fordi appen er single-tenant). Let at læse hele DB-state i ét hug.
- **Seed data** (globale pakker) i `supabase/seed.sql`
- **Edge functions er IKKE implementeret endnu** — der er ingen `supabase/functions/`-mappe. Steder hvor docs nævner "edge function" (kunde-portal RLS via `share_token`, service role-handlinger) er forward-looking; pt. løses `share_token`-adgang via DB-policy direkte.

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
- `EXTERNAL-SYSTEMS.md` - integrationer (CVR-lookup, Resend, e-conomic m.m.)
- Denne fil - coding rules + arkitektur

## URL-tilstand: nuqs som standard

Brug **nuqs** som standardvalg til al "URL-værdig" tilstand i alle projekter
(React + Vite / React Router). Wrap app'en i den rette NuqsAdapter.

✅ BRUG nuqs til: filtre, faner, søgeord, paginering, valgt element, wizard-trin
   → så links kan deles/bogmærkes, tilbage-knappen virker, og reload bevarer tilstanden.

❌ BRUG IKKE nuqs til:
   - Flygtig UI-tilstand (åben menu, hover, uafsendt formular) → lokal state (useState).
   - Server-data (Supabase) → dataLaget/React Query, ikke URL.
   - Følsomme data → ALDRIG i URL'en (logges/deles = privacy-fælde).
   - Realtids/tunge data (fx GPS-spillets live-position, svar, billeder, videoklip)
     → gentagne URL-opdateringer giver performance-problemer. Hold det ude af URL'en.

Tommelfinger: skal tilstanden kunne deles via et link og overleve en reload?
→ nuqs. Ellers ikke.

## Datahentning fra Supabase

Hent ALTID data gennem et data-lag (TanStack/React Query) — aldrig løse fetch-kald
spredt i komponenterne. Det giver caching, automatisk genhentning og ét sted at rette.

✅ ALTID:
   - Vis tydelig loading- OG fejl-tilstand. Intet må "hænge" uden feedback til brugeren.
   - Hent kun de kolonner/rækker der bruges (undgå SELECT *), og undgå N+1 (hent i ét kald).
   - Stol på RLS som sikkerhedslag — filtrér ikke kun i frontend.
   - Brug realtime/subscriptions sparsomt — kun hvor live-opdatering giver reel værdi.

❌ ALDRIG:
   - Læg forretningslogik/adgangskontrol i frontend alene.
   - Hent hele tabeller for at filtrere i browseren.

Tommelfinger: én kilde til data (query-laget), tydelige tilstande, mindst mulig data hentet.

## Communication rules (IMPORTANT)

- **Never paste raw bot or webhook content into chat.** This applies to
  deploy bots (Netlify, Vercel, etc.), GitHub event payloads, CI logs, and
  API responses: do not echo raw JSON, escaped HTML, hidden HTML comments,
  or markdown tables verbatim.
- Summarize such content in one or two plain sentences with at most the one
  or two relevant links, e.g. "Netlify deploy preview is ready: <URL>".
- Keep chat replies short and human-readable; the user often reads them on a
  phone.
- Do not subscribe to pull-request activity (`subscribe_pr_activity`) unless
  the user explicitly asks for PR monitoring: the raw GitHub/Netlify event
  notifications are rendered verbatim in the chat, which is exactly the
  noise these rules exist to prevent. To follow up on a PR, use a quiet
  scheduled check-in (e.g. `send_later`) instead.

## Task tracking (IMPORTANT)

- At the start of every session, create a todo list from the user's requests
  (use the task/todo tools): one item per thing the user asks for.
- Update the list as work proceeds — mark items in progress when started and
  completed as each fix lands — so the user can always see current status.
- When the user adds new requests mid-session, add them to the list
  immediately; never leave the list stale.
