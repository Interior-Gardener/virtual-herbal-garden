import { Link } from 'react-router-dom'
import type { Plant } from '../types/plant'
import { BotanicalPlate } from './BotanicalPlate'
import { Icon } from './ui/Icon'
import { cx } from './ui/primitives'
import { useGarden } from '../store/useGarden'

interface PlantCardProps {
  plant: Plant
  /** Compact rows for list view; cards for the grid. */
  layout?: 'grid' | 'row'
  index?: number
}

const CONSERVATION_TONE: Record<string, string> = {
  'Critically Endangered': '#c2413f',
  Endangered: '#cf6a2e',
  Vulnerable: '#c9922e',
  'Least Concern': '#5a8f52',
  Cultivated: '#628a9a',
}

export function PlantCard({ plant, layout = 'grid', index = 0 }: PlantCardProps) {
  const bookmarked = useGarden((s) => s.bookmarks.includes(plant.id))
  const toggleBookmark = useGarden((s) => s.toggleBookmark)

  if (layout === 'row') {
    return (
      <Link
        to={`/plant/${plant.id}`}
        className="group flex items-center gap-4 rounded-2xl border border-line bg-raised px-3 py-3 transition-all duration-300 hover:border-line-strong hover:shadow-[var(--shadow-soft)]"
      >
        <div
          className="grid size-16 shrink-0 place-items-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${plant.accent} 12%, var(--surface-sunken))` }}
        >
          <BotanicalPlate plant={plant} className="size-14" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate font-display text-base font-semibold">{plant.name}</h3>
            <span className="truncate text-xs text-ink-faint italic">{plant.botanical}</span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[0.82rem] text-ink-soft">{plant.tagline}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {plant.therapeutic.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-sunken px-2.5 py-1 text-[0.7rem] text-ink-faint">
              {t}
            </span>
          ))}
        </div>
        <Icon name="chevronRight" size={18} className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
      </Link>
    )
  }

  return (
    <article
      className="group relative animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <Link
        to={`/plant/${plant.id}`}
        className="block overflow-hidden rounded-3xl border border-line bg-raised transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
      >
        <div
          className="grain relative aspect-[5/4] overflow-hidden"
          style={{
            background: `radial-gradient(120% 100% at 50% 108%, color-mix(in srgb, ${plant.accent} 26%, transparent) 0%, color-mix(in srgb, ${plant.accent} 7%, var(--surface-sunken)) 62%, var(--surface-sunken) 100%)`,
          }}
        >
          <BotanicalPlate
            plant={plant}
            className="absolute inset-0 size-full p-3 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
          />
          <span
            className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide backdrop-blur-sm"
            style={{
              background: 'color-mix(in srgb, var(--surface-raised) 78%, transparent)',
              color: CONSERVATION_TONE[plant.conservation],
            }}
          >
            {plant.type}
          </span>
        </div>

        <div className="space-y-2 p-4">
          <div>
            <h3 className="font-display text-[1.15rem] leading-tight font-semibold tracking-[-0.01em]">
              {plant.name}
            </h3>
            <p className="text-[0.78rem] text-ink-faint italic">{plant.botanical}</p>
          </div>
          <p className="line-clamp-2 text-[0.85rem] leading-relaxed text-ink-soft text-balance-pretty">
            {plant.tagline}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {plant.therapeutic.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[0.68rem] font-medium"
                style={{
                  background: `color-mix(in srgb, ${plant.accent} 13%, transparent)`,
                  color: `color-mix(in srgb, ${plant.accent} 78%, var(--ink))`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          toggleBookmark(plant.id)
        }}
        aria-label={bookmarked ? `Remove ${plant.name} from your garden` : `Save ${plant.name} to your garden`}
        aria-pressed={bookmarked}
        className={cx(
          'absolute top-3 right-3 grid size-9 place-items-center rounded-full border transition-all duration-300',
          bookmarked
            ? 'border-transparent bg-accent text-[var(--surface-raised)]'
            : 'border-line bg-[color-mix(in_srgb,var(--surface-raised)_80%,transparent)] text-ink-faint backdrop-blur-sm hover:text-ink',
        )}
      >
        <Icon name="bookmark" size={16} solid={bookmarked} />
      </button>
    </article>
  )
}
