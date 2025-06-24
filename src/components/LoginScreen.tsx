import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, Loader2, CheckCircle, Lock, User, Building, Key } from 'lucide-react'
import { useUser } from '../store/userStore'

interface LoginScreenProps {
  onLoginComplete: () => void
}

const LoginScreen = ({ onLoginComplete }: LoginScreenProps) => {
  const { setCurrentUser, loginWithKeycloak } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })

  const loadingSteps = [
    'Verbinding maken met server...',
    'Gebruikersgegevens valideren...',
    'Toegangsrechten controleren...',
    'Beveiligingstoken genereren...',
    'Audit log initialiseren...',
    'Dashboard voorbereiden...'
  ]

  const mockUsers = [
    {
      id: 'admin-1',
      username: 'admin',
      password: 'admin123',
      name: 'Admin Gebruiker',
      role: 'admin' as const,
      email: 'admin@gemeente.nl',
      organization: 'Gemeente Amsterdam'
    },
    {
      id: 'user-1',
      username: 'gebruiker',
      password: 'user123',
      name: 'S. Janssen',
      role: 'user' as const,
      email: 's.janssen@gemeente.nl',
      organization: 'Gemeente Amsterdam'
    },
    {
      id: 'viewer-1',
      username: 'bekijker',
      password: 'view123',
      name: 'L. Visser',
      role: 'viewer' as const,
      email: 'l.visser@gemeente.nl',
      organization: 'Gemeente Amsterdam'
    }
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentials.username || !credentials.password) {
      return
    }

    setIsLoading(true)
    setLoadingStep(0)

    // Simulate authentication process
    for (let i = 0; i < loadingSteps.length; i++) {
      setLoadingStep(i)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
    }

    // Find matching user
    const user = mockUsers.find(u => 
      u.username === credentials.username && u.password === credentials.password
    )

    if (user) {
      setCurrentUser(user)
      await new Promise(resolve => setTimeout(resolve, 500))
      onLoginComplete()
    } else {
      setIsLoading(false)
      setLoadingStep(0)
      // In real app, show error message
    }
  }

  const handleKeycloakLogin = async () => {
    setIsLoading(true)
    setLoadingStep(0)

    try {
      // Show Keycloak loading steps
      for (let i = 0; i < 3; i++) {
        setLoadingStep(i)
        await new Promise(resolve => setTimeout(resolve, 600))
      }

      await loginWithKeycloak()
      
      // Complete loading animation
      for (let i = 3; i < loadingSteps.length; i++) {
        setLoadingStep(i)
        await new Promise(resolve => setTimeout(resolve, 400))
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      onLoginComplete()
    } catch (error) {
      console.error('Keycloak login failed:', error)
      setIsLoading(false)
      setLoadingStep(0)
    }
  }

  const handleQuickLogin = async (userType: 'admin' | 'user' | 'viewer') => {
    const user = mockUsers.find(u => u.role === userType)
    if (user) {
      setCredentials({ username: user.username, password: user.password })
      setIsLoading(true)
      setLoadingStep(0)

      for (let i = 0; i < loadingSteps.length; i++) {
        setLoadingStep(i)
        await new Promise(resolve => setTimeout(resolve, 600))
      }

      setCurrentUser(user)
      await new Promise(resolve => setTimeout(resolve, 500))
      onLoginComplete()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/10 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary animate-pulse" />
            </div>
            
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Bezig met inloggen...
            </h2>
            
            <div className="space-y-4">
              {loadingSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  {index < loadingStep ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : index === loadingStep ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-neutral-200" />
                  )}
                  <span className={`${
                    index <= loadingStep ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-neutral-600">
                <Lock className="w-4 h-4" />
                <span className="text-sm">
                  Veilige verbinding • 256-bit SSL encryptie
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl">
        <div className="flex">
          {/* Left Panel - Branding */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-6 xl:p-12 flex-col justify-between text-white">
            <div>
              <div className="flex items-center mb-8">
                <Shield className="w-10 h-10 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold">Sensible Docs</h1>
                  <p className="text-primary-100">WOO Anonimisering Platform</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">99% Nauwkeurigheid</h3>
                    <p className="text-primary-100 text-sm">
                      BERT-gebaseerde AI detecteert PII in meer dan 50 talen
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Waterdichte Audit Trail</h3>
                    <p className="text-primary-100 text-sm">
                      Blockchain-gebaseerde logging voor volledige compliance
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">WOO-Compliant</h3>
                    <p className="text-primary-100 text-sm">
                      Speciaal ontwikkeld voor Nederlandse overheidsinstellingen
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-primary-100 text-sm">
              © 2025 Sensible Docs • Veilig • Betrouwbaar • Compliant
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-10 xl:p-12">
            <div className="lg:hidden flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Sensible Docs</h1>
                <p className="text-neutral-600 text-sm">WOO Anonimisering</p>
              </div>
            </div>

            <div className="mb-6 lg:mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-2">
                Welkom terug
              </h2>
              <p className="text-neutral-600 text-sm lg:text-base">
                Log in om toegang te krijgen tot het anonimisatieplatform
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 lg:space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Gebruikersnaam
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm lg:text-base"
                    placeholder="Voer uw gebruikersnaam in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Wachtwoord
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-9 lg:pl-10 pr-10 lg:pr-12 py-2.5 lg:py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm lg:text-base"
                    placeholder="Voer uw wachtwoord in"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!credentials.username || !credentials.password}
                className="w-full bg-primary text-white py-2.5 lg:py-3 px-4 rounded-lg font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
              >
                Inloggen
              </button>
            </form>

            {/* SSO Login Button */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">of</span>
                </div>
              </div>
              
              <button
                onClick={handleKeycloakLogin}
                disabled={isLoading}
                className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Key className="w-5 h-5" />
                <span>Inloggen met Gemeente SSO</span>
              </button>
            </div>

            {/* Quick Login Demo Buttons */}
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <p className="text-sm text-neutral-600 mb-4 text-center">
                Demo accounts (voor demonstratie):
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickLogin('admin')}
                  className="w-full text-left p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">Administrator</div>
                      <div className="text-sm text-neutral-600">Volledige toegang tot alle functies</div>
                    </div>
                    <span className="badge-success">Admin</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleQuickLogin('user')}
                  className="w-full text-left p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">Standaard Gebruiker</div>
                      <div className="text-sm text-neutral-600">Documenten uploaden en bewerken</div>
                    </div>
                    <span className="badge-primary">Gebruiker</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleQuickLogin('viewer')}
                  className="w-full text-left p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">Bekijker</div>
                      <div className="text-sm text-neutral-600">Alleen-lezen toegang</div>
                    </div>
                    <span className="badge-neutral">Bekijker</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-neutral-500 text-sm">
                <Lock className="w-4 h-4" />
                <span>Beveiligde verbinding</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen 