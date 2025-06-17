import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import keycloak, { KeycloakUser } from '../services/keycloak'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  organization: string
  department?: string
  municipality?: string
  roles?: string[]
}

interface UserState {
  currentUser: User | null
  sessionId: string
  isAuthenticated: boolean
  isInitialized: boolean
  availableUsers: User[]
  
  // Actions
  setCurrentUser: (user: User) => void
  switchUser: (userId: string) => void
  logout: () => void
  generateSessionId: () => string
  initKeycloak: () => Promise<void>
  loginWithKeycloak: (username?: string, password?: string) => Promise<void>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

// Demo users for switching
const demoUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Admin Gebruiker',
    email: 'admin@gemeente.nl',
    role: 'admin',
    organization: 'Gemeente Amsterdam',
    department: 'ICT & Informatievoorziening',
    municipality: 'Gemeente Amsterdam',
    roles: ['admin', 'user', 'woo-coordinator']
  },
  {
    id: 'user-1', 
    name: 'M. van der Berg',
    email: 'm.vandenberg@gemeente.nl',
    role: 'user',
    organization: 'Gemeente Amsterdam',
    department: 'Juridische Zaken',
    municipality: 'Gemeente Amsterdam',
    roles: ['user', 'woo-coordinator']
  },
  {
    id: 'user-2',
    name: 'S. Janssen',
    email: 's.janssen@gemeente.nl', 
    role: 'user',
    organization: 'Gemeente Amsterdam',
    department: 'Burgerzaken',
    municipality: 'Gemeente Amsterdam',
    roles: ['user']
  },
  {
    id: 'viewer-1',
    name: 'L. de Vries',
    email: 'l.devries@gemeente.nl',
    role: 'viewer',
    organization: 'Gemeente Amsterdam',
    department: 'Bestuur & Ondersteuning',
    municipality: 'Gemeente Amsterdam',
    roles: ['viewer']
  }
]

const mapKeycloakUserToUser = (kcUser: KeycloakUser): User => {
  // Map Keycloak roles to simplified app roles
  let role: 'admin' | 'user' | 'viewer' = 'viewer'
  if (kcUser.roles.includes('admin')) {
    role = 'admin'
  } else if (kcUser.roles.includes('user') || kcUser.roles.includes('woo-coordinator')) {
    role = 'user'
  }

  return {
    id: kcUser.id,
    name: `${kcUser.firstName} ${kcUser.lastName}`,
    email: kcUser.email,
    role,
    organization: kcUser.municipality,
    department: kcUser.department,
    municipality: kcUser.municipality,
    roles: kcUser.roles
  }
}

export const useUser = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null, // Start with no user (require login)
      sessionId: crypto.randomUUID(),
      isAuthenticated: false,
      isInitialized: false,
      availableUsers: demoUsers,

      setCurrentUser: (user: User) => {
        set({ 
          currentUser: user, 
          isAuthenticated: true,
          sessionId: crypto.randomUUID() // New session on user change
        })
      },

      switchUser: (userId: string) => {
        const user = demoUsers.find(u => u.id === userId)
        if (user) {
          get().setCurrentUser(user)
        }
      },

      logout: async () => {
        try {
          await keycloak.logout()
        } catch (error) {
          console.error('Keycloak logout failed:', error)
        }
        set({ 
          currentUser: null, 
          isAuthenticated: false,
          sessionId: crypto.randomUUID()
        })
      },

      generateSessionId: () => {
        const newSessionId = crypto.randomUUID()
        set({ sessionId: newSessionId })
        return newSessionId
      },

      initKeycloak: async () => {
        try {
          const authenticated = await keycloak.init()
          
          if (authenticated) {
            const kcUser = keycloak.getUser()
            if (kcUser) {
              const user = mapKeycloakUserToUser(kcUser)
              set({ 
                currentUser: user, 
                isAuthenticated: true, 
                isInitialized: true,
                sessionId: crypto.randomUUID()
              })
              return
            }
          }
          
          set({ isInitialized: true })
        } catch (error) {
          console.error('Keycloak initialization failed:', error)
          set({ isInitialized: true })
        }
      },

      loginWithKeycloak: async (username?: string, password?: string) => {
        try {
          await keycloak.login(username, password)
          const kcUser = keycloak.getUser()
          
          if (kcUser) {
            const user = mapKeycloakUserToUser(kcUser)
            set({ 
              currentUser: user, 
              isAuthenticated: true,
              sessionId: crypto.randomUUID()
            })
          }
        } catch (error) {
          console.error('Keycloak login failed:', error)
          throw error
        }
      },

      hasRole: (role: string) => {
        const { currentUser } = get()
        return currentUser?.roles?.includes(role) || false
      },

      hasAnyRole: (roles: string[]) => {
        const { currentUser } = get()
        if (!currentUser?.roles) return false
        return roles.some(role => currentUser.roles!.includes(role))
      }
    }),
    {
      name: 'sensible-docs-user',
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
) 