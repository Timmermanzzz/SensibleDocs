// Mock Keycloak Service - Simulates real Keycloak for demo purposes
export interface KeycloakUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  department: string
  municipality: string
}

export interface KeycloakToken {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

class MockKeycloakService {
  private isAuthenticated = false
  private currentUser: KeycloakUser | null = null
  private token: KeycloakToken | null = null
  private loginCallback: (() => void) | null = null
  private logoutCallback: (() => void) | null = null

  // Mock users database
  private mockUsers: KeycloakUser[] = [
    {
      id: 'user-admin-1',
      username: 'admin',
      email: 'admin@gemeente-demo.nl',
      firstName: 'Beheer',
      lastName: 'Administrator',
      roles: ['admin', 'user', 'woo-coordinator'],
      department: 'ICT & Informatievoorziening',
      municipality: 'Gemeente Demo'
    },
    {
      id: 'user-woo-1',
      username: 'woo.coordinator',
      email: 'woo@gemeente-demo.nl',
      firstName: 'WOO',
      lastName: 'Coördinator',
      roles: ['user', 'woo-coordinator'],
      department: 'Juridische Zaken',
      municipality: 'Gemeente Demo'
    },
    {
      id: 'user-clerk-1',
      username: 'medewerker',
      email: 'medewerker@gemeente-demo.nl',
      firstName: 'Jan',
      lastName: 'Medewerker',
      roles: ['user'],
      department: 'Burgerzaken',
      municipality: 'Gemeente Demo'
    },
    {
      id: 'user-manager-1',
      username: 'manager',
      email: 'manager@gemeente-demo.nl',
      firstName: 'Marie',
      lastName: 'Manager',
      roles: ['user', 'manager'],
      department: 'Bestuur & Ondersteuning',
      municipality: 'Gemeente Demo'
    }
  ]

  init() {
    // Simulate Keycloak initialization
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // Check if user was previously logged in (localStorage)
        const savedUser = localStorage.getItem('keycloak-user')
        const savedToken = localStorage.getItem('keycloak-token')
        
        if (savedUser && savedToken) {
          this.currentUser = JSON.parse(savedUser)
          this.token = JSON.parse(savedToken)
          this.isAuthenticated = true
        }
        
        resolve(this.isAuthenticated)
      }, 500) // Simulate network delay
    })
  }

  login(username?: string, password?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Simulate login dialog if no credentials provided
      if (!username || !password) {
        this.showLoginDialog().then(resolve).catch(reject)
        return
      }

      // Find user by username
      const user = this.mockUsers.find(u => u.username === username)
      
      if (!user) {
        reject(new Error('Gebruiker niet gevonden'))
        return
      }

      // Simulate password validation (accept any password for demo)
      setTimeout(() => {
        this.currentUser = user
        this.token = {
          access_token: this.generateMockToken(user),
          refresh_token: this.generateMockRefreshToken(),
          expires_in: 3600,
          token_type: 'Bearer'
        }
        this.isAuthenticated = true

        // Save to localStorage
        localStorage.setItem('keycloak-user', JSON.stringify(this.currentUser))
        localStorage.setItem('keycloak-token', JSON.stringify(this.token))

        if (this.loginCallback) {
          this.loginCallback()
        }

        resolve(true)
      }, 800) // Simulate authentication delay
    })
  }

  logout(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isAuthenticated = false
        this.currentUser = null
        this.token = null

        // Clear localStorage
        localStorage.removeItem('keycloak-user')
        localStorage.removeItem('keycloak-token')

        if (this.logoutCallback) {
          this.logoutCallback()
        }

        resolve()
      }, 300)
    })
  }

  getUser(): KeycloakUser | null {
    return this.currentUser
  }

  getToken(): string | null {
    return this.token?.access_token || null
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) || false
  }

  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser) return false
    return roles.some(role => this.currentUser!.roles.includes(role))
  }

  onAuthSuccess(callback: () => void) {
    this.loginCallback = callback
  }

  onAuthLogout(callback: () => void) {
    this.logoutCallback = callback
  }

  // Simulate Keycloak login dialog
  private showLoginDialog(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Create modal overlay
      const overlay = document.createElement('div')
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      
      // Create login form
      overlay.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Gemeente Demo SSO</h2>
            <p class="text-gray-600">Inloggen met uw gemeente account</p>
          </div>
          
          <form id="keycloak-login-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
              <select id="username" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Selecteer gebruiker...</option>
                <option value="admin">Admin (Beheerder)</option>
                <option value="woo.coordinator">WOO Coördinator</option>
                <option value="medewerker">Medewerker</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
              <input type="password" id="password" placeholder="Elk wachtwoord werkt voor demo" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            
            <div class="flex space-x-3 pt-4">
              <button type="submit" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Inloggen
              </button>
              <button type="button" id="cancel-login" class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                Annuleren
              </button>
            </div>
          </form>
          
          <div class="mt-6 text-xs text-gray-500 text-center">
            <p>Demo omgeving - gebruik elk wachtwoord</p>
          </div>
        </div>
      `

      document.body.appendChild(overlay)

      // Handle form submission
      const form = overlay.querySelector('#keycloak-login-form') as HTMLFormElement
      const cancelBtn = overlay.querySelector('#cancel-login') as HTMLButtonElement

      form.onsubmit = (e) => {
        e.preventDefault()
        const username = (overlay.querySelector('#username') as HTMLSelectElement).value
        const password = (overlay.querySelector('#password') as HTMLInputElement).value

        if (!username) {
          alert('Selecteer een gebruiker')
          return
        }

        document.body.removeChild(overlay)
        this.login(username, password || 'demo').then(resolve).catch(reject)
      }

      cancelBtn.onclick = () => {
        document.body.removeChild(overlay)
        reject(new Error('Login geannuleerd'))
      }

      // Auto-focus username
      setTimeout(() => {
        (overlay.querySelector('#username') as HTMLSelectElement).focus()
      }, 100)
    })
  }

  private generateMockToken(user: KeycloakUser): string {
    // Generate a mock JWT-like token (base64 encoded user info)
    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
      sub: user.id,
      preferred_username: user.username,
      email: user.email,
      given_name: user.firstName,
      family_name: user.lastName,
      realm_access: { roles: user.roles },
      department: user.department,
      municipality: user.municipality,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }

    const headerB64 = btoa(JSON.stringify(header))
    const payloadB64 = btoa(JSON.stringify(payload))
    const signature = 'mock-signature-for-demo'

    return `${headerB64}.${payloadB64}.${signature}`
  }

  private generateMockRefreshToken(): string {
    return 'mock-refresh-token-' + Math.random().toString(36).substr(2, 9)
  }

  // Utility method to get user info from token
  parseToken(token?: string): any {
    try {
      const tokenToParse = token || this.token?.access_token
      if (!tokenToParse) return null

      const parts = tokenToParse.split('.')
      if (parts.length !== 3) return null

      const payload = JSON.parse(atob(parts[1]))
      return payload
    } catch (error) {
      console.error('Error parsing token:', error)
      return null
    }
  }
}

// Export singleton instance
export const keycloak = new MockKeycloakService()
export default keycloak 