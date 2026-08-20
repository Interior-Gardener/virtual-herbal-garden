/* ------------------------------------------------------------------ *
 * Botanical + procedural-model type system.
 * The same `PlantModelSpec` drives the 3D generator and the 2D
 * botanical-plate illustrator, so every plant looks consistent in both.
 * ------------------------------------------------------------------ */

export type LeafShape =
  | 'ovate'
  | 'lanceolate'
  | 'cordate'
  | 'linear'
  | 'obovate'
  | 'elliptic'
  | 'reniform'
  | 'spatulate'
  | 'succulent'
  | 'deltoid'

export type CompoundType = 'simple' | 'trifoliate' | 'pinnate' | 'palmate' | 'bipinnate'

export type LeafArrangement = 'alternate' | 'opposite' | 'whorled' | 'basal'

export type Archetype = 'herb' | 'shrub' | 'tree' | 'climber' | 'rosette' | 'grass' | 'creeper'

export interface PlantModelSpec {
  archetype: Archetype
  /** Display height in world units (roughly metres, garden-scaled). */
  height: number
  stem: {
    color: string
    radius: number
    /** 0 = ramrod straight, 1 = strongly meandering. */
    curve?: number
    woody?: boolean
    /** Square stems — the Lamiaceae tell. */
    square?: boolean
  }
  branching: {
    levels: number
    count: number
    /** Degrees from the parent axis. */
    angle: number
    /** Fraction of the parent's length where branching begins. */
    startAt?: number
    taper?: number
  }
  leaf: {
    shape: LeafShape
    compound?: CompoundType
    leaflets?: number
    length: number
    width: number
    arrangement: LeafArrangement
    /** Leaf-bearing nodes per axis. */
    density?: number
    top: string
    bottom: string
    /** 0 = entire margin, 1 = deeply toothed. */
    serration?: number
    droop?: number
    curl?: number
    thickness?: number
    gloss?: number
  }
  flower?: {
    form: 'spike' | 'umbel' | 'panicle' | 'solitary' | 'cluster' | 'catkin'
    color: string
    centre?: string
    size: number
    count: number
    petals?: number
  }
  fruit?: {
    shape: 'round' | 'ovoid' | 'pod' | 'berry'
    color: string
    size: number
    count: number
  }
  /** Visible underground organ, drawn at the soil line. */
  rhizome?: { color: string; size: number }
  ground?: 'soil' | 'water' | 'sand' | 'rock'
}

export type AyushSystem = 'Ayurveda' | 'Siddha' | 'Unani' | 'Homoeopathy' | 'Sowa-Rigpa' | 'Yoga & Naturopathy'

export type PlantType = 'Herb' | 'Shrub' | 'Tree' | 'Climber' | 'Grass' | 'Succulent'

export type TherapeuticTag =
  | 'Digestive'
  | 'Immunity'
  | 'Respiratory'
  | 'Skin & Hair'
  | 'Mind & Sleep'
  | 'Heart & Circulation'
  | 'Joints & Pain'
  | 'Metabolic'
  | 'Liver'
  | 'Women’s Health'
  | 'Kidney & Urinary'
  | 'Wound Care'

export type RegionTag =
  | 'Himalayan'
  | 'Indo-Gangetic Plains'
  | 'Western Ghats'
  | 'Eastern Ghats'
  | 'Deccan Plateau'
  | 'Arid & Desert'
  | 'Coastal'
  | 'North-East India'
  | 'Pan-India'

export type Conservation = 'Cultivated' | 'Least Concern' | 'Vulnerable' | 'Endangered' | 'Critically Endangered'

export interface AyurvedicProfile {
  rasa: string[]
  guna: string[]
  virya: string
  vipaka: string
  dosha: string
}

export interface Plant {
  id: string
  name: string
  botanical: string
  family: string
  /** Localised & classical names, keyed by language label. */
  names: Record<string, string>
  tagline: string
  description: string
  habitat: string
  morphology: string
  regions: RegionTag[]
  type: PlantType
  partsUsed: string[]
  systems: AyushSystem[]
  therapeutic: TherapeuticTag[]
  uses: { title: string; detail: string }[]
  ayurvedic: AyurvedicProfile
  preparations: { name: string; detail: string }[]
  cultivation: {
    soil: string
    climate: string
    propagation: string
    spacing: string
    water: string
    harvest: string
    tips: string[]
  }
  precautions: string[]
  conservation: Conservation
  facts: string[]
  /** 1 = windowsill-easy, 3 = specialist. */
  difficulty: 1 | 2 | 3
  accent: string
  model: PlantModelSpec
}

export interface TourStop {
  plantId: string
  headline: string
  narration: string
}

export interface Tour {
  id: string
  title: string
  theme: TherapeuticTag | 'Foundations' | 'Rare & Endangered'
  subtitle: string
  blurb: string
  minutes: number
  accent: string
  stops: TourStop[]
}
