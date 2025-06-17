import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Upload, 
  Settings, 
  History, 
  BarChart3, 
  Menu,
  X,
  Shield,
  User,
  Bell,
  LogOut,
  Cog,
  FolderOpen
} from 'lucide-react'
// import clsx from 'clsx' // Removed for now
import { useUser } from '../store/userStore'

interface LayoutProps {
  children: ReactNode
  onLogout?: () => void
}

const Layout = ({ children, onLogout }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useUser()
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Projecten', href: '/projects', icon: FolderOpen },
    { name: 'Document uploaden', href: '/upload', icon: Upload },
    { name: 'Alle documenten', href: '/documents', icon: FileText },
    { name: 'Profielinstellingen', href: '/profiles', icon: User },
    ...(currentUser?.role === 'admin' ? [{ name: 'Systeeminstellingen', href: '/settings', icon: Cog }] : []),
    { name: 'Audit log', href: '/audit', icon: History },
    { name: 'Rapporten', href: '/reports', icon: FileText },
  ]

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      // Fallback: just navigate to home
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  Sensible Docs
                </h1>
                <p className="text-xs text-neutral-500">WOO Anonimisering</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="px-4 py-4 border-t border-neutral-200">
            {/* User Info */}
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  {currentUser?.name || 'Gebruiker'}
                </p>
                <p className="text-xs text-neutral-500">
                  {currentUser?.department || 'Afdeling'}
                </p>
                <p className="text-xs text-neutral-400">
                  {currentUser?.organization || 'Organisatie'}
                </p>
              </div>
            </div>

            {/* SSO Status */}
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 text-xs text-blue-700 mb-1">
                <Shield className="w-3 h-3" />
                <span>Gemeente SSO Actief</span>
              </div>
              <div className="text-xs text-blue-600">
                Sessie: {currentUser?.id.substring(0, 8)}...
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 mr-2"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h2>
                <p className="text-sm text-neutral-500">
                  Veilig documenten anonimiseren volgens WOO-wetgeving
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout 