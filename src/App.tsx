import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import Layout from '@components/Layout'
import LoadingSpinner from '@components/LoadingSpinner'
import LoginScreen from '@components/LoginScreen'
import { useUser } from '@store/userStore'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('@pages/Dashboard'))
const Projects = lazy(() => import('@pages/Projects'))
const ProjectDetail = lazy(() => import('@pages/ProjectDetail'))
const DocumentUpload = lazy(() => import('@pages/DocumentUpload'))
const Documents = lazy(() => import('@pages/Documents'))
const DocumentReview = lazy(() => import('@pages/DocumentReview'))
const ProfileSettings = lazy(() => import('@pages/ProfileSettings'))
const Settings = lazy(() => import('@pages/Settings'))
const AuditLog = lazy(() => import('@pages/AuditLog'))
const Reports = lazy(() => import('@pages/Reports'))

function App() {
  const { isAuthenticated, isInitialized, initKeycloak, logout } = useUser()
  const [showLogin, setShowLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize Keycloak on app start
    const initAuth = async () => {
      try {
        await initKeycloak()
      } catch (error) {
        console.error('Failed to initialize authentication:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [initKeycloak])

  useEffect(() => {
    if (isInitialized) {
      setShowLogin(!isAuthenticated)
    }
  }, [isAuthenticated, isInitialized])

  const handleLoginComplete = () => {
    setShowLogin(false)
  }

  const handleLogout = async () => {
    await logout()
    setShowLogin(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Authenticatie initialiseren...</p>
        </div>
      </div>
    )
  }

  if (showLogin) {
    return <LoginScreen onLoginComplete={handleLoginComplete} />
  }

  return (
    <Layout onLogout={handleLogout}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/document/:id" element={<DocumentReview />} />
          <Route path="/profiles" element={<ProfileSettings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App 