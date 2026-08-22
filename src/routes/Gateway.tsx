import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { plants, gardenBeds } from '../data/plants'
import { BED_PLOTS, PLAQUE } from '../data/vanaspatyam'
import { BotanicalPlate } from '../components/BotanicalPlate'
import { Icon } from '../components/ui/Icon'
import { useCalmMotion } from '../components/motion/Reveal'
import type { Plant } from '../types/plant'

/* ------------------------------------------------------------------ *
 * The doorway.
 *
 * There are two gardens now: the designed one, laid out by theme so the
 * medicine is what organises the ground, and Vanaspatyam, which is a
 * real place on a real campus and laid out the way it actually is. They
 * hold the same plants. Choosing between them is choosing
 * how you want to meet them, so the choice is made here rather than
 * buried in a menu.
 * ------------------------------------------------------------------ */

interface Door {
  to: string
  eyebrow: string
  title: string
  sub?: string
  body: string
  facts: string[]
  accent: string
  plants: Plant[]
}

export default function Gateway() {
  const calm = useCalmMotion()

  const doors = useMemo<Door[]>(() => {
    const sample = (ids: string[]) =>
      ids.map((id) => plants.find((p) => p.id === id)).filter((p): p is Plant => Boolean(p))
    return [
      {
        to: '/garden',
        eyebrow: 'The designed garden',
        title: 'Vanaspati',
        body: 'Twenty-five medicinal plants set out in themed beds — digestion, immunity, the mind — so that walking the garden walks you through what the medicine is for.',
        facts: [
          `${plants.length} species`,
          `${gardenBeds.length} themed beds`,
          'Guided tours and a narrated opening',
        ],
        accent: '#5c8a4a',
        plants: sample(['tulsi', 'turmeric', 'ashwagandha']),
      },
      {
        to: '/vanaspatyam',
        eyebrow: 'The real garden',
        title: PLAQUE.title,
        sub: PLAQUE.devanagari,
        body: 'Our own Ayurvedic garden on campus, rebuilt from its plan and from photographs taken on the ground: the south gate, the spine between four ranks of kerbed beds, the lily pond, and the pylons standing over all of it.',
        facts: [
          'Opened 12 February 2016',
          `${BED_PLOTS.length} beds, 30m × 25m`,
          'Walkable, gate to pond',
        ],
        accent: '#8a6a2f',
        plants: sample(['neem', 'bael', 'arjuna']),
      },
    ]
  }, [])

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* A quiet ground so neither door has to fight a photograph. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 62%)',
        }}
        aria-hidden
      />

      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
        <motion.header
          initial={calm ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-accent uppercase">
            Vanaspati · virtual herbal garden
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.03] font-semibold tracking-[-0.03em]">
            Two gardens, the same plants.
          </h1>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft text-balance-pretty">
            One is arranged by what the plants treat. The other is a real garden on our campus,
            rebuilt as it stands. Pick the door you want to come in by — you can cross between them
            whenever you like.
          </p>
        </motion.header>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {doors.map((door, i) => (
            <motion.div
              key={door.to}
              initial={calm ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={door.to}
                className="group flex h-full flex-col overflow-hidden rounded-4xl border border-line bg-raised transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
              >
                <div
                  className="grain relative flex h-44 items-end gap-2 overflow-hidden px-5 pb-4 sm:h-52"
                  style={{
                    background: `radial-gradient(120% 100% at 50% 110%, color-mix(in srgb, ${door.accent} 32%, transparent) 0%, color-mix(in srgb, ${door.accent} 9%, var(--surface-sunken)) 60%, var(--surface-sunken) 100%)`,
                  }}
                >
                  {door.plants.map((plant, n) => (
                    <BotanicalPlate
                      key={plant.id}
                      plant={plant}
                      className="h-32 flex-1 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05] sm:h-40"
                      style={{ transitionDelay: `${n * 40}ms` }}
                    />
                  ))}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p
                    className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase"
                    style={{ color: door.accent }}
                  >
                    {door.eyebrow}
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl leading-none font-semibold tracking-[-0.02em]">
                    {door.title}
                    {door.sub && (
                      <span className="ml-2 text-lg font-normal text-ink-soft">{door.sub}</span>
                    )}
                  </h2>
                  <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink-soft text-balance-pretty">
                    {door.body}
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    {door.facts.map((fact) => (
                      <li key={fact} className="flex items-center gap-2 text-[0.8rem] text-ink-faint">
                        <span className="size-1.5 rounded-full" style={{ background: door.accent }} />
                        {fact}
                      </li>
                    ))}
                  </ul>

                  <span
                    className="mt-5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold transition-transform duration-300 group-hover:translate-x-0.5"
                    style={{ color: door.accent }}
                  >
                    Enter
                    <Icon name="arrowRight" size={15} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
