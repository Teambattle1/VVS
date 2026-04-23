# VVS FLOW - Endelig Build Plan (v2)

> **Projekt:** `vvs-tilbud` → `vvs.eventday.dk`
> **Model:** White-label multi-tenant SaaS
> **Tech stack:** React 18 + Vite + Tailwind CSS v3 + Supabase Pro + Netlify
> **Sprog:** Dansk UI (altid)
> **Design:** Moderne, mobile-first, fully responsive
> **Ejer:** Thomas Sunke / TeamBattle Danmark

---

## 🎯 Alle beslutninger truffet

| # | Beslutning | Valg |
|---|---|---|
| 1 | Brugere | Flere montører i felten samtidig |
| 2 | Grundplan-metoder | Alle 4: rektangel, fri tegning, upload, skabeloner |
| 3 | Prismodel | Alle 3: fast pris, timer+materialer, pakke+tillæg |
| 4 | Varedatabase kilde | Grossist-integration (fase 2) |
| 5 | Kundeadgang | Unikt link + valgfri login |
| 6 | Kunde-rettigheder | Se + godkend + kommenter + tilvalg/fravalg |
| 7 | Kunde-info pr. pakke | Fuld pakke: pris, billeder, noter, tidsplan, kontakt |
| 8 | Enheder | Fully responsive (mobil/tablet/desktop) |
| 9 | Pakkeliste | Komplet VVS-branche (se liste) |
| 10 | Tech stack | React + Vite + Supabase + Netlify + Tailwind |
| 11 | Domain | `vvs.eventday.dk` |
| 12 | Database | **Supabase Pro - dedikeret projekt** |
| 13 | Branding | **White-label multi-tenant fra start** |
| 14 | Moms | Vælges pr. kunde/job, vises inkl./ekskl. |
| 15 | Billeder | Lucide-ikoner nu, grossist-billeder senere |
| 16 | Varedatabase start | Manuel - montører bygger organisk |

---

## 1. Formål & Kerneidé

**White-label SaaS for VVS-virksomheder i Danmark.**

Hver VVS-virksomhed får sit eget isolerede setup (organization) hvor deres montører:
1. Opretter et **job** med kunde
2. Tilføjer **rum** (badeværelse, køkken, bryggers, ude m.m.)
3. Tegner/vælger **grundplan** af rummet
4. Placerer **pakker** (toilet, bad, håndvask osv.) visuelt på grundplanen
5. Tilføjer **items** fra egen varedatabase (organisk opbygget)
6. Deler **unikt link** med kunden
7. Kunden ser **live priser**, kan **godkende/afvise/kommentere** og **tilvælge/fravælge** items

Revenue-model: månedligt abonnement pr. VVS-firma (f.eks. 299 kr/md pr. montør).

---

## 2. Multi-tenant arkitektur

**Én Supabase Pro-instans → mange VVS-virksomheder (orgs).**

- Hver organisation har:
  - Eget logo, farver, kontaktinfo (white-label)
  - Egne montører, kunder, jobs, pakker, varer
  - Eget subdomain? (f.eks. `vvskbh.vvs.eventday.dk`) eller blot login-gated
- RLS isolerer alt data pr. `organization_id`
- Super-admin (dig) kan se på tværs

---

## 3. Brugerroller

| Rolle | Scope | Rettigheder |
|---|---|---|
| **Super-admin** (Thomas) | Platform | Alle orgs, fakturering, support |
| **Org-admin** | Én org | Brugere, pakker, varer, priser, alle jobs i org |
| **Montør** | Én org | Opretter/redigerer egne jobs, ser tildelte jobs |
| **Kunde** | Én org (via token) | Se tilbud, godkend, kommenter, tilvælg/fravælg |

**Auth:** Supabase Auth
- Montører: email + password
- Super-admin: magic link
- Org-admin: email + password + 2FA
- Kunde: unikt token i URL, valgfri opgradering til konto

---

## 4. Datamodel (Supabase tabeller - prefix `vvs_`)

