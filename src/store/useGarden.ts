import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PlantNote {
  plantId: string
  body: string
  updatedAt: number
}

export type Quality = 'auto' | 'high' | 'balanced' | 'light'

interface GardenState {
  bookmarks: string[]
  notes: Record<string, PlantNote>
  /** Plants the visitor has opened, newest first. */
  visited: string[]
  completedTours: string[]
  theme: 'light' | 'dark'
  quality: Quality
  narration: boolean
  reducedMotion: boolean

  toggleBookmark: (plantId: string) => void
  isBookmarked: (plantId: string) => boolean
  setNote: (plantId: string, body: string) => void
  deleteNote: (plantId: string) => void
  markVisited: (plantId: string) => void
  completeTour: (tourId: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setQuality: (quality: Quality) => void
  setNarration: (on: boolean) => void
  setReducedMotion: (on: boolean) => void
  resetProgress: () => void
}

const prefersDark =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export const useGarden = create<GardenState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      notes: {},
      visited: [],
      completedTours: [],
      theme: prefersDark ? 'dark' : 'light',
      quality: 'auto',
      narration: true,
      reducedMotion: false,

      toggleBookmark: (plantId) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(plantId)
            ? s.bookmarks.filter((id) => id !== plantId)
            : [plantId, ...s.bookmarks],
        })),

      isBookmarked: (plantId) => get().bookmarks.includes(plantId),

      setNote: (plantId, body) =>
        set((s) => {
          const trimmed = body.trim()
          if (!trimmed) {
            const { [plantId]: _drop, ...rest } = s.notes
            return { notes: rest }
          }
          return { notes: { ...s.notes, [plantId]: { plantId, body, updatedAt: Date.now() } } }
        }),

      deleteNote: (plantId) =>
        set((s) => {
          const { [plantId]: _drop, ...rest } = s.notes
          return { notes: rest }
        }),

      markVisited: (plantId) =>
        set((s) => ({ visited: [plantId, ...s.visited.filter((id) => id !== plantId)].slice(0, 40) })),

      completeTour: (tourId) =>
        set((s) => ({
          completedTours: s.completedTours.includes(tourId)
            ? s.completedTours
            : [...s.completedTours, tourId],
        })),

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setQuality: (quality) => set({ quality }),
      setNarration: (narration) => set({ narration }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      resetProgress: () => set({ bookmarks: [], notes: {}, visited: [], completedTours: [] }),
    }),
    {
      name: 'vanaspati.garden.v1',
      partialize: (s) => ({
        bookmarks: s.bookmarks,
        notes: s.notes,
        visited: s.visited,
        completedTours: s.completedTours,
        theme: s.theme,
        quality: s.quality,
        narration: s.narration,
        reducedMotion: s.reducedMotion,
      }),
    },
  ),
)

/** Applies the stored theme to <html> and keeps it in sync. */
export function useThemeEffect() {
  const theme = useGarden((s) => s.theme)
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }
  return theme
}
