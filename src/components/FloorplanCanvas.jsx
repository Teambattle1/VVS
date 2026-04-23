import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Line, Image as KonvaImage, Text as KonvaText } from 'react-konva'
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

export default function FloorplanCanvas({
  room,
  placing = false,
  drawing = false,
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

  const gridLines = useMemo(() => {
    const lines = []
    const step = 40
    for (let x = step; x < innerW; x += step) {
      lines.push({ key: `v${x}`, points: [padding + x, padding, padding + x, padding + innerH] })
    }
    for (let y = step; y < innerH; y += step) {
      lines.push({ key: `h${y}`, points: [padding, padding + y, padding + innerW, padding + y] })
    }
    return lines
  }, [innerW, innerH])

  const bgDims = useMemo(() => {
    if (!bgImage) return null
    const imgRatio = bgImage.width / bgImage.height
    const boxRatio = innerW / innerH
    let w, h
    if (imgRatio > boxRatio) {
      w = innerW
      h = innerW / imgRatio
    } else {
      h = innerH
      w = innerH * imgRatio
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

  // HTML marker drag-handling
  function startMarkerDrag(e, pkg) {
    if (readOnly || drawing || placing) return
    e.stopPropagation()
    const target = e.currentTarget
    target.setPointerCapture?.(e.pointerId)
    setDraggingId(pkg.id)
    dragStartRef.current = { id: pkg.id }
  }

  function moveMarkerDrag(e, pkg) {
    if (draggingId !== pkg.id || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const x = Math.max(0, Math.min(1, (px - padding) / innerW))
    const y = Math.max(0, Math.min(1, (py - padding) / innerH))
    onMovePackage?.(pkg.id, { x, y })
  }

  function endMarkerDrag(e, pkg) {
    if (draggingId !== pkg.id) return
    const target = e.currentTarget
    target.releasePointerCapture?.(e.pointerId)
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
        'relative w-full rounded-2xl overflow-hidden border-2 bg-slate-50',
        placing || drawing ? 'border-sky-400 border-dashed' : 'border-slate-200'
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
          <Rect x={padding} y={padding} width={innerW} height={innerH} fill="#ffffff" cornerRadius={6} />
          {bgImage && bgDims && (
            <KonvaImage
              image={bgImage}
              x={bgDims.x}
              y={bgDims.y}
              width={bgDims.width}
              height={bgDims.height}
              opacity={0.9}
            />
          )}
          {showGrid && gridLines.map((l) => <Line key={l.key} points={l.points} stroke="#e2e8f0" strokeWidth={1} />)}
          {showRectangleBox && (
            <Rect x={padding} y={padding} width={innerW} height={innerH} stroke="#94a3b8" strokeWidth={3} cornerRadius={6} />
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
              stroke="#0F172A"
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              tension={0.3}
            />
          ))}
          {currentLine && (
            <Line
              points={denormalizePoints(currentLine)}
              stroke="#0EA5E9"
              strokeWidth={3}
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

  // Halv-transparent ved hover saa brugeren kan se tegning/grid nedenunder
  // MEN kun hvis ikke billeder at vise (ellers holdes fuld saa billed-popup kan ses)
  const hasPhotos = (pkg.photos?.length || 0) > 0
  const hoverOpacity = hover && !dragging && !selected && !hasPhotos ? 0.35 : 1

  return (
    <div
      className={clsx(
        'absolute flex flex-col items-center pointer-events-auto select-none transition-all',
        dragging ? 'cursor-grabbing z-30' : 'cursor-grab z-10',
        !disabled && !selected && !hover && 'hover:scale-105'
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ opacity: hoverOpacity }}
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
        className="flex items-center justify-center shadow-md transition-all"
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
      </div>

      {/* Billede-thumbs popup ved hover */}
      {hover && hasPhotos && !dragging && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 flex gap-1 p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700"
          style={{ bottom: `calc(100% + 4px)` }}
        >
          {pkg.photos.slice(0, 4).map((p) => (
            <img
              key={p.id}
              src={p.url}
              alt={p.name || 'Foto'}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          ))}
          {pkg.photos.length > 4 && (
            <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
              +{pkg.photos.length - 4}
            </div>
          )}
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
