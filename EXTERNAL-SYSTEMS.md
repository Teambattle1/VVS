# VVS FLOW — Ekstern-systems checklist

> **Formål:** Denne fil lister alle eksterne systemer, nøgler og handlinger der skal
> ordnes MANUELT før VVS FLOW er klar til rigtige kunder.
>
> Koden er mock-first færdig. Hver sektion nedenfor beskriver hvad der er stubbet i koden,
> hvad du skal tilføje udefra, og hvor nøglerne skal indsættes.
>
> **Status-ikoner:**
> - ☐ = skal gøres af dig (manuel handling)
> - ⚙️ = scaffolding klar i koden; aktiveres automatisk når env-vars er sat
> - 📄 = kode-filer du skal åbne / opdatere bagefter

---

## 1. Supabase (KRITISK — alt andet afhænger af det)

### 1.1 Opret dedikeret Supabase Pro projekt

☐ **Opret projektet** via [supabase.com/dashboard](https://supabase.com/dashboard)
- Navn: `vvs-flow` eller `vvs-eventday`
- Region: **Stockholm (eu-north-1)** (tættest på DK)
- Plan: **Pro** (Realtime + bedre performance)

☐ **Notér følgende værdier** (findes under Settings → API):
- `Project URL` — fx `https://abcdefghijkl.supabase.co`
- `anon public` (publishable) — starter med `eyJ…` eller `sb_publishable_…`
- `service_role` (HEMMELIG — kun til edge functions, må ALDRIG commites)

### 1.2 Indsæt nøgler i `.env`

📄 `.env` (opret i projekt-root — er i `.gitignore`, committes IKKE):

```bash
VITE_SUPABASE_URL=https://DIT-PROJEKT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Koden tjekker automatisk om de er sat ([src/lib/supabase.js](src/lib/supabase.js)) og aktiverer Supabase-kald via `hasSupabase`.

### 1.3 Kør database migration

☐ Åbn Supabase dashboard → SQL Editor → Ny query

☐ Kopier hele indholdet af [supabase/migrations/20260423120000_init_vvs_schema.sql](supabase/migrations/20260423120000_init_vvs_schema.sql) og kør.

Det opretter:
- 11 `vvs_*` tabeller med RLS policies
- Helper-functions: `vvs_current_org_id()`, `vvs_current_role()`
- updated_at triggers

### 1.4 Kør seed data

☐ I samme SQL Editor → ny query → kopier [supabase/seed.sql](supabase/seed.sql) → kør.

Det indsætter **36 globale pakke-skabeloner** (`organization_id = NULL`) som hver org kan klone til egne.

### 1.5 Opret første super-admin (dig)

☐ Supabase Dashboard → Authentication → Users → **Add user**
- Email: din email
- Password: noget stærkt
- Auto confirm: ☑️

☐ Kør i SQL Editor (udskift `<din-auth-user-id>` med UUID'et fra ovenfor):

```sql
-- Opret en super-admin org (placeholder)
insert into public.vvs_organizations (name, slug, subscription_tier)
values ('VVS FLOW Platform', 'platform', 'pro')
returning id;

-- Kobl dig som super_admin
insert into public.vvs_users (user_id, organization_id, name, role)
values ('<din-auth-user-id>', '<org-id-fra-ovenfor>', 'Thomas Sunke', 'super_admin');
```

### 1.6 Deploy edge functions

Alle edge functions bor i `supabase/functions/` (oprettes næste gang).
Installer Supabase CLI: `npm i -g supabase`

#### a) `ef-send-email` (Resend wrapper)

📄 Scaffold allerede i koden — kaldes fra [src/lib/notifications.js](src/lib/notifications.js).

☐ Opret `supabase/functions/ef-send-email/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  const { to, subject, html, text, from } = await req.json()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  })
  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
})
```

☐ Deploy: `supabase functions deploy ef-send-email --project-ref DIT-PROJEKT-ID`

☐ Sæt secret: `supabase secrets set RESEND_API_KEY=re_XXXXXXXX --project-ref DIT-PROJEKT-ID`

#### b) `ef-send-sms` (CPSMS wrapper — NY)

☐ Opret `supabase/functions/ef-send-sms/index.ts` (se eksempel i [docs/edge-functions.md](docs/edge-functions.md) når den laves).

☐ Deploy + secret: `CPSMS_API_KEY`

#### c) `ef-verify-code` (4-cifret login)

📄 Planlagt men ikke brugt endnu — skal oprettes hvis kunder skal have engangskode i stedet for password.

---

## 2. Resend (email)

☐ **Opret konto** på [resend.com](https://resend.com) — gratis op til 100 emails/dag

☐ **Verificer domænet** `vvs.eventday.dk` eller `eventday.dk`:
- Tilføj DNS-records som Resend viser (TXT + MX + DKIM) i Simply.com

☐ **Opret API-nøgle** — kopier til Supabase secret `RESEND_API_KEY` (se 1.6.a)

☐ **Opret afsender-identitet** fx `tilbud@vvs.eventday.dk` (default i koden: [src/lib/notifications.js:37](src/lib/notifications.js:37))

Hvor emails sendes fra i koden:
- `notifyCustomerOfferSent` — når montør klikker "Del med kunde"
- `notifyMontorCustomerAction` — når kunde godkender/afviser/kommenterer
- `notifyInviteTeamMember` — når org-admin inviterer en montør
- `notifyNewOrgWelcome` — når super-admin opretter en ny org

---

## 3. CPSMS (SMS — valgfrit)

☐ **Opret konto** på [cpsms.dk](https://www.cpsms.dk/)

☐ **Verificér afsender-navn** `VVS FLOW` (max 11 tegn, skal godkendes af CPSMS)

☐ **Kopiér API-nøgle** til Supabase secret `CPSMS_API_KEY` (se 1.6.b)

Hvornår SMS sendes:
- Når kunden har telefonnummer OG email — begge sendes (se `notifyCustomerOfferSent`)

---

## 4. Netlify (hosting)

☐ **Opret site** på [netlify.com](https://netlify.com) koblet til GitHub-repoet `teambattle1/vvs-flow`
- Build command: `npm run build`
- Publish directory: `dist`
- Branch: `main`

☐ **Sæt environment variables** i Netlify (Site settings → Environment):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

☐ **Sæt site-navn** til `vvs-flow` → giver preview URL `vvs-flow.netlify.app`

☐ **Første deploy** — kan kaldes manuelt med `netlify deploy --prod` (husk: **du** skal godkende eksplicit i chat før jeg gør det).

---

## 5. DNS (Simply.com)

☐ **Log ind** på [simply.com](https://simply.com) → eventday.dk → DNS

☐ **Tilføj CNAME**:
- Navn: `vvs`
- Værdi: `vvs-flow.netlify.app`
- TTL: 300

☐ **I Netlify:** Add custom domain → `vvs.eventday.dk` → aktivér HTTPS

Efter 5-15 min er VVS FLOW live på **https://vvs.eventday.dk**.

---

## 6. GitHub

☐ **Repo er allerede oprettet**: `teambattle1/VVS` (tomt, opsat som origin)

☐ **Første push** (efter din eksplicitte accept):

```bash
git push -u origin master
# eller hvis branch skal hedde main:
git branch -M main && git push -u origin main
```

---

## 7. Grossist-integrationer (Fase 8)

### 7.1 Sanistål

☐ **Kontakt Sanistål** for API-adgang (business@sanistaal.dk)
- Formål: auto-opdatering af pris + lagerbeholdning på varer
- Typisk: API-key + webhook til pris-opdateringer

📄 Når aktiveret: opdater [src/pages/admin/Integrations.jsx](src/pages/admin/Integrations.jsx) til `status: 'connected'`

### 7.2 Brødrene Dahl

☐ Kontakt [bd.dk](https://bd.dk) for API — typisk kræver erhvervskonto.

---

## 8. Fakturering (Fase 8)

### 8.1 e-conomic

☐ **Opret udvikler-konto** på [e-conomic.dk](https://www.e-conomic.dk/api)

☐ **Registrer app** → få `AppSecretToken` og `AppPublicToken`

☐ **OAuth-flow** til at koble org's e-conomic konto til VVS FLOW:
- Edge function `ef-economic-auth` (findes lignende i EVENTDAY — kan forkes)

☐ Når tilbud godkendes → auto-opret faktura i e-conomic

### 8.2 Billy (alternativ)

☐ [billy.dk/api](https://billy.dk/api) — simplere end e-conomic for små firmaer

---

## 9. Betaling (Stripe — for VVS FLOW selv)

☐ **Opret Stripe-konto** på [stripe.com](https://stripe.com)

☐ **Opret 3 produkter** matching vores tiers:
- Trial (gratis, 14 dage)
- Basic — fx 299 kr/md
- Pro — fx 599 kr/md

☐ **Kopiér `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY`**

☐ **Opret edge function `ef-stripe-webhook`** — reagerer på betalinger → opdaterer `vvs_organizations.subscription_status`

☐ **Sæt webhook URL** i Stripe dashboard: `https://DIT-PROJEKT.supabase.co/functions/v1/ef-stripe-webhook`

