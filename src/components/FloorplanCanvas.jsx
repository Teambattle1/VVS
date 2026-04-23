import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Line, Group, Circle, Text } from 'react-konva'
import LucideByName from './LucideByName.jsx'
import { packageTotal, formatDKK } from '../lib/pricing.js'

// ============================================
// Floorplan canvas - rektangel-mode
// Placerede pakker vises som interaktive ikoner
// ============================================
export default function FloorplanCanvas({
  room,
  placing = false,
  selectedPackageId = null,
  onPlace,
  onSelectPackage,
  onMovePackage,
  readOnly = false,
}) {
  const wrapRef = useRef(null)
  const [size, setSize] = useState({ width: 600, height: 400 })

  useEffect(() => {
    function measure() {
      if (!wrapRef.current) return
      const { width } = wrapRef.current.getBoundingClientRect()
      const height = Math.min(Math.max(width * (room.length_cm / room.width_cm), 280), 620)
      setSize({ width, height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [room.length_cm, room.width_cm])

  // Rum-rektangel tegnes med padding, så grid og vægge er synlige.
  const padding = 24
  const innerW = size.width - padding * 2
  const innerH = size.height - padding * 2

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

  function handleStageClick(e) {
    if (!placing || readOnly) return
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (!pos) return
    const x = (pos.x - padding) / innerW
    const y = (pos.y - padding) / innerH
    if (x < 0 || x > 1 || y < 0 || y > 1) return
    onPlace?.({ x, y })
  }

  return (
    <div
      ref={wrapRef}
      className={`relative w-full rounded-2xl overflow-hidden border-2 ${placing ? 'border-sky-400 border-dashed' : 'border-slate-200'} bg-slate-50`}
      style={{ minHeight: 280 }}
    >
      {placing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-sky-500 text-white text-xs font-semibold rounded-full px-3 py-1.5 shadow-md pointer-events-none">
          Tryk på grundplanen hvor pakken skal placeres
        </div>
      )}

      <Stage
        width={size.width}
        height={size.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer listening={false}>
          <Rect
            x={padding}
            y={padding}
            width={innerW}
            height={innerH}
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth={3}
            cornerRadius={6}
          />
          {gridLines.map((l) => (
            <Line key={l.key} points={l.points} stroke="#e2e8f0" strokeWidth={1} />
          ))}
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

        <Layer>
          {room.packages?.map((pkg) => (
            <PackageMarker
              key={pkg.id}
              pkg={pkg}
              padding={padding}
              innerW={innerW}
              innerH={innerH}
              selected={pkg.id === selectedPackageId}
              readOnly={readOnly}
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
      <IconForeign
        icon={pkg.lucide_icon}
        color={selected ? '#ffffff' : '#0EA5E9'}
        x={-12}
        y={-12}
        size={24}
      />
      <PriceChip text={priceText} />
    </Group>
  )
}

// Lucide-ikon renderes via Konva.Text fallback hvis foreignObject ikke understøttes.
// For enkelhed: brug initial-bogstav som fallback inde i Konva (foreignObject kræver HTML).
function IconForeign({ icon, color, x, y, size }) {
  // Førstebogstav som fallback-markør inde i Konva (ægte Lucide ligger i HTML-overlay).
  const letter = (icon || 'P').charAt(0).toUpperCase()
  return (
    <Text
      text={letter}
      x={x}
      y={y + 2}
      width={size}
      height={size}
      align="center"
      verticalAlign="middle"
      fontStyle="800"
      fontSize={16}
      fill={color}
      fontFamily="Manrope, system-ui, sans-serif"
    />
  )
}

function PriceChip({ text }) {
  const paddingX = 8
  const paddingY = 3
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
        x={0}
        y={paddingY}
      />
    </Group>
  )
}
