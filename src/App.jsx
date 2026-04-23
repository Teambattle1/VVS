import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { OrgProvider } from './contexts/OrgContext.jsx'
import { JobsProvider } from './contexts/JobsContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import AppRoutes from './routes.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <OrgProvider>
            <JobsProvider>
              <AppRoutes />
              {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
            </JobsProvider>
          </OrgProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
