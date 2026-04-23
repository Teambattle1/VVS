import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Wrench } from 'lucide-react'

const DURATION_MS = 5000
const FADE_MS = 450

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), DURATION_MS - FADE_MS)
    const doneTimer = setTimeout(() => onDone?.(), DURATION_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-sky-50 transition-opacity',
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-hidden={fading}
    >
      <div className="flex flex-col items-center gap-6 select-none">
        <div className="relative w-36 h-36">
          <div className="splash-wrench absolute inset-0 flex items-center justify-center">
            <Wrench
              className="w-24 h-24 text-rose-600 drop-shadow-[0_6px_14px_rgba(225,29,72,0.35)]"
              strokeWidth={2}
            />
          </div>

          <span className="splash-drop splash-drop-1" />
          <span className="splash-drop splash-drop-2" />
          <span className="splash-drop splash-drop-3" />
        </div>

        <div className="text-center">
          <h1 className="splash-title text-3xl font-extrabold tracking-tight text-slate-900">
            VVS <span className="text-sky-500">FLOW</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Tilbud, der flyder</p>
        </div>
      </div>
    </div>
  )
}