```sql
-- Organisationer (white-label tenants)
vvs_organizations (
  id, name, slug (fx 'vvs-kbh'), logo_url,
  primary_color, accent_color,
  contact_email, contact_phone, cvr, address,
  default_hourly_rate, default_markup_percent,
  subscription_tier (trial|basic|pro), subscription_status,
  created_at, updated_at
)

-- Brugere (udover Supabase auth.users)
vvs_users (
  id, user_id FK auth.users, organization_id FK,
  name, role (org_admin|montor), phone, active,
  created_at
)

-- Kunder (pr. organisation)
vvs_customers (
  id, organization_id FK,
  name, email, phone, address, zip, city,
  customer_type (private|business), cvr,
  default_vat_handling (incl|excl|both),
  notes, created_at
)

-- Jobs
vvs_jobs (
  id, organization_id FK, job_number (auto: JOB-2026-0001),
  customer_id FK, title,
  status (draft|sent|approved|rejected|in_progress|done),
  vat_handling (incl|excl|both - arvet fra kunde, kan override),
  total_price_excl_vat, total_price_incl_vat,
  share_token UUID (unikt kundelink),
  assigned_to FK vvs_users, created_by FK vvs_users,
  created_at, updated_at
)

-- Rum i et job
vvs_rooms (
  id, job_id FK, organization_id FK,
  name, room_type (bathroom|kitchen|utility|outdoor|other),
  width_cm, length_cm,
  floorplan_mode (rectangle|freehand|upload|template),
  floorplan_data JSONB, floorplan_image_url,
  sort_order, created_at
)

-- Pakke-skabeloner (standard + org-specifikke)
vvs_package_templates (
  id, organization_id FK (nullable - NULL = global standard),
  name, category, lucide_icon (fx 'ToiletIcon'),
  description, pricing_model (fixed|hourly|package_plus),
  base_price, base_hours, hourly_rate,
  default_items JSONB, image_url,
  active, created_at
)

-- Placerede pakker i et rum
vvs_room_packages (
  id, room_id FK, template_id FK, organization_id FK,
  name, position_x, position_y,
  pricing_model, fixed_price, hours, hourly_rate,
  notes, timeline_text,
  status (draft|approved_by_customer|rejected_by_customer),
  package_total_excl_vat,
  created_at, updated_at
)

-- Varedatabase (pr. organisation)
vvs_items (
  id, organization_id FK,
  sku, name, description, category,
  supplier (manual|sanistaal|brdr_dahl|...),
  supplier_sku, unit (stk|m|kg|...),
  cost_price, sales_price, markup_percent,
  image_url, lucide_fallback_icon,
  created_by FK vvs_users, active,
  last_synced_at, created_at
)

-- Items på en placeret pakke
vvs_package_items (
  id, room_package_id FK, item_id FK, organization_id FK,
  name_snapshot, quantity, unit_price, total_price,
  added_by (montor|customer),
  customer_selected (bool - default true, kunde kan toggle),
  created_at
)

-- Kunde-handlinger (kommentarer, godkendelser, toggles)
vvs_customer_actions (
  id, job_id FK, organization_id FK,
  room_package_id FK (nullable), package_item_id FK (nullable),
  action_type (comment|approve|reject|toggle_item),
  message, customer_name, customer_email,
  created_at
)

-- Aktivitetslog (live feed)
vvs_activity_log (
  id, job_id FK, organization_id FK,
  actor_type (montor|customer|system), actor_name,
  action, details JSONB, created_at
)
```

### RLS policies (kort oversigt)

```sql
-- Alle tabeller: kun samme organization_id
-- Montør: kun egne jobs (assigned_to/created_by)
-- Org-admin: alt i egen org
-- Super-admin: service_role bypass
-- Kunde via share_token: read alt i deres job + write kun til customer_actions
```

---

## 5. Komplet VVS Pakkeliste (global standard seed)

Disse er `organization_id = NULL` (globale). Hver org kan dublere og tilpasse.

