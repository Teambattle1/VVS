import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotFound from './components/NotFound.jsx'

// Lazy-load tunge ruter (Konva + react-pdf)
const NewJob           = lazy(() => import('./pages/NewJob.jsx'))
const JobDetail        = lazy(() => import('./pages/JobDetail.jsx'))
const RoomEditor       = lazy(() => import('./pages/RoomEditor.jsx'))
const CustomerPortal   = lazy(() => import('./pages/CustomerPortal.jsx'))
const Onboarding       = lazy(() => import('./pages/Onboarding.jsx'))
const AdminLayout      = lazy(() => import('./components/AdminLayout.jsx'))
const AdminPackages    = lazy(() => import('./pages/admin/Packages.jsx'))
const AdminItems       = lazy(() => import('./pages/admin/Items.jsx'))
const AdminUsers       = lazy(() => import('./pages/admin/Users.jsx'))
const AdminSettings    = lazy(() => import('./pages/admin/Settings.jsx'))
const AdminIntegrations = lazy(() => import('./pages/admin/Integrations.jsx'))
const SuperAdminOrganizations = lazy(() => import('./pages/superadmin/Organizations.jsx'))

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

function Lazy({ children }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/k/:token" element={<Lazy><CustomerPortal /></Lazy>} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs/new"
        element={
          <ProtectedRoute>
            <Lazy><NewJob /></Lazy>
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs/:jobId"
        element={
          <ProtectedRoute>
            <Lazy><JobDetail /></Lazy>
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs/:jobId/rooms/:roomId"
        element={
          <ProtectedRoute>
            <Lazy><RoomEditor /></Lazy>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Lazy><AdminLayout /></Lazy>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/packages" replace />} />
        <Route path="packages"     element={<Lazy><AdminPackages /></Lazy>} />
        <Route path="items"        element={<Lazy><AdminItems /></Lazy>} />
        <Route path="users"        element={<Lazy><AdminUsers /></Lazy>} />
        <Route path="settings"     element={<Lazy><AdminSettings /></Lazy>} />
        <Route path="integrations" element={<Lazy><AdminIntegrations /></Lazy>} />
      </Route>

      <Route
        path="/super"
        element={
          <ProtectedRoute>
            <Lazy><SuperAdminOrganizations /></Lazy>
          </ProtectedRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Lazy><Onboarding /></Lazy>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
