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
} from 'lucide-react'
import clsx from 'clsx'

const INTEGRATIONS = [
  {
    id: 'ao',
    category: 'Grossist',
    name: 'AO (Ahlsell)',
    description:
      'Hent live priser, lager og billeder fra AO.dk. Kræver B2B-kundeaftale + OCI PunchOut-opsætning via AO Erhverv.',
    icon: PackageIcon,
    status: 'requires-contract',
    phase: 'Kræver aftale',
    note: 'Intet offentligt developer-API. Kontakt AO Erhverv på erhverv@ao.dk for at aktivere OCI/cXML-integration.',
    externalUrl: 'https://www.ao.dk/erhverv',
  },
  {
    id: 'sanistaal',
    category: 'Grossist',
    name: 'Sanistål',
    description:
      'Hent live lagerstatus, priser og billeder fra Sanistål. Kræver B2B-kundeaftale + OCI/cXML PunchOut-opsætning.',
    icon: PackageIcon,
    status: 'requires-contract',
    phase: 'Kræver aftale',
    note: 'Intet offentligt developer-API. Kontakt Sanistål Erhverv (business@sanistaal.dk) for OCI PunchOut eller CSV-feed.',
    externalUrl: 'https://www.sanistaal.dk/erhverv/',
  },
  {
    id: 'brdr-dahl',
    category: 'Grossist',
    name: 'Brødrene Dahl',
    description:
      'Hent katalog, priser og lager fra BD. Kræver B2B-kundeaftale + OCI/cXML PunchOut-opsætning.',
    icon: PackageIcon,
    status: 'requires-contract',
    phase: 'Kræver aftale',
    note: 'Intet offentligt developer-API. Kontakt BD Erhverv via bd.dk/kundeservice for OCI PunchOut-integration.',
    externalUrl: 'https://www.bd.dk/',
  },
  {
    id: 'economic',
    category: 'Fakturering',
    name: 'e-conomic',
    description: 'Send godkendte tilbud som faktura med ét klik. Automatisk kunde-oprettelse.',
    icon: FileText,
    status: 'planned',
    phase: 'Fase 8',
  },
  {
    id: 'billy',
    category: 'Fakturering',
    name: 'Billy',
    description: 'Alternativ til e-conomic for mindre VVS-firmaer.',
    icon: FileText,
    status: 'planned',
    phase: 'Fase 8',
  },
  {
    id: 'mitid',
    category: 'Signatur',
    name: 'MitID',
    description:
      'Juridisk bindende digital signatur via NemID/MitID Erhverv. Alternativ til simpel underskrift.',
    icon: FileSignature,
    status: 'planned',
    phase: 'Fase 8',
  },
  {
    id: 'stripe',
    category: 'Betaling',
    name: 'Stripe',
    description: 'Abonnement-fakturering til VVS FLOW selv — håndterer kort, SEPA og fakturering.',
    icon: CreditCard,
    status: 'planned',
    phase: 'Fase 8',
  },
]

const STATUS_META = {
  connected: { label: 'Forbundet', icon: Check, color: 'bg-emerald-100 text-emerald-800' },
  planned: { label: 'Planlagt', icon: Clock, color: 'bg-slate-100 text-slate-700' },
  'requires-contract': { label: 'Kræver aftale', icon: Clock, color: 'bg-amber-100 text-amber-800' },
}

export default function AdminIntegrations() {
  const [toast, setToast] = useState(null)

  function handleConnect(integration) {
    if (integration.status === 'requires-contract') {
      setToast(
        `${integration.name}: ${integration.note || 'Kræver aftale med leverandøren.'}`
      )
    } else {
      setToast(`${integration.name} kommer i ${integration.phase}. Kontakt support hvis du har brug for tidlig adgang.`)
    }
    setTimeout(() => setToast(null), 6000)
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
          Koble VVS FLOW sammen med de tjenester du allerede bruger.
        </p>
      </header>

      {toast && (
        <div className="rounded-2xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
          {toast}
        </div>
      )}

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category}>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
            {category}
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((it) => {
              const status = STATUS_META[it.status] || STATUS_META.planned
              const Icon = it.icon
              const StatusIcon = status.icon
              return (
                <li key={it.id} className="card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-base font-bold text-slate-900">{it.name}</h3>
                        <span className={clsx('chip text-[10px]', status.color)}>
                          <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{it.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleConnect(it)}
                      disabled={it.status === 'connected'}
                      className="btn-secondary flex-1"
                    >
                      {it.status === 'connected' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                          Administrer
                        </>
                      ) : it.status === 'requires-contract' ? (
                        <>
                          Kontakt leverandør
                          <ArrowUpRight className="w-4 h-4 text-slate-700" strokeWidth={2} />
                        </>
                      ) : (
                        <>
                          Tilslut
                          <ArrowUpRight className="w-4 h-4 text-slate-700" strokeWidth={2} />
                        </>
                      )}
                    </button>
                    {it.externalUrl && (
                      <a
                        href={it.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex-shrink-0"
                        title="Åbn leverandør-side"
                      >
                        <ArrowUpRight className="w-4 h-4 text-slate-700" strokeWidth={2} />
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
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