### Badeværelse 🚿
- Toilet standard (montering + tilslutning)
- Toilet m/ skjult cisterne
- Bad/brusekabine (med armatur + afløb)
- Badekar (rørføring + tilslutning)
- Håndvask enkelt
- Dobbelt håndvask
- Blandingsbatteri bad
- Blandingsbatteri vask
- Gulvafløb
- Gulvvarme (vådrum)
- Radiator badeværelse
- Ventilation / udsugning

### Køkken 🍳
- Køkkenvask enkelt
- Køkkenvask dobbelt
- Blandingsbatteri køkken
- Opvaskemaskine tilslutning
- Vandfilter under vask

### Bryggers / Vaskerum 🧺
- Vaskemaskine tilslutning
- Tørretumbler (kondens/afløb)
- Udslagsvask
- Gulvafløb bryggers

### Teknikrum ⚙️
- Varmtvandsbeholder udskiftning
- Fjernvarmeunit udskiftning
- Cirkulationspumpe
- Shuntventil
- Ekspansionsbeholder

### Udendørs 🌳
- Udendørs vandhane
- Havevanding / drypslange tilslutning
- Nedløbsrør tilkobling
- Tagbrønd / rendeafløb

### Diverse / Rørarbejde 🔧
- Rørføring pr. meter
- Gennemboring væg
- Dykpumpe
- Rottespærre
- Inspektion med kamera

Hver pakke har: Lucide-ikon, standardpris (sættes af org-admin), pricing_model, standard-items.

---

## 6. Brugerflow

### Onboarding ny VVS-virksomhed (super-admin)
```
Super-admin → [+ Ny organisation]
  → Navn, CVR, kontaktperson, abonnement-tier
  → Inviter første org-admin via email
  → Ny org klonet med globale pakke-skabeloner
```

### Org-admin onboarding
```
Magic-link login → Setup wizard:
  1. Upload logo, vælg farver
  2. Indstil timeløn + standard markup
  3. Inviter montører
  4. Review/rediger pakke-skabeloner
  5. Klar!
```

### Montør-flow (mobil)
```
Login → Dashboard (mine jobs + org-forsidelogo)
  ↓
[+ Nyt job] → Vælg/opret kunde → Job oprettet (JOB-2026-0042)
   → Kundetype: privat/erhverv (bestemmer moms)
  ↓
[+ Tilføj rum] → Vælg rumtype → Vælg grundplan-metode:
   • Rektangel (bredde/længde i cm)
   • Tegn frit (fullscreen canvas, touch)
   • Upload billede (kamera/galleri)
   • Skabelon (standard badeværelse osv.)
  ↓
Grundplan vist → [+ Placer pakke]
   → Pakke-picker filtreret på rumtype
   → Tap på grundplan for at placere
  ↓
Pakke-detalje åbner:
   • Pris-model (fast/timer/pakke+) - forudfyldt fra skabelon
   • Rediger pris/timer/rate
   • [+ Tilføj item] → Søg varedatabase
      → Ikke fundet? [+ Opret ny vare] (tilføjes org's varedatabase)
   • Noter + tidsplan + billeder
  ↓
Tilbage til grundplan → Lucide-ikon m/ delsum-chip på placeringen
  ↓
[Del med kunde] → Genererer unikt link → SMS/email/kopier
```

### Kunde-flow (unikt link)
```
Åbn link → Velkomstside (org-logo, job-nr, montør-navn)
  ↓
Interaktivt grundplan-view (read-only navigation)
   • Tap på pakke-ikon → åbner pakke-detalje sheet
   • Se items, priser (inkl./ekskl. moms), billeder, noter, tidsplan
   • Toggle tilvalg/fravalg pr. item (live sum opdateres)
   • [Kommenter] på pakke eller item
   • [Godkend pakke] / [Afvis pakke]
  ↓
Total-overblik: sum pr. rum + grand total (både inkl./ekskl. moms)
  ↓
[Godkend samlet tilbud] → Signer m/ navn + email → Job låst
  ↓
Valgfri: [Opret konto for historik]
```

