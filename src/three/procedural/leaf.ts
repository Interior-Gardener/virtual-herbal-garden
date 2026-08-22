import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { CompoundType, LeafShape, PlantModelSpec } from '../../types/plant'

/* ------------------------------------------------------------------ *
 * Leaf geometry.
 *
 * A leaf is a parametric surface swept along its midrib. `t` runs 0→1
 * from petiole to tip; `s` runs -1→1 across the blade. The blade's
 * half-width at any point is given by a profile function chosen from
 * the botanical shape vocabulary, so a lanceolate leaf and a reniform
 * leaf come out of the same code with genuinely different silhouettes.
 * ------------------------------------------------------------------ */

/** Half-width of the blade at position `t` along the midrib, 0→1. */
export function leafProfile(shape: LeafShape, t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  switch (shape) {
    case 'elliptic':
      return Math.sin(Math.PI * clamped)
    case 'ovate':
      return Math.sin(Math.PI * Math.pow(clamped, 0.75))
    case 'obovate':
      return Math.sin(Math.PI * Math.pow(clamped, 1.45))
    case 'lanceolate':
      return Math.pow(Math.sin(Math.PI * Math.pow(clamped, 0.82)), 1.35)
    case 'linear':
      return Math.pow(Math.sin(Math.PI * clamped), 0.2)
    case 'cordate':
      return Math.sin(Math.PI * Math.pow(clamped, 0.55))
    case 'reniform':
      return Math.pow(Math.sin(Math.PI * Math.pow(clamped, 0.45)), 0.75)
    case 'spatulate':
      return Math.sin(Math.PI * Math.pow(clamped, 1.8))
    case 'deltoid':
      return Math.sqrt(1 - clamped) * Math.min(1, clamped * 7 + 0.15)
    case 'succulent':
      return Math.pow(1 - clamped, 0.5) * Math.min(1, clamped * 9 + 0.1)
    default:
      return Math.sin(Math.PI * clamped)
  }
}

/** Shapes whose blade runs past the attachment point in a heart-shaped cleft. */
function notchDepth(shape: LeafShape): number {
  if (shape === 'cordate') return 0.17
  if (shape === 'reniform') return 0.3
  return 0
}

export interface LeafBuildOptions {
  shape: LeafShape
  length: number
  width: number
  /** 0 = entire margin, 1 = deeply toothed. */
  serration?: number
  /** Bend of the whole blade away from the attachment plane. */
  droop?: number
  /** Cupping across the blade — a channelled leaf like aloe runs high. */
  curl?: number
  /** Half-thickness at the leaf's fattest point; 0 gives a flat sheet. */
  thickness?: number
  /** Horny marginal prickles, as on an aloe. 0 = none, 1 = long teeth. */
  teeth?: number
  /** Longitudinal segments. */
  rows?: number
  /** Segments across the blade (per half). */
  cols?: number
}

/**
 * Builds a leaf lying in the XY plane, base at the origin, tip toward +Y,
 * with the blade surface facing +Z. Carries an `aFlex` attribute (0 at the
 * petiole, 1 at the tip) that the wind shader uses to flutter the tip.
 */
