import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { gardenBeds, getPlant, plants, type GardenBed } from '../data/plants'
import { tours } from '../data/tours'
import { GardenScene, OVERVIEW, type CameraGoal } from '../three/GardenScene'
import { BotanicalPlate } from '../components/BotanicalPlate'
import { Icon } from '../components/ui/Icon'
import { Badge, Button, cx } from '../components/ui/primitives'
import { useGarden } from '../store/useGarden'
import { useGardenLayout } from '../three/GardenScene'

export default function Garden() {
  const [params, setParams] = useSearchParams()
  const [goal, setGoal] = useState<CameraGoal>(OVERVIEW)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeBed, setActiveBed] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [showLabels, setShowLabels] = useState(true)

  const layout = useGardenLayout()
  const visited = useGarden((s) => s.visited)
  const bookmarks = useGarden((s) => s.bookmarks)
  const selected = getPlant(selectedId ?? undefined)

  const focusBed = useMemo(
    () => (bed: GardenBed) => {
      setActiveBed(bed.id)
      setSelectedId(null)
      setGoal({ target: [bed.position[0], 0.6, bed.position[1]], distance: 7.4, lift: 0.42 })
    },
    [],
  )

  const focusPlant = useMemo(
    () => (id: string) => {
      const placement = layout.find((p) => p.plant.id === id)
      if (!placement) return
      setSelectedId(id)
      setActiveBed(placement.bed.id)
      const height = placement.plant.model.height * placement.scale
      setGoal({
        target: [placement.position[0], Math.max(0.35, height * 0.5), placement.position[2]],
        distance: Math.max(1.9, height * 2.5),
        lift: 0.4,
      })
    },
    [layout],
  )

  // Deep link: /?bed=mind focuses that bed on arrival.
  useEffect(() => {
    const bedId = params.get('bed')
    if (!bedId) return
    const bed = gardenBeds.find((b) => b.id === bedId)
    if (bed) {
      focusBed(bed)
      setShowIntro(false)
    }
    params.delete('bed')
    setParams(params, { replace: true })
  }, [params, setParams, focusBed])

  const goOverview = () => {
    setActiveBed(null)
    setSelectedId(null)
    setGoal({ ...OVERVIEW })
  }

  const idleSpin = !selectedId && !activeBed && showIntro

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GardenScene
        goal={goal}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        onSelect={focusPlant}
        onSelectBed={focusBed}
        idleSpin={idleSpin}
        showLabels={showLabels && !selectedId}
      />

      {/* ---------------- Intro card ---------------- */}
      {showIntro && (
        <div className="animate-fade-up pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4 sm:justify-start sm:p-6">
          <div className="glass pointer-events-auto max-w-sm rounded-3xl border border-line p-5 shadow-[var(--shadow-lift)]">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-accent uppercase">Welcome</p>
            <h1 className="mt-1.5 font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">
              A herbal garden you can walk through
            </h1>
            <p className="mt-2 text-[0.87rem] leading-relaxed text-ink-soft text-balance-pretty">
              Twenty-five AYUSH medicinal plants, grown here from botanical descriptions rather than downloaded
              models. Drag to look around, click any plant to meet it, or take a themed walk.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => setShowIntro(false)} icon="compass">
                Explore freely
              </Button>
              <Link to={`/tours/${tours[0].id}`}>
                <Button variant="secondary" size="sm" icon="route">
                  Take the intro tour
                </Button>
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-[0.72rem] text-ink-faint">
              <span>{plants.length} plants</span>
              <span>{gardenBeds.length} themed beds</span>
              <span>{tours.length} tours</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Bed navigator ---------------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 pb-19 sm:p-5 md:pb-5">
        <div className="scrollbar-none pointer-events-auto mx-auto flex max-w-full items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={goOverview}
            className={cx(
              'glass flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[0.8rem] font-medium transition-colors',
              !activeBed ? 'text-ink' : 'text-ink-faint hover:text-ink-soft',
            )}
          >
            <Icon name="map" size={15} />
            Whole garden
          </button>
          {gardenBeds.map((bed) => {
            const seen = bed.plantIds.filter((id) => visited.includes(id)).length
            return (
              <button
                key={bed.id}
                onClick={() => focusBed(bed)}
                className={cx(
                  'glass flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.8rem] font-medium whitespace-nowrap transition-all',
                  activeBed === bed.id ? 'border-transparent text-white' : 'border-line text-ink-soft hover:text-ink',
                )}
                style={activeBed === bed.id ? { background: bed.accent } : undefined}
              >
                <span className="size-2 rounded-full" style={{ background: bed.accent }} />
                {bed.name}
                <span className={cx('text-[0.7rem] tabular-nums', activeBed === bed.id ? 'opacity-75' : 'text-ink-faint')}>
                  {seen}/{bed.plantIds.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ---------------- Selected plant panel ---------------- */}
      {selected && (
        <aside className="animate-fade-up absolute inset-x-3 bottom-36 z-20 md:inset-x-auto md:top-6 md:right-6 md:bottom-auto md:w-[22rem]">
          <div className="glass overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-lift)]">
            <div className="flex items-start gap-3 p-4">
              <span
                className="grid size-16 shrink-0 place-items-center rounded-2xl"
                style={{ background: `color-mix(in srgb, ${selected.accent} 16%, transparent)` }}
              >
                <BotanicalPlate plant={selected} className="size-14" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg leading-tight font-semibold">{selected.name}</h2>
                <p className="truncate text-[0.76rem] text-ink-faint italic">{selected.botanical}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {selected.therapeutic.slice(0, 2).map((t) => (
                    <Badge key={t} tone={selected.accent}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedId(null)
                  const bed = gardenBeds.find((b) => b.id === activeBed)
                  if (bed) focusBed(bed)
                  else goOverview()
                }}
                aria-label="Close"
                className="text-ink-faint transition-colors hover:text-ink"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            <p className="px-4 pb-3 text-[0.85rem] leading-relaxed text-ink-soft text-balance-pretty">
              {selected.tagline}
            </p>

            <dl className="grid grid-cols-2 gap-px border-y border-line bg-line">
              <div className="bg-[var(--surface-raised)] px-4 py-2.5">
                <dt className="text-[0.62rem] tracking-[0.1em] text-ink-faint uppercase">Parts used</dt>
                <dd className="truncate text-[0.82rem]">{selected.partsUsed.slice(0, 2).join(', ')}</dd>
              </div>
              <div className="bg-[var(--surface-raised)] px-4 py-2.5">
                <dt className="text-[0.62rem] tracking-[0.1em] text-ink-faint uppercase">Potency</dt>
                <dd className="truncate text-[0.82rem]">{selected.ayurvedic.virya}</dd>
              </div>
            </dl>

            <div className="flex items-center gap-2 p-3">
              <Link to={`/plant/${selected.id}`} className="flex-1">
                <Button variant="primary" size="sm" className="w-full" iconRight="arrowRight">
                  Full entry
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                icon="bookmark"
                solidIcon={bookmarks.includes(selected.id)}
                onClick={() => useGarden.getState().toggleBookmark(selected.id)}
                aria-label="Save to My Garden"
              />
            </div>
          </div>
        </aside>
      )}

      {/* ---------------- Utility controls ---------------- */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 sm:top-6 sm:right-6">
        {!selected && (
          <button
            onClick={() => setShowLabels((v) => !v)}
            aria-pressed={showLabels}
            title="Toggle bed signs"
            className="glass grid size-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:text-ink"
          >
            <Icon name={showLabels ? 'eye' : 'layers'} size={17} />
          </button>
        )}
      </div>

      {!showIntro && !selected && (
        <p className="glass pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full border border-line px-3.5 py-1.5 text-[0.74rem] text-ink-faint sm:top-6">
          Click a plant to meet it · drag to look around
        </p>
      )}
    </div>
  )
}
