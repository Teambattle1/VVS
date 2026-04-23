import { useState } from 'react'
import {
  Plug,
  Package as PackageIcon,
  FileText,
  CreditCard,
  FileSignature,
  Check,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Info,
  Mail,
  Phone,
  Globe,
  Calendar,
  Banknote,
  ListChecks,
} from 'lucide-react'
import clsx from 'clsx'

const INTEGRATIONS = [
  {
    id: 'ao',
    category: 'Grossist',
    name: 'AO (Ahlsell)',
    description:
      'Hent live priser, lager og billeder fra AO.dk.',
    icon: PackageIcon,
    status: 'requires-contract',
    phase: 'Kræver aftale',
    externalUrl: 'https://www.ao.dk/erhverv',
    details: {
      overview:
        'AO er del af Ahlsell-koncernen. De har intet offentligt developer-API men understøtter OCI/cXML PunchOut for B2B-kunder.',
      requirements: [
        'Aktivt B2B-kundeforhold hos AO (aftalt konto + kreditmax)',
        'CVR-registreret virksomhed',
        'Teknisk kontaktperson der kan koordinere opsætningen',
      ],
      steps: [
        'Kontakt AO Erhverv og bed om "OCI/cXML integration"',
        'AO leverer PunchOut endpoint-URL + loginkredentialer (via kontrakt)',
        'VVS FLOW support konfigurerer din org med endpoint + credentials',
        'Test: prøv at udsøge en vare — AO returnerer katalog direkte',
        'Go-live: varer synkroniseres automatisk til din varedatabase',
      ],
      contact: {
        email: 'erhverv@ao.dk',
        phone: '+45 70 22 44 88',
        website: 'ao.dk/erhverv',
      },
      timeline: '4-8 uger efter kontrakt',
      cost: 'Ingen løbende gebyr. Opsætnings-timer hos din ERP-partner, typisk 8-16 timer.',
    },
  },
  {
    id: 'sanistaal',
    category: 'Grossist',
    name: 'Sanistål',
    description: 'Hent katalog, priser og lager fra Sanistål.',
    icon: PackageIcon,
    status: 'requires-contract',
    phase: 'Kræver aftale',
    externalUrl: 'https://www.sanistaal.dk/erhverv/',
    details: {
      overview:
        'Sanistål tilbyder OCI PunchOut samt CSV/Excel prislister til erhvervskunder.',
      requirements: [
        'Aktivt B2B-kundenummer hos Sanistål',
        'CVR-registreret virksomhed',
        'Accept af Saniståls IT-sikkerhedspolitik',
      ],
      steps: [
        'Login på sanistaal.dk → Min konto → kontakt din account manager',
        'Bed om "OCI PunchOut" eller "CSV prisliste" integration',
        'Modtag endpoint-URL + SFTP-credentials (alt efter valg)',
        'VVS FLOW support aktiverer sync-jobs for din org',
        'Prislister opdateres dagligt/ugentligt (efter aftale)',
      ],
      contact: {
        email: 'business@sanistaal.dk',
        phone: '+45 99 30 30 30',
        website: 'sanistaal.dk/erhverv',
      },
      timeline: '2-6 uger efter kontrakt',
      cost: 'Månedligt integrationsgebyr (typisk 0-500 kr). Opsætning: 4-8 timer.',
    },
  },
  {
    id: 'brdr-dahl',
    category: 'Grossist',
    name: 'Brødrene Dahl',
    description: 'Hent katalog, priser og lager fra BD.',
    icon: PackageIcon,
    status: 'requires-contract',
    phase: 'Kræver aftale',
    externalUrl: 'https://www.bd.dk/',
    details: {
      overview:
        'Brødrene Dahl (del af Saint-Gobain) bruger OCI PunchOut og cXML for deres største kunder.',
      requirements: [
        'B2B-kundekonto hos BD med årlig omsætning > 100.000 kr',
        'Godkendt ved BD\'s IT-team',
        'Lokal IT-partner der kan håndtere cXML-opsætning',
      ],
      steps: [
        'Ring til BD Kundeservice og bed om "digital integration"',
        'Møde med BD IT-team om valg: OCI vs cXML vs CSV',
        'Modtag teknisk dokumentation + staging-miljø',
        'VVS FLOW support tester integration i staging',
        'Produktionsgodkendelse + go-live',
      ],
      contact: {
        email: 'kundeservice@bd.dk',
        phone: '+45 43 48 48 48',
        website: 'bd.dk',
      },
      timeline: '6-12 uger (kræver mange godkendelser)',
      cost: 'Engangs-opsætning typisk 15-40.000 kr. Løbende: inkluderet i kundepris.',
    },
  },
  {
    id: 'economic',
    category: 'Fakturering',
    name: 'e-conomic',
    description: 'Send godkendte tilbud som faktura med ét klik.',
    icon: FileText,
    status: 'planned',
    phase: 'Fase 8',
    details: {
      overview:
        'e-conomic har et moderne REST API med OAuth 2.0. Integration er relativt simpel og gratis at bruge.',
      requirements: [
        'e-conomic abonnement (Standard eller højere)',
        'Admin-rettigheder i din e-conomic konto',
      ],
      steps: [
        'VVS FLOW registrerer sig som "App" hos e-conomic',
        'Du godkender VVS FLOW i din e-conomic konto (OAuth)',
        'Ved godkendt tilbud: opret faktura-kladde automatisk',
        'Du gennemser og bogfører i e-conomic',
      ],
      contact: {
        email: 'support@e-conomic.dk',
        website: 'e-conomic.dk/developer',
      },
      timeline: '1-2 uger efter VVS FLOW har OAuth-app registreret',
      cost: 'Gratis API. Kun din eksisterende e-conomic plan.',
    },
  },
  {
    id: 'billy',
    category: 'Fakturering',
    name: 'Billy',
    description: 'Alternativ til e-conomic for mindre firmaer.',
    icon: FileText,
    status: 'planned',
    phase: 'Fase 8',
    details: {
      overview:
        'Billy har et åbent REST API med API-nøgle-baseret auth. Enklere end e-conomic men færre features.',
      requirements: [
        'Billy abonnement (alle niveauer fungerer)',
        'API-nøgle genereret i Billy → Indstillinger → API',
      ],
      steps: [
        'Generer API-nøgle i Billy dashboard',
        'Paste nøglen i VVS FLOW settings',
        'Ved godkendt tilbud: oprettes faktura-kladde automatisk',
      ],
      contact: {
        email: 'support@billy.dk',
        website: 'billy.dk/api',
      },
      timeline: 'Kan aktiveres samme dag som API-nøgle er genereret',
      cost: 'Gratis API. Kun din eksisterende Billy plan.',
    },
  },
  {
    id: 'mitid',
    category: 'Signatur',
    name: 'MitID',
    description:
      'Juridisk bindende digital signatur via NemID/MitID Erhverv.',
    icon: FileSignature,
    status: 'planned',
    phase: 'Fase 8',
    details: {
      overview:
        'MitID kan IKKE integreres direkte. Man skal gennem en godkendt tredjepartsleverandør som Criipto eller Signicat.',
      requirements: [
        'MitID Erhverv-aftale (via mitid-erhverv.dk)',
        'Aftale med Criipto eller Signicat som broker',
        'GDPR + databehandler-aftaler på plads',
      ],
      steps: [
        'Ansøg om MitID Erhverv på mitid-erhverv.dk (1-4 uger)',
        'Vælg broker (Criipto ~500 kr/md, Signicat ~1.500 kr/md)',
        'Broker leverer OIDC/SAML-endpoints',
        'VVS FLOW integrerer broker — udskifter den simple canvas-signatur',
        'Juridisk bindende underskrift på tilbud',
      ],
      contact: {
        website: 'mitid-erhverv.dk (for aftale) + criipto.com (for integration)',
      },
      timeline: '4-8 uger inkl. godkendelser',
      cost: 'MitID Erhverv: ~0 kr/md. Broker: 500-1.500 kr/md + per-signatur gebyr.',
    },
  },
  {
    id: 'stripe',
    category: 'Betaling',
    name: 'Stripe',
    description: 'Abonnement-fakturering til VVS FLOW selv.',
    icon: CreditCard,
    status: 'planned',
    phase: 'Fase 8',
    details: {
      overview:
        'Stripe håndterer betaling for VVS FLOW-abonnementet fra dig som kunde. Ikke relevant for dine kunders betaling.',
      requirements: [
        'Stripe-konto (oprettes af VVS FLOW support)',
        'Dansk CVR + bankkonto',
      ],
      steps: [
        'VVS FLOW opretter Stripe-produkter for Trial/Basic/Pro',
        'Du tilmelder dig via Stripe Checkout første gang',
        'Månedlig/årlig fakturering automatisk',
        'Kort- eller SEPA-træk',
      ],
      contact: {
        website: 'stripe.com',
      },
      timeline: '1-2 uger efter VVS FLOW har produkter + webhook opsat',
      cost: 'Stripe: 1.4% + 1.80 kr pr transaktion (EU-kort).',
    },
  },
]

