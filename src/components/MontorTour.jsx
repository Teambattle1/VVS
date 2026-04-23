import { useEffect, useState } from 'react'
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'
import clsx from 'clsx'

const STEPS = [
  {
    title: 'Velkommen til VVS FLOW',
    body: 'Her får du en kort rundtur i, hvordan du opretter og deler dine tilbud på få minutter.',
  },
  {
    title: 'Opret et nyt job',
    body: 'Tryk på "Nyt job" oppe i højre hjørne for at starte. Du kan oprette et job på under 30 sekunder.',
  },
  {
    title: 'Tilføj rum + placer pakker',
    body: 'I hvert job kan du tilføje rum og placere pakker (toilet, bad osv.) direkte på grundplanen.',
  },
  {
    title: 'Del med kunden',
    body: 'Tryk på "Del med kunde" når du er klar. Kunden får et unikt link hvor de kan godkende, tilvælge eller fravælge.',
  },
  {
    title: 'Spor kundens svar live',
    body: 'Aktivitets-feedet på hvert job viser dig live, når kunden kommenterer, godkender eller ændrer valg.',
  },
]

const STORAGE_KEY = 'vvs.tourSeen'

export default function MontorTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      setTimeout(() => setVisible(true), 600)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Trin {step + 1} af {STEPS.length}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{current.title}</h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center flex-shrink-0"
            aria-label="Spring over"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <p className="text-sm text-slate-700 mb-5">{current.body}</p>

        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={clsx(
                'h-1.5 flex-1 rounded-full transition-colors',
                idx <= step ? 'bg-sky-500' : 'bg-slate-200'
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary flex-1"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" strokeWidth={2} />
              Tilbage
            </button>
          )}
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary flex-1"
            >
              Næste
              <ChevronRight className="w-4 h-4 text-white" strokeWidth={2} />
            </button>
          ) : (
            <button type="button" onClick={dismiss} className="btn-primary flex-1">
              Kom i gang
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 text-xs text-slate-400 hover:text-slate-600 w-full text-center"
        >
          Spring tour over
        </button>
      </div>
    </div>
  )
}
