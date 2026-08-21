import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { plants } from '../../data/plants'
import type { TherapeuticTag } from '../../types/plant'

/* ------------------------------------------------------------------ *
 * The therapeutic constellation.
 *
 * Every plant is tied to the complaints it treats. Written as a table
 * that is 25 rows of repetition; drawn as a graph it becomes obvious
 * which herbs are generalists, which ailments are well covered, and
 * where the collection is thin. Layout is a small spring simulation —
 * no chart library, and it settles in well under a second.
 * ------------------------------------------------------------------ */

const WIDTH = 720
const HEIGHT = 560

interface Node {
  id: string
  label: string
  kind: 'tag' | 'plant'
  color: string
  radius: number
  x: number
  y: number
  vx: number
  vy: number
  degree: number
}

interface Edge {
  source: string
  target: string
}

const TAG_COLORS: Record<TherapeuticTag, string> = {
  Digestive: '#d9a13c',
  Immunity: '#4f9d5c',
  Respiratory: '#4aa3a8',
  'Skin & Hair': '#c9743f',
  'Mind & Sleep': '#7c72c4',
  'Heart & Circulation': '#b95a72',
  'Joints & Pain': '#8a7f5c',
  Metabolic: '#9db83f',
  Liver: '#6f9d78',
  'Women’s Health': '#c2688f',
  'Kidney & Urinary': '#5f8fc4',
  'Wound Care': '#b6795a',
}

/** "Heart & Circulation" over two lines is half as wide, and half as
 *  likely to land on top of a neighbouring node. */
function wrapLabel(label: string): string[] {
  const parts = label.split(' & ')
  return parts.length === 2 ? [`${parts[0]} &`, parts[1]] : [label]
}

function buildGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const tagCounts = new Map<string, number>()

  for (const plant of plants) {
    for (const tag of plant.therapeutic) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }

  // Tags seeded on a ring, plants just outside it — a sane starting shape
  // beats random placement, which takes far longer to untangle.
  const tags = [...tagCounts.keys()]
  tags.forEach((tag, i) => {
    const angle = (Math.PI * 2 * i) / tags.length
    nodes.push({
      id: `tag:${tag}`,
      label: tag,
      kind: 'tag',
      color: TAG_COLORS[tag as TherapeuticTag] ?? '#4f9d5c',
      radius: 10 + (tagCounts.get(tag) ?? 1) * 1.25,
      x: WIDTH / 2 + Math.cos(angle) * 130,
      y: HEIGHT / 2 + Math.sin(angle) * 110,
      vx: 0,
      vy: 0,
      degree: tagCounts.get(tag) ?? 1,
    })
  })

  plants.forEach((plant, i) => {
    const angle = (Math.PI * 2 * i) / plants.length
    nodes.push({
      id: `plant:${plant.id}`,
      label: plant.name,
      kind: 'plant',
      color: plant.accent,
      radius: 5 + plant.therapeutic.length * 1.2,
      x: WIDTH / 2 + Math.cos(angle) * 235,
      y: HEIGHT / 2 + Math.sin(angle) * 205,
      vx: 0,
      vy: 0,
      degree: plant.therapeutic.length,
    })
    for (const tag of plant.therapeutic) edges.push({ source: `plant:${plant.id}`, target: `tag:${tag}` })
  })

  return { nodes, edges }
}

/** One Verlet-ish step: link springs, all-pairs repulsion, gentle centring. */
function step(nodes: Node[], edges: Edge[], byId: Map<string, Node>, alpha: number) {
  for (const edge of edges) {
    const a = byId.get(edge.source)!
    const b = byId.get(edge.target)!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy) || 1
    const rest = 88
    const force = ((dist - rest) / dist) * 0.045 * alpha
    a.vx += dx * force
    a.vy += dy * force
    b.vx -= dx * force
    b.vy -= dy * force
  }

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      let dist = Math.hypot(dx, dy)
      if (dist < 0.01) dist = 0.01
      // Tag nodes carry a caption underneath, so they need room for it.
      const captionRoom = (a.kind === 'tag' ? 15 : 0) + (b.kind === 'tag' ? 15 : 0)
      const min = a.radius + b.radius + 24 + captionRoom
      const repel = (900 / (dist * dist)) * alpha
      const push = dist < min ? ((min - dist) / dist) * 0.5 : 0
      const fx = (dx / dist) * repel + dx * push
      const fy = (dy / dist) * repel + dy * push
      a.vx -= fx
      a.vy -= fy
      b.vx += fx
      b.vy += fy
    }
  }

  for (const node of nodes) {
    node.vx += (WIDTH / 2 - node.x) * 0.0022 * alpha
    node.vy += (HEIGHT / 2 - node.y) * 0.0026 * alpha
    node.vx *= 0.84
    node.vy *= 0.84
    node.x = Math.max(node.radius + 4, Math.min(WIDTH - node.radius - 4, node.x + node.vx))
    node.y = Math.max(node.radius + 4, Math.min(HEIGHT - node.radius - 4, node.y + node.vy))
  }
}

