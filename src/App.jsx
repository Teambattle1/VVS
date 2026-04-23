import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { OrgProvider } from './contexts/OrgContext.jsx'
import { JobsProvider } from './contexts/JobsContext.jsx'
import AppRoutes from './routes.jsx'
import SplashScreen from './components/SplashScreen.jsx'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <AuthProvider>
      <OrgProvider>
        <JobsProvider>
          <AppRoutes />
          {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        </JobsProvider>
      </OrgProvider>
    </AuthProvider>
  )
}
