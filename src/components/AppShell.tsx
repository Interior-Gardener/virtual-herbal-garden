import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useGarden } from '../store/useGarden'
import { Icon, type IconName } from './ui/Icon'
import { cx } from './ui/primitives'
import { CommandPalette } from './CommandPalette'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Garden', icon: 'map' },
  { to: '/explore', label: 'Explore', icon: 'grid' },
  { to: '/tours', label: 'Tours', icon: 'route' },
  { to: '/my-garden', label: 'My Garden', icon: 'bookmark' },
]

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Vanaspati home">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-moss-900 text-moss-300 transition-transform duration-500 group-hover:rotate-[-8deg]">
        <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
          <path d="M8 24C8 24 6.5 14 12 9.5S25 6 25 6s1 10-4 15-13 3-13 3Z" fill="currentColor" />
          <path d="M8.5 24C11 19 15.5 13.5 24.5 6.5" stroke="#0e2f1d" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.05rem] font-semibold tracking-[-0.02em]">Vanaspati</span>
        <span className="block text-[0.62rem] tracking-[0.18em] text-ink-faint uppercase">Virtual Herbal Garden</span>
      </span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useGarden((s) => s.theme)
  const toggleTheme = useGarden((s) => s.toggleTheme)
  const bookmarks = useGarden((s) => s.bookmarks.length)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()
  const immersive = location.pathname === '/' || location.pathname.startsWith('/tours/')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (e.key === '/' && !/^(input|textarea)$/i.test((e.target as HTMLElement)?.tagName ?? '')) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={cx('min-h-dvh', immersive ? 'h-dvh overflow-hidden' : '')}>
      <header className="glass fixed inset-x-0 top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[92rem] items-center gap-4 px-4 sm:px-6">
          <Wordmark />

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'relative rounded-full px-3.5 py-2 text-[0.85rem] font-medium transition-colors duration-200',
                    isActive ? 'text-ink' : 'text-ink-faint hover:text-ink-soft',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 -z-10 rounded-full bg-sunken" aria-hidden="true" />
                    )}
                    {item.label}
                    {item.to === '/my-garden' && bookmarks > 0 && (
                      <span className="ml-1.5 rounded-full bg-accent px-1.5 py-px text-[0.62rem] font-semibold text-[var(--surface-raised)] tabular-nums">
                        {bookmarks}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex h-9 items-center gap-2 rounded-full border border-line bg-raised px-3 text-[0.8rem] text-ink-faint transition-colors hover:border-line-strong hover:text-ink-soft"
            >
              <Icon name="search" size={15} />
              <span className="hidden sm:inline">Search plants</span>
              <kbd className="hidden rounded border border-line px-1.5 py-px font-mono text-[0.62rem] lg:inline">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to daylight' : 'Switch to evening'}
              className="grid size-9 place-items-center rounded-full border border-line bg-raised text-ink-soft transition-colors hover:text-ink"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className={cx(immersive ? 'h-dvh pt-16' : 'pt-16 pb-24 md:pb-16')}>{children}</main>

      {/* Mobile tab bar */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-stretch justify-around">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-ink-faint',
                )
              }
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