### Org-admin flow (desktop)
```
Dashboard → alle jobs i org, filtrér på status/montør
  ↓
Pakke-admin → rediger org's skabeloner (fork af globale)
Vare-admin → manuel oprettelse, CSV-import, (senere) grossist-sync
Bruger-admin → montører + rettigheder
Indstillinger → logo, farver, timeløn, moms-default
Rapporter → konverteringsrate, snitpris, top-pakker, omsætning
```

---

## 7. Nøglefeatures - teknisk

### Grundplan editor
- **Lib:** `react-konva` (Konva.js til React)
- Mode 1: Rektangel → indtast bredde/længde → Konva.Rect med gitter
- Mode 2: Fri tegning → freehand Konva.Line med touch
- Mode 3: Upload → billede som baggrund-layer (Supabase Storage)
- Mode 4: Skabelon → preset Konva.Group
- Pakker = Konva.Group (ikon + label-chip med pris)
- Tap/klik → åbner bottom-sheet (mobil) eller modal (desktop)

### Live updates
**Supabase Realtime** på:
- `vvs_room_packages` (pris/items ændres)
- `vvs_package_items` (kunde toggler)
- `vvs_customer_actions` (kommentarer/godkendelser)
- Aktivitetsfeed i sidebar viser hvem-gjorde-hvad-hvornår

### Varedatabase søgning
- Supabase full-text search på `name`, `sku`, `category`
- Debounced input (300ms)
- "Ikke fundet? + Opret ny" knap → inline modal
- Nye varer gemmes i org's database automatisk

### Moms-beregning
- Kunde har `customer_type` (privat/erhverv) og `default_vat_handling`
- Job arver, kan overrides
- Alle priser gemmes **ekskl. moms** i DB
- UI viser begge felter når `vat_handling = both`
- Dansk moms: 25%

### Unikt kundelink
- `share_token` UUID genereres ved job-oprettelse
- URL: `/k/{share_token}`
- Supabase RLS policy matcher token via custom JWT claim eller edge function
- Valgfri konto-opgradering kobler `vvs_customers.user_id`

### PDF-eksport
- `@react-pdf/renderer`
- Inkluderer grundplan-snapshot (Konva → PNG → PDF)
- Org-logo øverst, kundeinfo, alle pakker, total, vilkår

### White-label theming
- Org-farver injiceres som CSS custom properties ved login
- Logo vises i header + PDF + kundeportal
- (Fase 7: custom subdomains)

---

## 8. UI Design retning

**Moderne, rent, professionelt - bygger tillid hos slutkunden.**

