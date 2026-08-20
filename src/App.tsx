import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Icon } from './components/ui/Icon'

// The 3D routes carry three.js; keep them out of the initial bundle.
const Garden = lazy(() => import('./routes/Garden'))
const TourPage = lazy(() => import('./routes/TourPage'))
const PlantPage = lazy(() => import('./routes/PlantPage'))
const Explore = lazy(() => import('./routes/Explore'))
const Tours = lazy(() => import('./routes/Tours'))
const MyGarden = lazy(() => import('./routes/MyGarden'))

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-faint">
      <Icon name="seedling" size={28} className="animate-float" />
      <p className="font-display text-sm tracking-wide">Growing the garden…</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Garden />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/plant/:id" element={<PlantPage />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/tours/:id" element={<TourPage />} />
            <Route path="/my-garden" element={<MyGarden />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}