const STATUS_META = {
  connected: { label: 'Forbundet', icon: Check, color: 'bg-emerald-100 text-emerald-800' },
  planned: { label: 'Planlagt', icon: Clock, color: 'bg-slate-100 text-slate-700' },
  'requires-contract': { label: 'Kræver aftale', icon: Clock, color: 'bg-amber-100 text-amber-800' },
}

export default function AdminIntegrations() {
  const [expandedId, setExpandedId] = useState(null)

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const byCategory = INTEGRATIONS.reduce((acc, i) => {
    acc[i.category] = acc[i.category] || []
    acc[i.category].push(i)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Plug className="w-5 h-5 text-slate-500" strokeWidth={2} />
          Integrationer
        </h1>
        <p className="text-sm text-slate-500">
          Koble VVS FLOW sammen med de tjenester du allerede bruger. Klik på en integration for at se hvad der kræves.
        </p>
      </header>

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category}>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
            {category}
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((it) => (
              <IntegrationCard
                key={it.id}
                integration={it}
                expanded={expandedId === it.id}
                onToggle={() => toggleExpand(it.id)}
              />
            ))}
          </ul>
        </section>
      ))}

      <section className="card p-5 bg-gradient-to-br from-slate-50 to-white">
        <h3 className="font-bold text-slate-900 mb-1">Savner du en integration?</h3>
        <p className="text-sm text-slate-600 mb-3">
          Vi bygger gerne integrationer til de tjenester vores kunder bruger. Skriv til os og
          fortæl hvilken du har brug for.
        </p>
        <a href="mailto:kontakt@vvs-flow.dk" className="btn-primary inline-flex">
          Skriv til support
        </a>
      </section>
    </div>
  )
}