- **Farver (default, overrides pr. org):**
  - Primær: `#0EA5E9` (VVS-blå, vand-association)
  - Accent: `#F59E0B` (rav, CTA'er)
  - Neutral: slate-50 til slate-900
  - Status: grøn (godkendt), rød (afvist), gul (pending)
- **Fonts:** `Manrope` (display + body)
- **Komponenter:** `rounded-2xl`, `shadow-sm`, generøs padding
- **Ikoner:** `lucide-react` (konsistent med dine andre projekter)
- **Mobil:** bottom nav (Jobs / Kunder / Katalog / Mig), store tap-targets (min 44px)
- **Grundplan:** lyst gitter-baggrund, farvede pakke-ikoner med label-chips
- **Kunde-portal:** endnu renere, mindre UI-støj, fokus på pris + godkend-knap

---

## 9. Projektstruktur

```
vvs-tilbud/
├── CLAUDE.md                    # projekt-instruktioner
├── PLAN.md                      # denne fil
├── package.json
├── vite.config.js               # server: { open: true }
├── tailwind.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── routes.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── auth.js
│   │   ├── pricing.js           # moms + beregning
│   │   └── theme.js             # white-label theming
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── OrgContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── JobDetail.jsx
│   │   ├── RoomEditor.jsx       # Konva-canvas
│   │   ├── CustomerPortal.jsx   # /k/:token
│   │   ├── Onboarding.jsx
│   │   ├── admin/
│   │   │   ├── Packages.jsx
│   │   │   ├── Items.jsx
│   │   │   ├── Users.jsx
│   │   │   └── Settings.jsx
│   │   └── superadmin/
│   │       └── Organizations.jsx
│   ├── components/
│   │   ├── FloorplanCanvas.jsx
│   │   ├── PackagePicker.jsx
│   │   ├── PackageDetail.jsx
│   │   ├── ItemSearch.jsx
│   │   ├── PriceSummary.jsx
│   │   ├── VatToggle.jsx
│   │   ├── ActivityFeed.jsx
│   │   └── ui/
│   ├── hooks/
│   │   ├── useJob.js
│   │   ├── useRealtime.js
│   │   ├── useAuth.js
│   │   └── useOrg.js
│   └── styles/
│       └── index.css
├── supabase/
│   ├── migrations/
│   └── seed.sql                 # globale pakker (organization_id=NULL)
└── README.md
```

---

## 10. Udviklingsfaser (TODO-roadmap)

### 🟢 Fase 1 - Foundation (uge 1-2)
- [ ] `npx vite` setup + Tailwind + Supabase klient
- [ ] Database schema + RLS policies
- [ ] Seed data: globale pakker
- [ ] Auth: login/logout (montør + org-admin)
- [ ] Multi-tenant context (OrgContext)
- [ ] Dashboard: liste af jobs
- [ ] Opret job + kunde-info (moms-type)

### 🟡 Fase 2 - Core editor (uge 3-4)
- [ ] Tilføj rum (rektangel mode først)
- [ ] Konva grundplan-canvas
- [ ] Pakke-picker (fra org's templates)
- [ ] Placer pakke på grundplan
- [ ] Pakke-detalje sheet (pris, noter, tidsplan)
- [ ] Varedatabase søgning + tilføj item
- [ ] + Opret ny vare inline
- [ ] Beregning: sum pr. pakke / rum / job (inkl./ekskl. moms)
- [ ] Responsiv mobile-first styling

### 🟠 Fase 3 - Kundeportal (uge 5)
- [ ] Unikt link (share_token + /k/:token route)
- [ ] Kunde-view af grundplan (read-only)
- [ ] Pakke-detalje for kunde (billeder, noter, tidsplan)
- [ ] Tilvalg/fravalg items (toggle)
- [ ] Kommentar-funktion
- [ ] Godkend/afvis pakke + samlet tilbud
- [ ] Supabase Realtime sync

### 🔵 Fase 4 - Grundplan udvidelser (uge 6)
- [ ] Fri tegning mode (touch)
- [ ] Upload billede som baggrund
- [ ] Skabelon-bibliotek (std badeværelse osv.)
- [ ] Lucide-ikon-mapping for hver pakke-kategori

### 🟣 Fase 5 - Admin & data (uge 7-8)
- [ ] Org-admin panel: pakke-skabeloner CRUD
- [ ] Item CRUD + CSV-import
- [ ] Bruger-admin
- [ ] Org-indstillinger (logo, farver, timeløn)
- [ ] Aktivitetslog-view
- [ ] PDF-eksport af tilbud

### 🟤 Fase 6 - Super-admin & onboarding (uge 9)
- [ ] Super-admin panel: opret organisationer
- [ ] Org-onboarding wizard
- [ ] Invitation-flow (email)
- [ ] Abonnement-status tracking

### ⚪ Fase 7 - Polish & deploy (uge 10)
- [ ] Notifikationer (email/SMS ved kunde-action)
- [ ] Onboarding/tutorial for montør
- [ ] Error handling + loading states
- [ ] Netlify deploy
- [ ] DNS: `vvs.eventday.dk` via Simply.com
- [ ] (Senere) custom subdomains pr. org

### 🔮 Fase 8 - Fremtid
- [ ] Grossist API-integration (Sanistaal/Brdr. Dahl)
- [ ] Kunde-login + historik
- [ ] E-conomic / Billy fakturering
- [ ] MitID signatur
- [ ] Foto-dokumentation under udførelse
- [ ] Stripe billing for abonnementer

---

## 11. CLAUDE.md (læg i projekt-root)

```markdown
# VVS Tilbudssystem - Claude Code instruktioner

## Projekt
White-label SaaS til danske VVS-virksomheder: multi-tenant webapp hvor
montører opretter jobs, tegner grundplan, placerer pakker, beregner pris,
og deler med kunde via unikt link med live updates.

## Tech stack
- React 18 + Vite (start altid med `npx vite`, konfigurer `server: { open: true }`)
- Tailwind CSS v3 (IKKE v4)
- Supabase Pro - dedikeret projekt (auth, DB, realtime, storage)
- react-konva (grundplan canvas)
- lucide-react (ikoner)
- React Router
- @react-pdf/renderer (PDF-eksport)
- Netlify deploy

## Coding preferences
- Funktionelle React komponenter med hooks
- Ingen inline styles - kun Tailwind
- Dansk UI-tekst altid
- Mock-first: byg UI med mock data, så Supabase
- Mobile-first responsive
- Filnavne: PascalCase komponenter, camelCase hooks/utils
- Alle DB-queries skal respektere organization_id (multi-tenant)

## Multi-tenant regler
- Hver tabel (undtagen globale templates) har organization_id
- OrgContext wrapper alle authed routes
- RLS håndhæver isolation i Supabase
- Super-admin bruger service_role nøgle (kun i edge functions)

## Moms
- Alle priser gemmes EKSKL. moms i database
- Dansk moms = 25%
- UI viser inkl./ekskl. baseret på job.vat_handling
- Kunde arver moms fra customer.default, job kan override

## Git / Deploy
- ALDRIG `git push` uden eksplicit besked fra Thomas
- ALDRIG deploy til Netlify uden eksplicit besked
- Commit lokalt ofte med beskrivende beskeder

## Database
- Supabase projekt: [indsæt URL efter oprettelse]
- Alle tabeller prefixet `vvs_`
- RLS aktiveret på alle tabeller
- Migrations i `supabase/migrations/`
- Seed data (globale pakker) i `supabase/seed.sql`

## Design
- Farver default: primær #0EA5E9, accent #F59E0B
- Org-farver overrides via CSS variables
- Font: Manrope
- Komponenter: rounded-2xl, shadow-sm
- Bottom nav på mobil (min 44px tap-targets)
```

---

## 12. Første prompt til Claude Code

Efter du har oprettet:
1. Nyt GitHub repo `vvs-tilbud` under `teambattle1`
2. Nyt Supabase Pro projekt
3. Lagt `PLAN.md` + `CLAUDE.md` i projekt-root

Kør denne prompt:

> "Læs PLAN.md og CLAUDE.md grundigt.
>
> Start Fase 1:
> 1. Setup Vite + Tailwind v3 + React Router
> 2. Installer: @supabase/supabase-js, react-konva, lucide-react, @react-pdf/renderer
> 3. Opret mappestrukturen fra PLAN.md sektion 9
> 4. Lav SQL migration med alle tabeller fra PLAN.md sektion 4
> 5. Lav seed.sql med de globale pakker fra PLAN.md sektion 5
> 6. Byg en simpel Login-side og Dashboard-side med mock data (3 eksempel-jobs)
> 7. Opret OrgContext og AuthContext (uden Supabase-integration endnu - mock)
>
> Vis progress som TODO-checkbokse efter hvert trin.
> Spørg mig inden du commit'er.
> Intet git push. Intet deploy."

---

## 13. Næste praktiske skridt (i rækkefølge)

1. **Opret nyt Supabase Pro projekt** → gem URL + anon key + service_role key
2. **Opret GitHub repo** `teambattle1/vvs-tilbud` (privat)
3. **Clone til** `C:\Users\ThomasSunke\Github\vvs-tilbud\`
4. **Læg** `PLAN.md` + `CLAUDE.md` i root
5. **Åbn Claude Code**, kør prompten fra sektion 12
6. **Efter Fase 1**: Netlify-projekt oprettes, connect til repo (men ingen deploy endnu)
7. **Efter Fase 7**: DNS `vvs.eventday.dk` sættes op i Simply.com

---

**Status: klar til at starte Claude Code. 🚀**
