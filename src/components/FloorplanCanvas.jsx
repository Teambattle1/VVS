import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Line, Group, Circle, Text, Image as KonvaImage } from 'react-konva'
import { packageTotal, formatDKK } from '../lib/pricing.js'

// ============================================
// Floorplan canvas med alle 4 modes:
// - rectangle: væg-outline + gitter
// - freehand: fri tegning med pen
// - upload:    billede som baggrund
// - template:  samme som rectangle
// Placerede pakker vises som interaktive Konva.Group.
// ============================================
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
  const isDrawingRef = useRef(false)

  // Responsiv størrelse baseret på rummets proportioner
  useEffect(() => {
    function measure() {
      if (!wrapRef.current) return
      const { width } = wrapRef.current.getBoundingClientRect()
      const ratio = room.length_cm / room.width_cm
      const height = Math.min(Math.max(width * ratio, 280), 620)
      // Undgå ResizeObserver-loop: skip hvis aendringen er under 1px
      setSize((prev) => {
        if (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) {
          return prev
        }
        return { width, height }
      })
    }
    measure()
    // rAF-throttle saa vi ikke fyrer resize-observer-callback igen indenfor samme frame
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

  // Load background image if upload mode
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

  // Konva bg image dimensioner
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

  function normalizeX(x) {
    return (x - padding) / innerW
  }
  function normalizeY(y) {
    return (y - padding) / innerH
  }
  function denormalizeX(nx) {
    return padding + nx * innerW
  }
  function denormalizeY(ny) {
    return padding + ny * innerH
  }

  function denormalizePoints(points) {
    const out = []
    for (let i = 0; i < points.length; i += 2) {
      out.push(denormalizeX(points[i]), denormalizeY(points[i + 1]))
    }
    return out
  }

  const activeHint = drawing
    ? 'Tegn ved at holde nede og trække'
    : placing
    ? 'Tryk på grundplanen for at placere pakken'
    : null

  return (
    <div
      ref={wrapRef}
      className={`relative w-full rounded-2xl overflow-hidden border-2 ${
        placing || drawing ? 'border-sky-400 border-dashed' : 'border-slate-200'
      } bg-slate-50`}
      style={{ minHeight: 280, touchAction: drawing ? 'none' : 'auto' }}
    >
      {activeHint && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-sky-500 text-white text-xs font-semibold rounded-full px-3 py-1.5 shadow-md pointer-events-none">
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
          {/* Hvid baggrund */}
          <Rect
            x={padding}
            y={padding}
            width={innerW}
            height={innerH}
            fill="#ffffff"
            cornerRadius={6}
          />

          {/* Upload: billede som baggrund */}
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

          {/* Gitter hvis aktivt */}
          {showGrid &&
            gridLines.map((l) => (
              <Line key={l.key} points={l.points} stroke="#e2e8f0" strokeWidth={1} />
            ))}

          {/* Rektangel-outline */}
          {showRectangleBox && (
            <Rect
              x={padding}
              y={padding}
              width={innerW}
              height={innerH}
              stroke="#94a3b8"
              strokeWidth={3}
              cornerRadius={6}
            />
          )}

          {/* Dimensioner */}
          <Text
            text={`${room.width_cm} × ${room.length_cm} cm`}
            x={padding + 8}
            y={padding + 8}
            fontSize={11}
            fontFamily="Manrope, system-ui, sans-serif"
            fill="#64748b"
            fontStyle="600"
          />
        </Layer>

        {/* Gemte tegnede linjer */}
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

        <Layer>
          {room.packages?.map((pkg) => (
            <PackageMarker
              key={pkg.id}
              pkg={pkg}
              padding={padding}
              innerW={innerW}
              innerH={innerH}
              selected={pkg.id === selectedPackageId}
              readOnly={readOnly || drawing}
              onSelect={() => onSelectPackage?.(pkg.id)}
              onDragEnd={(pos) => onMovePackage?.(pkg.id, pos)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

function PackageMarker({ pkg, padding, innerW, innerH, selected, readOnly, onSelect, onDragEnd }) {
  const px = padding + pkg.position_x * innerW
  const py = padding + pkg.position_y * innerH
  const total = packageTotal(pkg)
  const priceText = formatDKK(total)

  function handleDragEnd(e) {
    const { x, y } = e.target.position()
    const nx = (x - padding) / innerW
    const ny = (y - padding) / innerH
    const clamped = {
      x: Math.max(0, Math.min(1, nx)),
      y: Math.max(0, Math.min(1, ny)),
    }
    onDragEnd?.(clamped)
  }

  return (
    <Group
      x={px}
      y={py}
      draggable={!readOnly}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.cancelBubble = true
        onSelect?.()
      }}
      onTap={(e) => {
        e.cancelBubble = true
        onSelect?.()
      }}
    >
      <Circle
        radius={24}
        fill={selected ? '#0EA5E9' : '#ffffff'}
        stroke={selected ? '#0284C7' : '#0EA5E9'}
        strokeWidth={selected ? 3 : 2}
        shadowColor="#0EA5E9"
        shadowBlur={selected ? 14 : 6}
        shadowOpacity={selected ? 0.35 : 0.2}
      />
      <Text
        text={(pkg.lucide_icon || 'P').charAt(0).toUpperCase()}
        x={-12}
        y={-10}
        width={24}
        height={24}
        align="center"
        verticalAlign="middle"
        fontStyle="800"
        fontSize={16}
        fill={selected ? '#ffffff' : '#0EA5E9'}
        fontFamily="Manrope, system-ui, sans-serif"
      />
      <PriceChip text={priceText} />
    </Group>
  )
}

function PriceChip({ text }) {
  const paddingX = 8
  const charWidth = 7
  const width = Math.max(52, text.length * charWidth + paddingX * 2)
  const height = 20
  return (
    <Group y={30} x={-width / 2}>
      <Rect
        width={width}
        height={height}
        cornerRadius={10}
        fill="#0F172A"
        shadowColor="#0F172A"
        shadowBlur={6}
        shadowOpacity={0.18}
      />
      <Text
        text={text}
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
        fontSize={11}
        fontStyle="700"
        fill="#ffffff"
        fontFamily="Manrope, system-ui, sans-serif"
        y={3}
      />
    </Group>
  )
}
