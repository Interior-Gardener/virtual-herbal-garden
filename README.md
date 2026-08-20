# Vanaspati — Virtual Herbal Garden

An interactive 3D garden of AYUSH medicinal plants. Twenty-five species, six themed beds,
six guided tours, and a compendium written the way a vaidya would describe a plant —
rasa, guna, virya, vipaka, the part that carries the medicine, and the cautions that matter.

Built for the Smart India Hackathon problem statement on a Virtual Herbal Garden.

---

## The idea that makes it work

**Every plant in this garden is grown at run time from its botanical description.**
There is not a single downloaded 3D model, texture, or photograph in the project.

A plant's morphology — leaf shape, phyllotaxy, branching order, inflorescence type,
whether the stem is square — is written as data:

```ts
model: {
  archetype: 'herb',
  height: 0.62,
  stem: { color: '#6a7f4a', radius: 0.012, square: true },   // Lamiaceae tell
  branching: { levels: 2, count: 5, angle: 42, startAt: 0.25 },
  leaf: { shape: 'ovate', arrangement: 'opposite', serration: 0.55, … },
  flower: { form: 'spike', color: '#a06fb8', petals: 5, … },
}
```

…and a generator turns that into geometry. The same numbers also drive the 2D specimen
plates on every card, so a plant's silhouette is recognisably itself in both places.

This matters for three reasons:

1. **It scales.** Adding a plant is thirty lines of data, not a week in Blender.
2. **It's honest.** The model is derived from the botany, so an opposite-leaved square-stemmed
   mint really looks like one, and a pinnate neem frond really has 9–19 leaflets.
3. **It's tiny.** The entire garden — 25 species, ground plan, grass — downloads as code.
   No asset pipeline, no CDN, works offline after first load.

---

## What's in it

| Requirement | How it's met |
| --- | --- |
| Interactive 3D models | Orbit, zoom and inspect any plant; procedurally generated with wind, venation and bark shading |
| Detailed information | Botanical + family + names in six languages, habitat, morphology, parts used, Ayurvedic profile, classical preparations, cultivation calendar, precautions |
| Multimedia | Four botanical plates per species (habit, leaf study, inflorescence, medicinal part), four audio-description tracks, animated 3D specimen |
| Search & filter | Weighted fuzzy search over names, symptoms and Sanskrit synonyms; facets for use, plant type, part used, region, AYUSH system and conservation status |
| Virtual tours | Six themed walks that fly the camera bed to bed with narration |
| User interaction | Bookmarks, autosaving study notes, progress tracking, native share sheet, social links, downloadable study sheet |

### Beyond the brief

- **Labelled part hotspots** on the 3D model — tap "Bark" and see where on the tree it comes from.
- **A real scale bar**, so a 14 cm creeper and a 3 m tree are not silently drawn the same size.
- **Conservation framing** — one whole tour is about why guggulu is Critically Endangered,
  because the medicinal part is the part that kills the plant.
- **Offline-first**: no network calls after load. Narration uses the browser's own speech synthesis.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run lint
```

Node 20+ recommended (developed on Node 25).

Deploying to any static host works; `public/_redirects` and `vercel.json` are included so
client-side routes such as `/plant/tulsi` survive a hard refresh.

---

## Tech

- **React 19** + **TypeScript** + **Vite 8**
- **three.js** via **@react-three/fiber** and **@react-three/drei**
- **Tailwind CSS v4** with a semantic token layer for light/dark
- **Zustand** (persisted to `localStorage`) for bookmarks, notes and settings
- **React Router 7**

No backend. Everything a visitor saves lives on their own device.

---

## How the garden is put together

```
src/
  data/            25 plants, 6 beds, 6 tours — the compendium
  types/plant.ts   the schema that drives both the prose and the geometry
  three/
    procedural/
      leaf.ts      parametric blade: a profile function per botanical leaf shape
      plant.ts     archetype skeletons, phyllotaxy, flowers, fruit, merging
      rng.ts       seeded PRNG, so a plant always grows the same way
    materials.ts   one shader for the whole garden: wind, venation, bark
    gardenTexture.ts   the garden plan, painted once to a canvas
    GardenScene.tsx    beds, plaza, instanced planting, camera rig
    PlantViewer.tsx    single-specimen viewer with part hotspots
  lib/
    plate.ts       the same leaf maths, projected to SVG specimen plates
    search.ts      weighted index + fuzzy fallback
    speech.ts      audio descriptions via SpeechSynthesis
  routes/          Garden · Explore · PlantPage · Tours · TourPage · MyGarden
```

### Performance notes

Rendering twenty-five distinct plants without instancing would be hopeless, so:

- Each plant merges into **at most six geometries** — one per material — instead of hundreds of meshes.
- **Mesh resolution and leaf count are separate knobs.** A garden seen from ten metres needs many
  leaves of few triangles; a specimen under inspection needs the opposite.
- A **leaf budget** with an up-front census keeps branching from exploding, and thins the whole
  plant evenly rather than spending everything on the first limb.
- Lawn and bed planting are **two instanced meshes**, roughly 2,600 tufts in two draw calls.
- Foliage cards take the **ground's normal**, the standard trick that stops vertical quads
  going black.
- All foliage shares **one compiled shader program**, via `customProgramCacheKey`.
- Quality is auto-detected from device capability and overridable in Settings.

The whole garden is about 60k triangles on the light preset and builds in under 100 ms.

---

## About the plant data

Botanical descriptions, Ayurvedic properties and cultivation notes follow the conventions of
the Ayurvedic Pharmacopoeia of India and standard field floras. Conservation statuses reflect
IUCN Red List and Indian regulatory listings.

**This is an educational resource, not medical advice.** Every plant page carries its
contraindications, and several — sarpagandha and liquorice especially — are genuinely
dangerous when self-prescribed. Consult a registered AYUSH practitioner.

---

## Known limits

- Speech narration depends on the browser's installed voices; quality varies, and it is
  unavailable in a few browsers. The UI disables the control rather than failing silently.
- Models are botanically faithful in structure, not photoreal. That is a deliberate trade:
  a stylised plant that is *correct* teaches better than a pretty one that is not.
- Fifteen of the twenty-five species have flowers modelled; the rest flower rarely in
  cultivation and are shown vegetative, which is how you would actually find them.