export function Constellation({ className }: { className?: string }) {
  const graph = useMemo(buildGraph, [])
  const [, force] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const frame = useRef(0)

  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph])

  useEffect(() => {
    let alpha = 1
    let raf = 0
    const tick = () => {
      // Several steps per frame: it settles in ~1s of wall clock, and
      // the motion of it settling is half the appeal.
      for (let i = 0; i < 2; i++) step(graph.nodes, graph.edges, byId, alpha)
      alpha *= 0.985
      frame.current += 1
      force(frame.current)
      if (alpha > 0.02) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [graph, byId])

  const neighbours = useMemo(() => {
    if (!hovered) return null
    const set = new Set<string>([hovered])
    for (const e of graph.edges) {
      if (e.source === hovered) set.add(e.target)
      if (e.target === hovered) set.add(e.source)
    }
    return set
  }, [hovered, graph.edges])

  const dim = (id: string) => (neighbours && !neighbours.has(id) ? 0.12 : 1)
  const hoveredNode = hovered ? byId.get(hovered) : null

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full touch-none" role="img" aria-label="Plants linked to what they treat">
        <g>
          {graph.edges.map((edge, i) => {
            const a = byId.get(edge.source)!
            const b = byId.get(edge.target)!
            const lit = neighbours ? neighbours.has(edge.source) && neighbours.has(edge.target) : false
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={lit ? b.color : 'var(--line-strong)'}
                strokeWidth={lit ? 1.6 : 0.7}
                opacity={neighbours ? (lit ? 0.85 : 0.06) : 0.34}
              />
            )
          })}
        </g>

        {graph.nodes.map((node) => {
          const isTag = node.kind === 'tag'
          const plantId = isTag ? null : node.id.slice('plant:'.length)
          const body = (
            <g
              opacity={dim(node.id)}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer', transition: 'opacity 0.25s' }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={isTag ? node.color : `color-mix(in srgb, ${node.color} 55%, var(--surface-raised))`}
                stroke={isTag ? 'var(--surface-raised)' : node.color}
                strokeWidth={isTag ? 2 : 1.3}
              />
            </g>
          )
          return plantId ? (
            <Link key={node.id} to={`/plant/${plantId}`} aria-label={node.label}>
              {body}
            </Link>
          ) : (
            <g key={node.id}>{body}</g>
          )
        })}

        {/* Every label in one pass after every circle. SVG paints in document
            order, so a name drawn beside its own node would otherwise vanish
            under whichever node happened to be drawn next. */}
        <g style={{ pointerEvents: 'none' }}>
          {graph.nodes.map((node) => {
            const isTag = node.kind === 'tag'
            /* Complaints are always named. Plants are named while something is
             * isolated and they belong to it — hovering "Digestive" to learn
             * which herbs settle a stomach is no use if the answer is a dozen
             * anonymous circles. The rest stay unlabelled: all twenty-five at
             * once is a thicket nobody can read. */
            if (!isTag && !neighbours?.has(node.id)) return null
            return (
              <text
                key={node.id}
                x={node.x}
                y={node.y + node.radius + 12}
                textAnchor="middle"
                fontSize={isTag ? 10.5 : 9.5}
                fontWeight={isTag ? 700 : 500}
                fill={isTag ? 'var(--ink)' : 'var(--ink-soft)'}
                stroke="var(--surface-raised)"
                strokeWidth={3.5}
                strokeLinejoin="round"
                paintOrder="stroke"
                opacity={dim(node.id)}
                style={{ transition: 'opacity 0.25s' }}
              >
                {wrapLabel(node.label).map((line, i) => (
                  <tspan key={line} x={node.x} dy={i === 0 ? 0 : 11}>
                    {line}
                  </tspan>
                ))}
              </text>
            )
          })}
        </g>
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.74rem] text-ink-faint">
        <span>
          {hoveredNode
            ? `${hoveredNode.label} — ${hoveredNode.degree} ${hoveredNode.kind === 'tag' ? 'plants' : 'uses'}`
            : 'Hover a node to isolate it · click a plant to open its entry'}
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-accent" /> complaint
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-accent" /> plant
          </span>
        </span>
      </div>
    </div>
  )
}
