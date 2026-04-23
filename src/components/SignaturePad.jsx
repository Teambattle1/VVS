import { useEffect, useRef, useState } from 'react'
import { Eraser, PenLine } from 'lucide-react'

// Enkel canvas-signatur - lagres som data-URL
export default function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastRef = useRef(null)
  const [empty, setEmpty] = useState(!value)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0F172A'
    ctx.lineWidth = 2.5

    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = value
    }
  }, [value])

  function pointerPos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  function start(e) {
    e.preventDefault()
    drawingRef.current = true
    lastRef.current = pointerPos(e)
    setEmpty(false)
  }

  function move(e) {
    if (!drawingRef.current) return
    e.preventDefault()
    const p = pointerPos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(lastRef.current.x, lastRef.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastRef.current = p
  }

  function end() {
    if (!drawingRef.current) return
    drawingRef.current = false
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onChange?.(dataUrl)
  }

  function clear() {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setEmpty(true)
    onChange?.(null)
  }

  return (
    <div>
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full h-40 bg-white touch-none"
          style={{ touchAction: 'none' }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pointer-events-none">
            <PenLine className="w-4 h-4 mr-2" strokeWidth={2} />
            Underskriv her
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
      >
        <Eraser className="w-3.5 h-3.5" strokeWidth={2} />
        Ryd signatur
      </button>
    </div>
  )
}
