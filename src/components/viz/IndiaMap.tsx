import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { plants } from '../../data/plants'
import { REGION_POINTS, type RegionPoint } from '../../lib/ayurveda'
import type { Plant, RegionTag } from '../../types/plant'

/* ------------------------------------------------------------------ *
 * Where the garden grows.
 *
 * A stylised India — deliberately smooth and diagrammatic rather than
 * cartographic, because the point is "which climates does this
 * collection cover", not survey accuracy. Regions are sized by how many
 * species the compendium places there.
 * ------------------------------------------------------------------ */

/* Boundary traced clockwise from Kashmir, at roughly one point per major
 * bend of the coast or border.
 *
 * Longitude and latitude are scaled by the same number of pixels per
 * degree — at Indian latitudes a degree of each is within a few per cent
 * of the same distance, and scaling them differently is what makes a
 * hand-drawn India come out looking narrow and wrong. */
const OUTLINE: [number, number][] = [
  // Kashmir and the northern border, running east
  [104, 78], [116, 88], [122, 104], [159, 119], [192, 130], [225, 143],
  [255, 160], [285, 160], [306, 157], [337, 165], [376, 171], [398, 166],
  // The north-east, and back down through Mizoram
  [404, 181], [386, 206], [368, 212], [356, 236], [341, 243],
  // Bay of Bengal: Bengal, Odisha, Andhra, Tamil Nadu
  [317, 239], [284, 243], [270, 255], [246, 270], [222, 291], [194, 313],
  [182, 330], [181, 355], [177, 392], [157, 410],
  // Kanyakumari
  [145, 424],
  // Arabian Sea: Kerala, Konkan, Gujarat, Kutch
  [131, 402], [122, 374], [111, 350], [100, 328], [90, 295], [85, 275],
  [84, 252], [76, 246],
  // Saurashtra and the Gulf of Kutch — the silhouette's clearest landmark
  [70, 258], [56, 252], [50, 238], [36, 234], [27, 219],
  // Rajasthan and Punjab, closing back at Kashmir
  [54, 204], [48, 165], [77, 147], [98, 107],
]

/** Catmull-Rom through the points, emitted as cubic beziers. */
function smoothClosedPath(points: [number, number][], tension = 0.42): string {
  const n = points.length
  const at = (i: number) => points[((i % n) + n) % n]
  let d = `M ${at(0)[0]} ${at(0)[1]}`
  for (let i = 0; i < n; i++) {
    const [x0, y0] = at(i - 1)
    const [x1, y1] = at(i)
    const [x2, y2] = at(i + 1)
    const [x3, y3] = at(i + 2)
    const c1x = x1 + ((x2 - x0) / 6) * tension * 2
    const c1y = y1 + ((y2 - y0) / 6) * tension * 2
    const c2x = x2 - ((x3 - x1) / 6) * tension * 2
    const c2y = y2 - ((y3 - y1) / 6) * tension * 2
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return `${d} Z`
}

const INDIA = smoothClosedPath(OUTLINE)

interface RegionDatum extends RegionPoint {
  region: RegionTag
  members: Plant[]
}

function useRegionData(): { regions: RegionDatum[]; panIndia: Plant[] } {
  return useMemo(() => {
    const buckets = new Map<string, Plant[]>()
    for (const plant of plants) {
      for (const region of plant.regions) {
        const list = buckets.get(region) ?? []
        list.push(plant)
        buckets.set(region, list)
      }
    }

    // "Pan-India" is not a place on the map — pinning it somewhere would
    // be a lie about where those plants grow. It gets a line of its own.
    const panIndia = buckets.get('Pan-India') ?? []

    const regions = [...buckets.entries()]
      .filter(([region]) => region !== 'Pan-India')
      .map(([region, members]) => {
        const pos = REGION_POINTS[region]
        return pos ? { region: region as RegionTag, ...pos, members } : null
      })
      .filter((d): d is RegionDatum => d !== null)
      .sort((a, b) => b.members.length - a.members.length)

    return { regions, panIndia }
  }, [])
}

/** Hangs a caption off whichever side of the circle points away from the middle. */
function labelPlacement(d: RegionDatum, r: number) {
  const gap = r + 7
  switch (d.side) {
    case 'left':
      return { x: d.x - gap, y: d.y + 3.5, textAnchor: 'end' as const }
    case 'right':
      return { x: d.x + gap, y: d.y + 3.5, textAnchor: 'start' as const }
    case 'above':
      return { x: d.x, y: d.y - gap, textAnchor: 'middle' as const }
    default:
      return { x: d.x, y: d.y + gap + 6, textAnchor: 'middle' as const }
  }
}

export function IndiaMap({
  selected,
  onSelect,
  className,
}: {
  selected?: RegionTag | null
  onSelect?: (region: RegionTag) => void
  className?: string
}) {
  const uid = useId()
  const { regions: data, panIndia } = useRegionData()
  const [hovered, setHovered] = useState<RegionDatum | null>(null)
  const max = Math.max(...data.map((d) => d.members.length))
  const active = hovered ?? data.find((d) => d.region === selected) ?? null

  const radiusFor = (count: number) => 9 + (count / max) * 17

  return (
    <div className={className}>
      <div className="relative">
        <svg viewBox="0 0 420 480" className="w-full" role="img" aria-label="Medicinal plants by region of India">
          <defs>
            <radialGradient id={`${uid}-land`} cx="45%" cy="35%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
            </radialGradient>
            <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={`${uid}-clip`}>
              <path d={INDIA} />
            </clipPath>
          </defs>

          {/* Latitude hatching, so the silhouette reads as a map and not a blob */}
          <g clipPath={`url(#${uid}-clip)`} opacity={0.45}>
            {Array.from({ length: 24 }, (_, i) => (
              <line
                key={i}
                x1={10}
                x2={415}
                y1={60 + i * 16}
                y2={60 + i * 16}
                stroke="var(--line-strong)"
                strokeWidth={0.6}
              />
            ))}
          </g>

          <motion.path
            d={INDIA}
            fill={`url(#${uid}-land)`}
            stroke="var(--accent)"
            strokeWidth={1.6}
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: 1.8, ease: 'easeInOut' }, opacity: { duration: 0.4 } }}
          />

          {data.map((d, i) => {
            const isActive = active?.region === d.region
            const r = radiusFor(d.members.length)
            return (
              <motion.g
                key={d.region}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
                style={{ transformOrigin: `${d.x}px ${d.y}px`, cursor: onSelect ? 'pointer' : 'default' }}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(d.region)}
                aria-label={`${d.region}: ${d.members.length} plants`}
              >
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={r}
                  fill="var(--accent)"
                  opacity={isActive ? 0.72 : 0.34}
                  stroke="var(--accent)"
                  strokeWidth={isActive ? 2 : 1}
                  filter={isActive ? `url(#${uid}-glow)` : undefined}
                />
                <text
                  x={d.x}
                  y={d.y + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  className="font-mono"
                  fill="var(--surface-raised)"
                  style={{ pointerEvents: 'none' }}
                >
                  {d.members.length}
                </text>
                <text
                  {...labelPlacement(d, r)}
                  fontSize={10}
                  fontWeight={600}
                  fill={isActive ? 'var(--ink)' : 'var(--ink-faint)'}
                  stroke="var(--surface-raised)"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none' }}
                >
                  {d.label}
                </text>
              </motion.g>
            )
          })}
        </svg>

        {/* Hover readout */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          {active && (
            <motion.div
              key={active.region}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass mx-auto max-w-sm rounded-2xl border border-line p-3 shadow-[var(--shadow-soft)]"
            >
              <p className="font-display text-sm font-semibold">{active.region}</p>
              <p className="mt-0.5 text-[0.72rem] text-ink-faint">{active.members.length} species in the compendium</p>
              <p className="mt-1.5 text-[0.76rem] leading-snug text-ink-soft">
                {active.members
                  .slice(0, 6)
                  .map((p) => p.name)
                  .join(' · ')}
                {active.members.length > 6 && ` +${active.members.length - 6} more`}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.72rem] text-ink-faint">
        <button
          type="button"
          onClick={() => onSelect?.('Pan-India' as RegionTag)}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
        >
          <span className="size-2.5 rounded-full border border-dashed border-current" />
          <span>
            <span className="font-semibold text-ink tabular-nums">{panIndia.length}</span> more grow right across the
            country
          </span>
        </button>
        <span>Schematic — regions are indicative, not surveyed</span>
      </div>
    </div>
  )
}
