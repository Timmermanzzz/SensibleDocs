import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Users, 
  Bell, 
  Shield, 
  Database, 
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Crown,
  User,
  AlertTriangle,
  CheckCircle,
  Globe,
  Lock
} from 'lucide-react'
import { useAuditLogger } from '../hooks/useAuditLogger'
import { useUser } from '../store/userStore'
import { useLanguageStore } from '../store/languageStore'
import toast from 'react-hot-toast'

interface SystemUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  createdAt: string
}

interface NotificationSettings {
  emailNotifications: boolean
  uploadNotifications: boolean
  errorNotifications: boolean
  weeklyReports: boolean
  securityAlerts: boolean
}

interface SystemSettings {
  maxFileSize: number
  retentionDays: number
  autoDeleteProcessed: boolean
  requireTwoFactor: boolean
  sessionTimeout: number
  allowedFileTypes: string[]
}

const Settings = () => {
  const { logPageVisit, logEvent } = useAuditLogger()
  const { currentUser } = useUser()
  const { language, setLanguage, t } = useLanguageStore()
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'notifications' | 'system' | 'security'>('general')
  const [isLoading, setIsLoading] = useState(false)
  
  // Users management
  const [users, setUsers] = useState<SystemUser[]>([
    {
      id: 'admin-1',
      name: 'Admin Gebruiker',
      email: 'admin@gemeente.nl',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-17T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'user-1',
      name: 'S. Janssen',
      email: 's.janssen@gemeente.nl',
      role: 'user',
      status: 'active',
      lastLogin: '2024-01-17T09:15:00Z',
      createdAt: '2024-01-05T00:00:00Z'
    },
    {
      id: 'user-2',
      name: 'M. van der Berg',
      email: 'm.vandenberg@gemeente.nl',
      role: 'user',
      status: 'active',
      lastLogin: '2024-01-16T16:45:00Z',
      createdAt: '2024-01-10T00:00:00Z'
    },
    {
      id: 'viewer-1',
      name: 'L. Visser',
      email: 'l.visser@gemeente.nl',
      role: 'viewer',
      status: 'inactive',
      lastLogin: '2024-01-15T14:20:00Z',
      createdAt: '2024-01-12T00:00:00Z'
    }
  ])
  
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as const
  })

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    uploadNotifications: true,
    errorNotifications: true,
    weeklyReports: false,
    securityAlerts: true
  })

  // System settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maxFileSize: 50,
    retentionDays: 365,
    autoDeleteProcessed: false,
    requireTwoFactor: false,
    sessionTimeout: 30,
    allowedFileTypes: ['pdf', 'docx', 'txt']
  })

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    logPageVisit('Settings')
  }, [])

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    logEvent({
      eventType: 'settings_tab_changed',
      action: `Switched to ${tab} settings tab`,
      details: { tab }
    })
  }

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Naam en email zijn verplicht')
      return
    }

    const user: SystemUser = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'pending',
      lastLogin: '',
      createdAt: new Date().toISOString()
    }

    setUsers(prev => [...prev, user])
    setNewUser({ name: '', email: '', role: 'user' })
    setShowAddUser(false)

    logEvent({
      eventType: 'user_created',
      action: 'New user added to system',
      details: { 
        userName: user.name, 
        userEmail: user.email, 
        userRole: user.role 
      }
    })

    toast.success(`Gebruiker ${user.name} toegevoegd`)
  }

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      toast.error('Kan laatste admin niet verwijderen')
      return
    }

    setUsers(prev => prev.filter(u => u.id !== userId))
    
    logEvent({
      eventType: 'user_deleted',
      action: 'User removed from system',
      details: { 
        userName: user.name, 
        userEmail: user.email, 
        userRole: user.role 
      }
    })

    toast.success(`Gebruiker ${user.name} verwijderd`)
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ))

    const user = users.find(u => u.id === userId)
    if (user) {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      
      logEvent({
        eventType: 'user_status_changed',
        action: `User status changed to ${newStatus}`,
        details: { 
          userName: user.name, 
          oldStatus: user.status,
          newStatus 
        }
      })

      toast.success(`${user.name} is nu ${newStatus === 'active' ? 'actief' : 'inactief'}`)
    }
  }

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => {
      const newSettings = { ...prev, [key]: !prev[key] }
      
      logEvent({
        eventType: 'notification_settings_changed',
        action: 'Notification preferences updated',
        details: { setting: key, enabled: newSettings[key] }
      })

      return newSettings
    })
  }

  const handleSystemSettingChange = (key: keyof SystemSettings, value: any) => {
    setSystemSettings(prev => {
      const newSettings = { ...prev, [key]: value }
      
      logEvent({
        eventType: 'system_settings_changed',
        action: 'System configuration updated',
        details: { setting: key, value }
      })

      return newSettings
    })
  }

  const handleSaveSettings = () => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Instellingen opgeslagen')
      
      logEvent({
        eventType: 'settings_saved',
        action: 'Settings configuration saved',
        details: { 
          tab: activeTab,
          timestamp: new Date().toISOString()
        }
      })
    }, 1000)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge-success">Actief</span>
      case 'inactive':
        return <span className="badge-error">Inactief</span>
      case 'pending':
        return <span className="badge-warning">In afwachting</span>
      default:
        return <span className="badge-neutral">Onbekend</span>
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Beheerderstoegang vereist
          </h2>
          <p className="text-neutral-600 mb-6">
            Alleen beheerders kunnen systeeminstellingen beheren.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-yellow-800">
              <Crown className="w-5 h-5" />
              <span className="font-medium">
                Wissel naar een beheerdersaccount om instellingen te beheren
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {t('settings.title')}
            </h1>
            <p className="text-neutral-600">
              Beheer gebruikers, meldingen en systeemconfiguratie
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Opslaan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'general', label: t('settings.general'), icon: Globe },
              { id: 'users', label: t('settings.users'), icon: Users },
              { id: 'notifications', label: t('settings.notifications'), icon: Bell },
              { id: 'system', label: t('settings.system'), icon: Database },
              { id: 'security', label: 'Beveiliging', icon: Shield }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as typeof activeTab)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {t('settings.general')}
              </h3>

              {/* Language Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('settings.language')}
                  </label>
                  <p className="text-sm text-neutral-500 mb-3">
                    {t('settings.selectLanguage')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
                    <button
                      onClick={() => {
                        setLanguage('nl')
                        logEvent({
                          eventType: 'language_changed',
                          action: 'Language changed to Dutch',
                          details: { language: 'nl' }
                        })
                        toast.success('Taal gewijzigd naar Nederlands')
                      }}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        language === 'nl'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg">🇳🇱</span>
                        <div className="text-center">
                          <div className="font-medium">{t('settings.dutch')}</div>
                          <div className="text-sm text-neutral-500">Nederlands</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setLanguage('en')
                        logEvent({
                          eventType: 'language_changed',
                          action: 'Language changed to English',
                          details: { language: 'en' }
                        })
                        toast.success('Language changed to English')
                      }}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        language === 'en'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg">🇬🇧</span>
                        <div className="text-center">
                          <div className="font-medium">{t('settings.english')}</div>
                          <div className="text-sm text-neutral-500">English</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Gebruikersbeheer
                </h3>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Gebruiker toevoegen
                </button>
              </div>

              {/* Add User Modal */}
              {showAddUser && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <h4 className="font-medium text-neutral-900 mb-4">Nieuwe gebruiker</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Naam
                      </label>
                      <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        className="input"
                        placeholder="Volledige naam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        className="input"
                        placeholder="email@gemeente.nl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Rol
                      </label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                        className="input"
                      >
                        <option value="user">Gebruiker</option>
                        <option value="admin">Beheerder</option>
                        <option value="viewer">Bekijker</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-3 mt-4">
                    <button
                      onClick={() => setShowAddUser(false)}
                      className="btn btn-ghost"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleAddUser}
                      className="btn btn-primary"
                    >
                      Toevoegen
                    </button>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Gebruiker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Laatste login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-neutral-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getRoleIcon(user.role)}
                            <span className="ml-2 text-sm text-neutral-900 capitalize">
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('nl-NL') : 'Nooit'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`p-1 rounded ${
                                user.status === 'active' 
                                  ? 'text-red-600 hover:text-red-800' 
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                              title={user.status === 'active' ? 'Deactiveren' : 'Activeren'}
                            >
                              {user.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              className="text-neutral-400 hover:text-neutral-600 p-1 rounded"
                              title="Bewerken"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {user.role !== 'admin' || users.filter(u => u.role === 'admin').length > 1 ? (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded"
                                title="Verwijderen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {t('settings.notificationSettings')}
              </h3>
              
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: t('settings.emailNotifications'), description: t('settings.emailNotificationsDesc') },
                  { key: 'uploadNotifications', label: t('settings.uploadNotifications'), description: t('settings.uploadNotificationsDesc') },
                  { key: 'errorNotifications', label: t('settings.errorNotifications'), description: t('settings.errorNotificationsDesc') },
                  { key: 'weeklyReports', label: t('settings.weeklyReports'), description: t('settings.weeklyReportsDesc') },
                  { key: 'securityAlerts', label: t('settings.securityAlerts'), description: t('settings.securityAlertsDesc') }
                ].map(setting => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-neutral-900">{setting.label}</h4>
                      <p className="text-sm text-neutral-600">{setting.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[setting.key as keyof NotificationSettings]}
                        onChange={() => handleNotificationChange(setting.key as keyof NotificationSettings)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Systeemconfiguratie
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Maximale bestandsgrootte (MB)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.maxFileSize}
                      onChange={(e) => handleSystemSettingChange('maxFileSize', parseInt(e.target.value))}
                      className="input"
                      min="1"
                      max="500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Bewaarperiode (dagen)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.retentionDays}
                      onChange={(e) => handleSystemSettingChange('retentionDays', parseInt(e.target.value))}
                      className="input"
                      min="30"
                      max="3650"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Sessie timeout (minuten)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => handleSystemSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="input"
                      min="5"
                      max="480"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Toegestane bestandstypen
                    </label>
                    <div className="space-y-2">
                      {['pdf', 'docx', 'txt', 'xlsx', 'pptx'].map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.allowedFileTypes.includes(type)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...systemSettings.allowedFileTypes, type]
                                : systemSettings.allowedFileTypes.filter(t => t !== type)
                              handleSystemSettingChange('allowedFileTypes', types)
                            }}
                            className="rounded border-neutral-300 text-primary focus:ring-primary"
                          />
                          <span className="ml-2 text-sm text-neutral-700 uppercase">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoDeleteProcessed}
                        onChange={(e) => handleSystemSettingChange('autoDeleteProcessed', e.target.checked)}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-neutral-700">
                        Automatisch verwerkte bestanden verwijderen
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Beveiligingsinstellingen
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <label className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-neutral-900">Twee-factor authenticatie vereist</h4>
                      <p className="text-sm text-neutral-600">Verplicht 2FA voor alle gebruikers</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.requireTwoFactor}
                      onChange={(e) => handleSystemSettingChange('requireTwoFactor', e.target.checked)}
                      className="rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Shield className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-medium text-neutral-900">Audit Log Integriteit</h4>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">
                      Blockchain-gebaseerde audit trail met cryptografische verificatie
                    </p>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Actief en geverifieerd</span>
                    </div>
                  </div>

                  <div className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Globe className="w-5 h-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-neutral-900">SSL/TLS Encryptie</h4>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">
                      End-to-end encryptie voor alle data transmissie
                    </p>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">TLS 1.3 Actief</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Beveiligingsaanbevelingen</h4>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• Activeer twee-factor authenticatie voor alle admin accounts</li>
                        <li>• Controleer regelmatig de audit logs op verdachte activiteiten</li>
                        <li>• Update wachtwoorden elke 90 dagen</li>
                        <li>• Beperkt toegang tot alleen noodzakelijke IP-adressen</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings 