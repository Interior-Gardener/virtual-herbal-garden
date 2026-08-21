/* ------------------------------------------------------------------ *
 * Ayurvedic prose → structured numbers.
 *
 * The compendium stores rasa, virya, vipaka and dosha the way a text
 * would write them ("Pacifies Kapha and Vata; may aggravate Pitta").
 * The charts need axes, so this module reads that prose back into the
 * six tastes, a heating/cooling scale and a per-dosha verdict.
 * Parsing rather than duplicating keeps one source of truth.
 * ------------------------------------------------------------------ */

import type { Plant } from '../types/plant'

/* ------------------------------- rasa ------------------------------- */

export const RASAS = [
  { key: 'Madhura', english: 'Sweet', color: '#d9a13c' },
  { key: 'Amla', english: 'Sour', color: '#9db83f' },
  { key: 'Lavana', english: 'Salty', color: '#4aa3a8' },
  { key: 'Katu', english: 'Pungent', color: '#c9743f' },
  { key: 'Tikta', english: 'Bitter', color: '#4f9d5c' },
  { key: 'Kashaya', english: 'Astringent', color: '#7c72c4' },
] as const

export type RasaKey = (typeof RASAS)[number]['key']

/**
 * A value per taste on 0..1. A plant listing two rasas scores both, but
 * the first-listed (or one flagged "dominant") carries more weight —
 * which is how the pharmacopoeias order them.
 */
export function rasaProfile(plant: Plant): Record<RasaKey, number> {
  const out = Object.fromEntries(RASAS.map((r) => [r.key, 0])) as Record<RasaKey, number>
  const listed = plant.ayurvedic.rasa
  const joined = listed.join(' | ')

  const present = RASAS.filter((r) => joined.includes(r.key))
  present.forEach((rasa) => {
    const index = listed.findIndex((entry) => entry.includes(rasa.key))
    const dominant = /dominant/i.test(listed[index] ?? '')
    // First listed = 1.0, each later one steps down, floor 0.45.
    const rank = index < 0 ? present.length - 1 : index
    out[rasa.key] = dominant ? 1 : Math.max(0.45, 1 - rank * 0.22)
  })

  return out
}

/* ------------------------------- virya ------------------------------ */

export type Virya = 'heating' | 'cooling'

export function viryaOf(plant: Plant): Virya {
  return /ushna|heating/i.test(plant.ayurvedic.virya) ? 'heating' : 'cooling'
}

/** -1 (deeply cooling) … +1 (deeply heating), nudged by the gunas. */
export function viryaScale(plant: Plant): number {
  const base = viryaOf(plant) === 'heating' ? 0.62 : -0.62
  const guna = plant.ayurvedic.guna.join(' ').toLowerCase()
  let nudge = 0
  if (/tikshna|sharp/.test(guna)) nudge += 0.22
  if (/laghu|light/.test(guna)) nudge += 0.08
  if (/guru|heavy/.test(guna)) nudge -= 0.08
  if (/snigdha|unctuous|oily/.test(guna)) nudge -= 0.12
  return Math.max(-1, Math.min(1, base + (base > 0 ? nudge : -nudge)))
}

/* ------------------------------ vipaka ------------------------------ */

export function vipakaOf(plant: Plant): { key: string; english: string; color: string } {
  const match = RASAS.find((r) => plant.ayurvedic.vipaka.includes(r.key))
  return match ?? { key: 'Madhura', english: 'Sweet', color: '#d9a13c' }
}

/* ------------------------------- dosha ------------------------------ */

export const DOSHAS = [
  { key: 'Vata', gloss: 'air & movement', color: '#7c72c4' },
  { key: 'Pitta', gloss: 'fire & transformation', color: '#c9743f' },
  { key: 'Kapha', gloss: 'earth & structure', color: '#4aa3a8' },
] as const

export type DoshaKey = (typeof DOSHAS)[number]['key']
/** -1 pacifies · 0 neutral · +1 aggravates. */
export type DoshaEffect = -1 | 0 | 1

export function doshaProfile(plant: Plant): Record<DoshaKey, DoshaEffect> {
  const text = plant.ayurvedic.dosha
  const out: Record<DoshaKey, DoshaEffect> = { Vata: 0, Pitta: 0, Kapha: 0 }

  // Clauses are separated by ';' or ',' — each one either pacifies or aggravates.
  for (const clause of text.split(/[;,]/)) {
    const aggravates = /aggravat|increase/i.test(clause)
    const pacifies = /pacif|balanc|calm|reduce/i.test(clause)
    if (!aggravates && !pacifies) continue

    const effect: DoshaEffect = aggravates ? 1 : -1
    if (/all three|tridosha/i.test(clause) && !aggravates) {
      for (const d of DOSHAS) out[d.key] = -1
      continue
    }
    for (const d of DOSHAS) {
      if (clause.includes(d.key)) out[d.key] = effect
    }
  }

  return out
}

export function doshaLabel(effect: DoshaEffect): string {
  return effect < 0 ? 'Pacifies' : effect > 0 ? 'Aggravates' : 'Neutral'
}

/* --------------------------- conservation --------------------------- */

export const CONSERVATION_TIERS = [
  { key: 'Cultivated', color: '#4f9d5c', note: 'Grown deliberately; wild pressure is low.' },
  { key: 'Least Concern', color: '#9db83f', note: 'Widespread and stable in the wild.' },
  { key: 'Vulnerable', color: '#d9a13c', note: 'Declining fast enough to matter.' },
  { key: 'Endangered', color: '#c9743f', note: 'Wild populations are shrinking sharply.' },
  { key: 'Critically Endangered', color: '#b6403d', note: 'One step from extinction in the wild.' },
] as const

/* ------------------------------ regions ----------------------------- */

/**
 * Where each region sits on the stylised map, in its 420x480 viewBox,
 * and which side of its circle the caption hangs off. Captions point
 * outward from the middle of the country so they never sit on top of a
 * neighbouring region.
 */
export interface RegionPoint {
  x: number
  y: number
  label: string
  side: 'above' | 'below' | 'left' | 'right'
}

export const REGION_POINTS: Record<string, RegionPoint> = {
  Himalayan: { x: 170, y: 140, label: 'Himalayan', side: 'above' },
  'Indo-Gangetic Plains': { x: 185, y: 192, label: 'Indo-Gangetic', side: 'right' },
  'Arid & Desert': { x: 75, y: 205, label: 'Arid & Desert', side: 'below' },
  'North-East India': { x: 350, y: 200, label: 'North-East', side: 'below' },
  'Pan-India': { x: 290, y: 238, label: 'Pan-India', side: 'right' },
  Coastal: { x: 232, y: 268, label: 'Coastal', side: 'left' },
  'Deccan Plateau': { x: 140, y: 285, label: 'Deccan', side: 'left' },
  'Eastern Ghats': { x: 178, y: 322, label: 'Eastern Ghats', side: 'right' },
  'Western Ghats': { x: 122, y: 348, label: 'Western Ghats', side: 'left' },
}