export function buildLeafGeometry(opts: LeafBuildOptions): THREE.BufferGeometry {
  const {
    shape,
    length,
    width,
    serration = 0,
    droop = 0.25,
    curl = 0.25,
    thickness = 0,
    teeth = 0,
    rows = 9,
    cols = 3,
  } = opts

  const notch = notchDepth(shape)
  const scallops = 9
  const halfW = width * 0.5
  const shells = thickness > 0 ? 2 : 1
  const cross = cols * 2 + 1

  const positions: number[] = []
  const uvs: number[] = []
  const flex: number[] = []
  const indices: number[] = []

  for (let shell = 0; shell < shells; shell++) {
    const sign = shell === 0 ? 1 : -1
    const vertexBase = shell * (rows + 1) * cross

    for (let r = 0; r <= rows; r++) {
      const t = r / rows
      let profile = leafProfile(shape, t)

      // Toothed margins: nibble the outline in a regular saw.
      if (serration > 0) {
        const tooth = 0.5 + 0.5 * Math.cos(t * scallops * Math.PI * 2)
        profile *= 1 - serration * 0.16 * tooth
      }

      const rowHalf = profile * halfW

      for (let c = 0; c < cross; c++) {
        const s = c / cols - 1 // -1 → 1
        const x = s * rowHalf

        // Heart-shaped bases: the basal lobes sweep back past the petiole.
        const notchFall = notch > 0 ? Math.max(0, 1 - t / 0.28) : 0
        const y = t * length - notch * length * notchFall * Math.abs(s)

        // Blade droops away along its length and cups across its width.
        const zDroop = -droop * length * t * t
        const zCurl = curl * rowHalf * s * s
        const lens = thickness > 0 ? thickness * profile * Math.sqrt(Math.max(0, 1 - s * s)) : 0

        positions.push(x, y, zDroop + zCurl + sign * lens)
        uvs.push((s + 1) * 0.5, t)
        flex.push(t * t)
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cross - 1; c++) {
        const a = vertexBase + r * cross + c
        const b = a + 1
        const d = a + cross
        const e = d + 1
        if (sign > 0) indices.push(a, d, b, b, d, e)
        else indices.push(a, b, d, b, e, d)
      }
    }
  }

  // Horny marginal prickles. The blade's own surface can't carry them — a
  // scalloped outline reads as a wave, not a spine — so each tooth is a small
  // triangle standing off the margin, angled toward the tip like the real thing.
  if (teeth > 0) {
    const margin = (t: number, sign: number) => {
      let profile = leafProfile(shape, t)
      if (serration > 0) {
        const wave = 0.5 + 0.5 * Math.cos(t * scallops * Math.PI * 2)
        profile *= 1 - serration * 0.16 * wave
      }
      const rowHalf = profile * halfW
      const notchFall = notch > 0 ? Math.max(0, 1 - t / 0.28) : 0
      return [
        sign * rowHalf,
        t * length - notch * length * notchFall,
        -droop * length * t * t + curl * rowHalf,
      ] as const
    }

    // Many small spines rather than a few big ones — an aloe margin is a comb,
    // not a holly leaf.
    const count = Math.max(6, Math.round(rows * 1.8))
    const reach = width * 0.12 * teeth
    for (let sign = -1; sign <= 1; sign += 2) {
      for (let i = 0; i < count; i++) {
        // Teeth run from just above the sheath to just short of the tip.
        const t0 = 0.12 + (0.84 * i) / count
        const t1 = t0 + 0.5 / count
        const a = margin(t0, sign)
        const b = margin(t1, sign)
        const base = positions.length / 3
        const apex = [
          (a[0] + b[0]) * 0.5 + sign * reach * 0.86,
          (a[1] + b[1]) * 0.5 + reach * 0.62,
          (a[2] + b[2]) * 0.5,
        ]
        for (const [x, y, z] of [a, b, apex]) {
          positions.push(x, y, z)
          uvs.push(sign > 0 ? 1 : 0, t0)
          flex.push(t0 * t0)
        }
        indices.push(base, base + 1, base + 2)
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('aFlex', new THREE.Float32BufferAttribute(flex, 1))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Assembles one "leaf unit" — what sits at a single node. For a simple leaf
 * that is one blade; for a compound leaf it is a rachis carrying leaflets in
 * the pinnate, trifoliate or palmate arrangement.
 */
export function buildLeafUnit(
  leaf: PlantModelSpec['leaf'],
  quality: { rows: number; cols: number; leafletScale: number },
): THREE.BufferGeometry {
  const compound: CompoundType = leaf.compound ?? 'simple'
  // Leaflets are small on screen and numerous — they get a coarser mesh.
  const fine = compound === 'simple'
  const rows = fine ? quality.rows : Math.max(2, Math.round(quality.rows * 0.5))
  const cols = fine ? quality.cols : 1
  const blade = () =>
    buildLeafGeometry({
      shape: leaf.shape,
      length: leaf.length,
      width: leaf.width,
      serration: leaf.serration,
      droop: leaf.droop,
      curl: leaf.curl,
      thickness: leaf.thickness,
      teeth: leaf.teeth,
      rows,
      cols,
    })

  if (compound === 'simple') return blade()

  const template = blade()
  const parts: THREE.BufferGeometry[] = []
  const count = Math.max(3, Math.round((leaf.leaflets ?? 5) * quality.leafletScale))

  const place = (
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    rotZ: number,
    scale = 1,
  ) => {
    const g = geo.clone()
    const m = new THREE.Matrix4()
      .makeTranslation(x, y, 0)
      .multiply(new THREE.Matrix4().makeRotationZ(rotZ))
      .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
    g.applyMatrix4(m)
    parts.push(g)
  }

  if (compound === 'trifoliate') {
    const stalk = leaf.length * 0.55
    parts.push(buildRachis(stalk, leaf.width * 0.06))
    place(template, 0, stalk, 0)
    place(template, 0, stalk, 0.85, 0.86)
    place(template, 0, stalk, -0.85, 0.86)
  } else if (compound === 'palmate') {
    const stalk = leaf.length * 0.7
    parts.push(buildRachis(stalk, leaf.width * 0.06))
    for (let i = 0; i < count; i++) {
      const spread = (i / (count - 1) - 0.5) * 1.9
      place(template, 0, stalk, spread, 1 - Math.abs(spread) * 0.18)
    }
  } else {
    // Pinnate and bipinnate: leaflet pairs marching up a rachis.
    const pairs = Math.max(2, Math.floor(count / 2))
    const step = leaf.length * 0.82
    const rachisLength = step * (pairs + 0.9)
    parts.push(buildRachis(rachisLength, leaf.width * 0.07))
    for (let i = 0; i < pairs; i++) {
      const y = step * (i + 0.9)
      // Leaflets shorten toward the tip, as they do on a real neem frond.
      const scale = 1 - Math.pow(i / pairs, 2) * 0.3
      place(template, 0, y, 1.15, scale)
      place(template, 0, y, -1.15, scale)
    }
    place(template, 0, rachisLength, 0, 0.8)
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  template.dispose()
  return merged ?? template
}

/** The slender stalk of a compound leaf. */
function buildRachis(length: number, radius: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(radius * 0.6, radius, length, 4, 1, true)
  g.translate(0, length * 0.5, 0)
  const count = g.attributes.position.count
  const flex = new Float32Array(count)
  const pos = g.attributes.position
  for (let i = 0; i < count; i++) flex[i] = Math.pow(pos.getY(i) / length, 2)
  g.setAttribute('aFlex', new THREE.BufferAttribute(flex, 1))
  if (!g.attributes.uv) {
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2).fill(0.5), 2))
  }
  return g
}