function IntegrationCard({ integration, expanded, onToggle }) {
  const status = STATUS_META[integration.status] || STATUS_META.planned
  const Icon = integration.icon
  const StatusIcon = status.icon

  return (
    <li className="card p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-base font-bold text-slate-900">{integration.name}</h3>
            <span className={clsx('chip text-[10px]', status.color)}>
              <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-slate-600">{integration.description}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="btn-secondary flex-1"
        >
          <Info className="w-4 h-4 text-slate-700" strokeWidth={2} />
          {expanded ? 'Skjul detaljer' : 'Hvad skal der til?'}
          <ChevronDown
            className={clsx('w-4 h-4 text-slate-700 transition-transform', expanded && 'rotate-180')}
            strokeWidth={2}
          />
        </button>
        {integration.externalUrl && (
          <a
            href={integration.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex-shrink-0"
            title="Åbn leverandør-side"
          >
            <ArrowUpRight className="w-4 h-4 text-slate-700" strokeWidth={2} />
          </a>
        )}
      </div>

      {expanded && integration.details && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 text-sm">
          <p className="text-slate-700">{integration.details.overview}</p>

          {integration.details.requirements?.length > 0 && (
            <DetailSection icon={ListChecks} title="Krav" iconColor="text-slate-500">
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[13px]">
                {integration.details.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </DetailSection>
          )}

          {integration.details.steps?.length > 0 && (
            <DetailSection icon={ListChecks} title="Opsætningsforløb" iconColor="text-sky-600">
              <ol className="space-y-1.5 text-slate-700 text-[13px]">
                {integration.details.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </DetailSection>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integration.details.timeline && (
              <DetailSection icon={Calendar} title="Tidsforløb" iconColor="text-emerald-600" inline>
                <p className="text-[13px] text-slate-700">{integration.details.timeline}</p>
              </DetailSection>
            )}
            {integration.details.cost && (
              <DetailSection icon={Banknote} title="Pris" iconColor="text-amber-600" inline>
                <p className="text-[13px] text-slate-700">{integration.details.cost}</p>
              </DetailSection>
            )}
          </div>

          {integration.details.contact && (
            <DetailSection icon={Mail} title="Kontakt" iconColor="text-rose-500">
              <div className="space-y-1 text-[13px]">
                {integration.details.contact.email && (
                  <a
                    href={`mailto:${integration.details.contact.email}`}
                    className="flex items-center gap-2 text-slate-700 hover:text-sky-600"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                    {integration.details.contact.email}
                  </a>
                )}
                {integration.details.contact.phone && (
                  <a
                    href={`tel:${integration.details.contact.phone}`}
                    className="flex items-center gap-2 text-slate-700 hover:text-sky-600"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                    {integration.details.contact.phone}
                  </a>
                )}
                {integration.details.contact.website && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Globe className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                    {integration.details.contact.website}
                  </div>
                )}
              </div>
            </DetailSection>
          )}
        </div>
      )}
    </li>
  )
}

function DetailSection({ icon: Icon, title, iconColor = 'text-slate-500', inline = false, children }) {
  return (
    <div className={inline ? 'rounded-2xl bg-slate-50 p-3' : ''}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={clsx('w-3.5 h-3.5', iconColor)} strokeWidth={2} />
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</span>
      </div>
      {children}
    </div>
  )
}