---

## 10. MitID signatur (Fase 8)

☐ **Ansøg om MitID Erhverv** gennem [mitid-erhverv.dk](https://www.mitid-erhverv.dk/)
- Kræver CVR og opretter-underskriver
- Typisk godkendelsestid: 1-4 uger

☐ **Integration via Criipto / Signicat** — kræver tredjepartsleverandør (ikke direkte MitID)

📄 Når aktiveret: udskift [SignaturePad](src/components/SignaturePad.jsx) med MitID-flow i [SignOfferDialog](src/components/SignOfferDialog.jsx).

---

## 11. Observability (anbefalet senere)

☐ **Sentry** til error tracking:
- Opret projekt på sentry.io
- Tilføj `VITE_SENTRY_DSN` env var
- Installer `@sentry/react`

☐ **Plausible** eller Fathom til privacy-venlig analytics

---

## 12. Supabase Realtime aktivering

📄 Realtime-subscription scaffold er klar i [src/hooks/useRealtime.js](src/hooks/useRealtime.js) og bruges fra:
- [src/pages/JobDetail.jsx](src/pages/JobDetail.jsx) — montøren ser live opdateringer
- [src/pages/CustomerPortal.jsx](src/pages/CustomerPortal.jsx) — kunden ser live opdateringer

⚙️ Aktiveres automatisk når Supabase er konfigureret. Ingen kode-ændringer nødvendige.

☐ **Enable Realtime på tabeller** i Supabase Dashboard → Database → Replication:
- `vvs_room_packages`
- `vvs_package_items`
- `vvs_customer_actions`
- `vvs_activity_log`

---

## 13. Opsummering — Minimumsliste for at gå live

For at kunne bruge systemet med rigtige kunder skal du som minimum:

1. ☐ Opret Supabase projekt → få URL + anon key
2. ☐ Kør migration + seed
3. ☐ Tilføj `.env` med Supabase-nøgler
4. ☐ Opret første super-admin user (1.5)
5. ☐ Opret første VVS-org via super-admin panel
6. ☐ Resend-konto + deploy `ef-send-email` (hvis emails ønskes)
7. ☐ Netlify site + env vars + deploy
8. ☐ DNS pegning i Simply.com

Alt andet (SMS, e-conomic, MitID, Stripe, grossister) kan tilføjes senere uden kode-ændringer — scaffoldet er klar.

---

## 14. Kode-pointers

| Scaffold | Fil | Forbrug |
|---|---|---|
| Supabase-klient | [src/lib/supabase.js](src/lib/supabase.js) | `hasSupabase` flag + `supabase` instance |
| Notifikationer | [src/lib/notifications.js](src/lib/notifications.js) | Alle email/SMS-kald |
| Realtime hooks | [src/hooks/useRealtime.js](src/hooks/useRealtime.js) | Auto-subscribe når Supabase er klar |
| Edge function calls | `supabase.functions.invoke(name, { body })` | Bruges fra `notifications.js` |
| Auth (mock nu) | [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx) | Skal erstattes med `supabase.auth.signInWithPassword` |
| Kunde-auth (mock) | [src/contexts/CustomerAuthContext.jsx](src/contexts/CustomerAuthContext.jsx) | Samme — kan bruge Supabase Auth |
| JobsContext (mock) | [src/contexts/JobsContext.jsx](src/contexts/JobsContext.jsx) | Skal omlægges til at læse/skrive til Supabase via `supabase.from('vvs_jobs').*` |

---

## 15. Når du er klar til go-live

Sig til mig i chat:

> "Alt er klar. Gør følgende:
> 1. Omlæg AuthContext til rigtig Supabase Auth
> 2. Omlæg JobsContext til Supabase queries
> 3. Push til GitHub
> 4. Deploy til Netlify (vvs-flow.netlify.app)"

Så tager jeg det skridt for skridt med dig.
