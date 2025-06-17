import { useState } from 'react'
import { ChevronDown, User, Crown, Eye, Users, LogOut, Key, Building } from 'lucide-react'
import { useUser, type User as UserType } from '../store/userStore'
import { useAuditLogger } from '../hooks/useAuditLogger'

const UserSwitcher = () => {
  const { currentUser, availableUsers, switchUser, logout } = useUser()
  const { logUserSwitched } = useAuditLogger()
  const [isOpen, setIsOpen] = useState(false)

  const handleUserSwitch = (userId: string) => {
    const previousUser = currentUser
    const newUser = availableUsers.find(u => u.id === userId)
    
    if (newUser && previousUser && newUser.id !== previousUser.id) {
      switchUser(userId)
      logUserSwitched(previousUser.name, newUser.name, newUser.role)
      setIsOpen(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'user':
        return <User className="w-4 h-4 text-blue-600" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Beheerder'
      case 'user':
        return 'Gebruiker'
      case 'viewer':
        return 'Bekijker'
      default:
        return 'Onbekend'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (!currentUser) return null

  return (
    <div className="relative">
      {/* Demo Badge */}
      <div className="absolute -top-8 right-0 z-50">
        <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-t-md font-medium shadow-sm">
          🎭 DEMO MODE
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 transition-colors min-w-[200px]"
      >
        <div className="flex items-center space-x-2 flex-1">
          {getRoleIcon(currentUser.role)}
          <div className="text-left">
            <div className="text-sm font-medium text-neutral-900">
              {currentUser.name}
            </div>
            <div className="text-xs text-neutral-500 flex items-center space-x-1">
              <span>{getRoleLabel(currentUser.role)}</span>
              {currentUser.department && (
                <>
                  <span>•</span>
                  <span>{currentUser.department}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
            <div className="p-3 border-b border-neutral-200">
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Users className="w-4 h-4" />
                <span>Demo Gebruikers Wisselen</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Klik op een gebruiker om van rol te wisselen
              </p>
            </div>
            
            <div className="py-2">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSwitch(user.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left ${
                    user.id === currentUser.id ? 'bg-primary/5 border-r-2 border-r-primary' : ''
                  }`}
                >
                  {getRoleIcon(user.role)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-neutral-900">
                        {user.name}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {user.email}
                    </div>
                    {user.role === 'admin' && (
                      <div className="text-xs text-yellow-600 mt-1 font-medium">
                        ⚡ Toegang tot audit logs en systeembeheer
                      </div>
                    )}
                  </div>
                  {user.id === currentUser.id && (
                    <div className="text-primary">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="border-t border-neutral-200">
              {/* Keycloak SSO Section */}
              <div className="p-3 bg-blue-50">
                <div className="flex items-center space-x-2 text-sm text-blue-700 mb-2">
                  <Key className="w-4 h-4" />
                  <span>Gemeente SSO Actief</span>
                </div>
                <div className="text-xs text-blue-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building className="w-3 h-3" />
                    <span>{currentUser.municipality || 'Gemeente Demo'}</span>
                  </div>
                  <div>Sessie: {currentUser.id.substring(0, 8)}...</div>
                </div>
              </div>
              
              {/* Logout Button */}
              <div className="p-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Uitloggen</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default UserSwitcher 