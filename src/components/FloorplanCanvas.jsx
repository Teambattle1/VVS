import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Line, Image as KonvaImage, Text as KonvaText, Group } from 'react-konva'
import { Camera } from 'lucide-react'
import clsx from 'clsx'
import { packageTotal, formatDKK } from '../lib/pricing.js'
import LucideByName from './LucideByName.jsx'

// ============================================
// Hybrid floorplan-view:
// - Konva bundlag: rum-outline, gitter, billede, tegnede linjer
// - HTML overlay: pakke-markoerer med Lucide-ikon + titel + pris
// Shape + farve pr. pakke via pkg.shape / pkg.color
// ============================================

const DEFAULT_COLOR = '#E11D48' // roed (matcher brand)

// Giver 5-12 grid-labels uanset rumstoerrelse (20cm / 50cm / 100cm ...)
function pickStep(totalCm) {
  const options = [10, 20, 25, 50, 100, 200, 500]
  for (const s of options) {
    if (totalCm / s <= 12) return s
  }
  return 1000
}

export default function FloorplanCanvas({
  room,
  placing = false,
  drawing = false,
  drawColor = '#0F172A',
  drawWidth = 3,
  selectedPackageId = null,
  onPlace,
  onSelectPackage,
  onMovePackage,
  onAddLine,
  readOnly = false,
}) {
  const wrapRef = useRef(null)
  const [size, setSize] = useState({ width: 600, height: 400 })
  const [bgImage, setBgImage] = useState(null)
  const [currentLine, setCurrentLine] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const isDrawingRef = useRef(false)
  const dragStartRef = useRef(null)

  useEffect(() => {
    function measure() {
      if (!wrapRef.current) return
      const { width } = wrapRef.current.getBoundingClientRect()
      const ratio = room.length_cm / room.width_cm
      const height = Math.min(Math.max(width * ratio, 280), 620)
      setSize((prev) => {
        if (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) return prev
        return { width, height }
      })
    }
    measure()
    let rafId = null
    const ro = new ResizeObserver(() => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        measure()
      })
    })
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => {
      ro.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [room.length_cm, room.width_cm])

  useEffect(() => {
    if (room.floorplan_mode !== 'upload' || !room.floorplan_image_url) {
      setBgImage(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = room.floorplan_image_url
    img.onload = () => setBgImage(img)
    img.onerror = () => setBgImage(null)
  }, [room.floorplan_image_url, room.floorplan_mode])

  const padding = 24
  const innerW = size.width - padding * 2
  const innerH = size.height - padding * 2
  const showRectangleBox = room.floorplan_mode === 'rectangle' || room.floorplan_mode === 'template'
  const showGrid = showRectangleBox || room.floorplan_mode === 'freehand'

  // Dark-mode detection: lytter paa <html class="dark">
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const canvasBg = isDark ? '#0F172A' : '#ffffff'
  const canvasGrid = isDark ? '#1E293B' : '#e2e8f0'
  const canvasBorder = isDark ? '#475569' : '#94a3b8'
  const canvasLabel = isDark ? '#94A3B8' : '#64748B'

  // Vaelg cm-step der giver 5-12 labels uanset rumstoerrelse
  const cmStepX = pickStep(room.width_cm || 200)
  const cmStepY = pickStep(room.length_cm || 200)

  const gridLines = useMemo(() => {
    const lines = []
    const labels = []
    const pxPerCmX = innerW / (room.width_cm || 200)
    const pxPerCmY = innerH / (room.length_cm || 200)
    for (let cm = cmStepX; cm < (room.width_cm || 200); cm += cmStepX) {
      const x = cm * pxPerCmX
      lines.push({ key: `v${cm}`, points: [padding + x, padding, padding + x, padding + innerH] })
      labels.push({ key: `lv${cm}`, x: padding + x, y: padding - 14, text: String(cm), align: 'center' })
    }
    for (let cm = cmStepY; cm < (room.length_cm || 200); cm += cmStepY) {
      const y = cm * pxPerCmY
      lines.push({ key: `h${cm}`, points: [padding, padding + y, padding + innerW, padding + y] })
      labels.push({ key: `lh${cm}`, x: padding - 20, y: padding + y - 6, text: String(cm), align: 'right' })
    }
    return { lines, labels }
  }, [innerW, innerH, room.width_cm, room.length_cm, cmStepX, cmStepY])

  // COVER-skalering: billedet fylder hele rum-arealet (beskaerer overskud)
  const bgDims = useMemo(() => {
    if (!bgImage) return null
    const imgRatio = bgImage.width / bgImage.height
    const boxRatio = innerW / innerH
    let w, h
    if (imgRatio > boxRatio) {
      // Billede relativt bredere -> match hoejde, bredde overflow'er
      h = innerH
      w = innerH * imgRatio
    } else {
      // Billede relativt hoejere -> match bredde, hoejde overflow'er
      w = innerW
      h = innerW / imgRatio
    }
    return {
      x: padding + (innerW - w) / 2,
      y: padding + (innerH - h) / 2,
      width: w,
      height: h,
    }
  }, [bgImage, innerW, innerH])

  function normalizeX(x) { return (x - padding) / innerW }
  function normalizeY(y) { return (y - padding) / innerH }
  function denormalizeX(nx) { return padding + nx * innerW }
  function denormalizeY(ny) { return padding + ny * innerH }
  function denormalizePoints(points) {
    const out = []
    for (let i = 0; i < points.length; i += 2) {
      out.push(denormalizeX(points[i]), denormalizeY(points[i + 1]))
    }
    return out
  }

  // Konva stage event-handling: placering + tegning
  function handleStageMouseDown(e) {
    if (readOnly) return
    if (drawing) {
      const pos = e.target.getStage().getPointerPosition()
      if (!pos) return
      isDrawingRef.current = true
      setCurrentLine([normalizeX(pos.x), normalizeY(pos.y)])
      return
    }
    if (placing) {
      const pos = e.target.getStage().getPointerPosition()
      if (!pos) return
      const x = normalizeX(pos.x)
      const y = normalizeY(pos.y)
      if (x < 0 || x > 1 || y < 0 || y > 1) return
      onPlace?.({ x, y })
    }
  }

  function handleStageMouseMove(e) {
    if (!drawing || !isDrawingRef.current) return
    const pos = e.target.getStage().getPointerPosition()
    if (!pos) return
    setCurrentLine((prev) => (prev ? [...prev, normalizeX(pos.x), normalizeY(pos.y)] : null))
  }

  function handleStageMouseUp() {
    if (!drawing || !isDrawingRef.current) return
    isDrawingRef.current = false
    if (currentLine && currentLine.length >= 4) {
      onAddLine?.(currentLine)
    }
    setCurrentLine(null)
  }

  // HTML marker drag-handling — skelner klik fra drag via 5px threshold
  const DRAG_THRESHOLD = 5
  function startMarkerDrag(e, pkg) {
    if (readOnly || drawing || placing) return
    e.stopPropagation()
    const target = e.currentTarget
    target.setPointerCapture?.(e.pointerId)
    dragStartRef.current = {
      id: pkg.id,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    }
  }

  function moveMarkerDrag(e, pkg) {
    const ref = dragStartRef.current
    if (!ref || ref.id !== pkg.id || !wrapRef.current) return
    const dx = e.clientX - ref.startX
    const dy = e.clientY - ref.startY
    if (!ref.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      ref.moved = true
      setDraggingId(pkg.id)
    }
    const rect = wrapRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const x = Math.max(0, Math.min(1, (px - padding) / innerW))
    const y = Math.max(0, Math.min(1, (py - padding) / innerH))
    onMovePackage?.(pkg.id, { x, y })
  }

  function endMarkerDrag(e, pkg) {
    const ref = dragStartRef.current
    const target = e.currentTarget
    target.releasePointerCapture?.(e.pointerId)
    // Hvis musen knap nok er flyttet, er det et klik — lad onClick-handleren aabne drawer
    if (ref && ref.id === pkg.id && !ref.moved) {
      dragStartRef.current = null
      return
    }
    setDraggingId(null)
    dragStartRef.current = null
  }

  const activeHint = drawing
    ? 'Tegn ved at holde nede og trække'
    : placing
    ? 'Tryk på grundplanen for at placere pakken'
    : null

  return (
    <div
      ref={wrapRef}
      className={clsx(
        'relative w-full rounded-2xl overflow-hidden border-2 bg-slate-50 dark:bg-slate-900',
        placing || drawing ? 'border-sky-400 border-dashed' : 'border-slate-200 dark:border-slate-700'
      )}
      style={{ minHeight: 280, touchAction: drawing ? 'none' : 'auto' }}
    >
      {activeHint && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-sky-500 text-white text-xs font-semibold rounded-full px-3 py-1.5 shadow-md pointer-events-none">
          {activeHint}
        </div>
      )}

      <Stage
        width={size.width}
        height={size.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
      >
        <Layer listening={false}>
          <Rect x={padding} y={padding} width={innerW} height={innerH} fill={canvasBg} cornerRadius={6} />
          {bgImage && bgDims && (
            <Group
              clipX={padding}
              clipY={padding}
              clipWidth={innerW}
              clipHeight={innerH}
            >
              <KonvaImage
                image={bgImage}
                x={bgDims.x}
                y={bgDims.y}
                width={bgDims.width}
                height={bgDims.height}
                opacity={0.95}
              />
            </Group>
          )}
          {showGrid && gridLines.lines.map((l) => <Line key={l.key} points={l.points} stroke={canvasGrid} strokeWidth={1} />)}
          {showGrid && gridLines.labels.map((lbl) => (
            <KonvaText
              key={lbl.key}
              x={lbl.align === 'right' ? lbl.x - 20 : lbl.x - 12}
              y={lbl.y}
              width={lbl.align === 'right' ? 20 : 24}
              text={lbl.text}
              fontSize={9}
              fill={canvasLabel}
              align={lbl.align === 'right' ? 'right' : 'center'}
            />
          ))}
          {showRectangleBox && (
            <Rect x={padding} y={padding} width={innerW} height={innerH} stroke={canvasBorder} strokeWidth={3} cornerRadius={6} />
          )}
          <KonvaText
            text={`${room.width_cm} × ${room.length_cm} cm`}
            x={padding + 8}
            y={padding + 8}
            fontSize={11}
            fontFamily="Manrope, system-ui, sans-serif"
            fill="#64748b"
            fontStyle="600"
          />
        </Layer>

        <Layer listening={false}>
          {(room.floorplan_data?.lines || []).map((l) => (
            <Line
              key={l.id}
              points={denormalizePoints(l.points)}
              stroke={l.color || '#0F172A'}
              strokeWidth={l.width || 3}
              lineCap="round"
              lineJoin="round"
              tension={0.3}
            />
          ))}
          {currentLine && (
            <Line
              points={denormalizePoints(currentLine)}
              stroke={drawColor || '#0EA5E9'}
              strokeWidth={drawWidth || 3}
              lineCap="round"
              lineJoin="round"
              tension={0.3}
            />
          )}
        </Layer>
      </Stage>

      {/* HTML overlay for pakke-markoerer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ padding: `${padding}px` }}
      >
        {(room.packages || []).map((pkg) => (
          <PackageMarker
            key={pkg.id}
            pkg={pkg}
            innerW={innerW}
            innerH={innerH}
            selected={pkg.id === selectedPackageId}
            dragging={draggingId === pkg.id}
            disabled={readOnly || drawing || placing}
            onSelect={() => onSelectPackage?.(pkg.id)}
            onPointerDown={(e) => startMarkerDrag(e, pkg)}
            onPointerMove={(e) => moveMarkerDrag(e, pkg)}
            onPointerUp={(e) => endMarkerDrag(e, pkg)}
            onPointerCancel={(e) => endMarkerDrag(e, pkg)}
          />
        ))}
      </div>
    </div>
  )
}

const SIZE_MAP = {
  sm: { box: 32, icon: 16 },
  md: { box: 44, icon: 22 },
  lg: { box: 60, icon: 30 },
  xl: { box: 80, icon: 40 },
}

function PackageMarker({
  pkg,
  innerW,
  innerH,
  selected,
  dragging,
  disabled,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  const [hover, setHover] = useState(false)
  const color = pkg.color || DEFAULT_COLOR
  const shape = pkg.shape || 'circle'
  const { box: boxSize, icon: iconSize } = SIZE_MAP[pkg.size || 'md'] || SIZE_MAP.md
  const total = packageTotal(pkg)
  const px = pkg.position_x * innerW
  const py = pkg.position_y * innerH

  const shapeRadius =
    shape === 'circle' ? 9999 : shape === 'rounded' ? 14 : shape === 'diamond' ? 4 : 0
  const transform = shape === 'diamond' ? 'rotate(45deg)' : undefined

  const photoCount = pkg.photos?.length || 0
  const items = pkg.items || []
  const hasItems = items.length > 0
  const hoverOpacity = hover && !dragging && !selected ? 0.7 : 1

  // Smart popup-position: vælg den side der har bedst plads
  const placeBelow = py < 140
  const placeRight = px < 180
  const placeLeft = px > innerW - 180
  const horiz = placeRight ? 'left' : placeLeft ? 'right' : 'center'

  const popupStyle = {
    position: 'absolute',
    [placeBelow ? 'top' : 'bottom']: `calc(100% + 6px)`,
    maxWidth: '240px',
    width: 'max-content',
  }
  if (horiz === 'center') {
    popupStyle.left = '50%'
    popupStyle.transform = 'translateX(-50%)'
  } else if (horiz === 'left') {
    popupStyle.left = '0'
  } else {
    popupStyle.right = '0'
  }

  return (
    <div
      className={clsx(
        'absolute flex flex-col items-center pointer-events-auto select-none transition-all',
        dragging ? 'cursor-grabbing z-30' : 'cursor-grab z-10',
        !disabled && !selected && !hover && 'hover:scale-105'
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        left: `${px}px`,
        top: `${py}px`,
        transform: 'translate(-50%, -50%)',
        opacity: hoverOpacity,
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (!dragging) onSelect?.()
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        onPointerDown?.(e)
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className="relative flex items-center justify-center shadow-md transition-all"
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: shapeRadius,
          backgroundColor: selected ? color : '#ffffff',
          border: `2.5px solid ${color}`,
          transform,
          boxShadow: selected
            ? `0 0 0 4px ${color}33, 0 4px 12px ${color}55`
            : `0 2px 8px ${color}33`,
        }}
      >
        <div style={{ transform: shape === 'diamond' ? 'rotate(-45deg)' : undefined }}>
          <LucideByName
            name={pkg.lucide_icon}
            strokeWidth={2.25}
            style={{
              width: iconSize,
              height: iconSize,
              color: selected ? '#ffffff' : color,
            }}
          />
        </div>

        {photoCount > 0 && (
          <div
            className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-sky-500 text-white text-[10px] font-extrabold flex items-center justify-center gap-0.5 shadow-md ring-2 ring-white dark:ring-slate-900"
            style={{ transform: shape === 'diamond' ? 'rotate(-45deg)' : undefined }}
          >
            <Camera className="w-2.5 h-2.5" strokeWidth={2.5} />
            {photoCount}
          </div>
        )}
      </div>

      {hover && !dragging && hasItems && (
        <div
          className="pointer-events-none z-50 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
          style={popupStyle}
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
              {pkg.name}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {items.length} {items.length === 1 ? 'vare' : 'varer'} · {formatDKK(total)}
            </div>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
            {items.slice(0, 8).map((it) => (
              <li
                key={it.id}
                className="px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {it.name_snapshot}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {it.quantity} × {formatDKK(it.unit_price)}
                  </div>
                </div>
                <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  {formatDKK((it.quantity || 1) * (it.unit_price || 0))}
                </div>
              </li>
            ))}
            {items.length > 8 && (
              <li className="px-3 py-1.5 text-[10px] text-slate-500 dark:text-slate-400 text-center">
                + {items.length - 8} flere…
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-1 px-2 py-0.5 rounded-lg bg-white/95 shadow-sm max-w-[120px] text-center">
        <div className="text-[10px] font-bold text-slate-900 leading-tight truncate">
          {pkg.name}
        </div>
      </div>

      <div
        className="mt-0.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm whitespace-nowrap"
        style={{ backgroundColor: '#0F172A' }}
      >
        {formatDKK(total)}
      </div>
    </div>
  )
}
