import { useState, useEffect } from 'react'
import { 
  Shield, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Calendar,
  User,
  FileText,
  Hash,
  Clock,
  Database,
  TrendingUp,
  Lock,
  Crown
} from 'lucide-react'
import { useUser } from '../store/userStore'
import { useAuditLogger } from '../hooks/useAuditLogger'
import { useLanguageStore } from '../store/languageStore'
import toast from 'react-hot-toast'

interface AuditEvent {
  id: string
  timestamp: string
  sequence: number
  eventType: string
  action: string
  userId: string
  documentId?: string
  details: Record<string, any>
  sessionId: string
  hash: string
  previousHash: string
  metadata: {
    userAgent: string
    ipAddress: string
  }
}

interface AuditStats {
  totalEvents: number
  eventTypes: Record<string, number>
  users: Record<string, number>
  documentsProcessed: number
  timeRange: {
    first: string | null
    last: string | null
  }
}

interface IntegrityCheck {
  isValid: boolean
  issues: Array<{
    sequence: number
    issue: string
    expected?: string
    actual?: string
  }>
  totalEvents: number
}

const AuditLog = () => {
  const { currentUser } = useUser()
  const { logPageVisit } = useAuditLogger()
  const { t } = useLanguageStore()
  const [logs, setLogs] = useState<AuditEvent[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [integrity, setIntegrity] = useState<IntegrityCheck | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    userId: '',
    eventType: '',
    documentId: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    logPageVisit('Audit Log')
    if (isAdmin) {
      fetchAuditData()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchAuditData, 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin, filters])

  const fetchAuditData = async () => {
    if (!isAdmin) return

    try {
      const params = new URLSearchParams({
        userRole: currentUser?.role || '',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })
      
      const response = await fetch(`/api/audit?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setLogs(data.logs || [])
        setStats(data.stats || null)
        setIntegrity(data.integrity || null)
      } else {
        toast.error(data.error || 'Fout bij laden audit logs')
      }
    } catch (error) {
      toast.error('Verbindingsfout bij laden audit logs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    if (!isAdmin) return

    try {
      const params = new URLSearchParams({
        userRole: currentUser?.role || '',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })
      
      const response = await fetch(`/api/audit/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Audit log geëxporteerd')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Export mislukt')
      }
    } catch (error) {
      toast.error('Fout bij exporteren')
    }
  }

  const handleVerifyIntegrity = async () => {
    if (!isAdmin) return

    try {
      const response = await fetch(`/api/audit/verify?userRole=${currentUser?.role}`)
      const data = await response.json()
      
      if (response.ok) {
        setIntegrity(data.verification)
        toast.success(
          data.verification.isValid 
            ? 'Log integriteit geverifieerd ✅' 
            : 'Log integriteit problemen gevonden ⚠️'
        )
      }
    } catch (error) {
      toast.error('Verificatie mislukt')
    }
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'upload_started':
      case 'upload_completed':
        return <FileText className="w-4 h-4 text-blue-600" />
      case 'masking_requested':
      case 'masking_succeeded':
        return <Shield className="w-4 h-4 text-green-600" />
      case 'item_overridden':
        return <Eye className="w-4 h-4 text-orange-600" />
      case 'download_requested':
      case 'download_completed':
        return <Download className="w-4 h-4 text-purple-600" />
      case 'session_started':
      case 'user_switched':
        return <User className="w-4 h-4 text-indigo-600" />
      case 'page_visited':
        return <Clock className="w-4 h-4 text-gray-600" />
      default:
        return <Database className="w-4 h-4 text-gray-600" />
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'upload_started':
      case 'upload_completed':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'masking_requested':
      case 'masking_succeeded':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'item_overridden':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'download_requested':
      case 'download_completed':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'session_started':
      case 'user_switched':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
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
            Alleen beheerders kunnen audit logs bekijken. Deze functie is beperkt voor veiligheidsredenen.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-yellow-800">
              <Crown className="w-5 h-5" />
              <span className="font-medium">
                Wissel naar een beheerdersaccount om audit logs te bekijken
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('audit.trail')}</h1>
          <p className="text-neutral-600">
            {t('audit.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline"
          >
            <Filter className="w-4 h-4 mr-2" />
            {t('audit.filters')}
          </button>
          
          <button
            onClick={handleVerifyIntegrity}
            className="btn btn-outline"
          >
            <Shield className="w-4 h-4 mr-2" />
            {t('audit.integrityVerify')}
          </button>
          
          <button
            onClick={handleExport}
            className="btn btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('audit.export')}
          </button>
          
          <button
            onClick={fetchAuditData}
            className="btn btn-ghost"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">{t('audit.totalEvents')}</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.totalEvents}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">{t('audit.documents')}</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.documentsProcessed}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">{t('audit.activeUsers')}</p>
                  <p className="text-2xl font-bold text-neutral-900">{Object.keys(stats.users).length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${integrity?.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                  {integrity?.isValid ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">{t('audit.logIntegrity')}</p>
                  <p className={`text-2xl font-bold ${integrity?.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {integrity?.isValid ? t('audit.valid') : 'Issues'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Gebruiker ID
                </label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                  className="input"
                  placeholder="user-1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Event Type
                </label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                  className="input"
                >
                  <option value="">Alle types</option>
                  <option value="upload_started">Upload Started</option>
                  <option value="upload_completed">Upload Completed</option>
                  <option value="masking_requested">Masking Requested</option>
                  <option value="item_overridden">PII Override</option>
                  <option value="download_requested">Download Requested</option>
                  <option value="session_started">Session Started</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Document ID
                </label>
                <input
                  type="text"
                  value={filters.documentId}
                  onChange={(e) => setFilters(prev => ({ ...prev, documentId: e.target.value }))}
                  className="input"
                  placeholder="123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Datum
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  End Datum
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setFilters({ userId: '', eventType: '', documentId: '', startDate: '', endDate: '' })}
                className="btn btn-ghost btn-sm"
              >
                Reset Filters
              </button>
              <span className="text-sm text-neutral-500">
                {logs.length} events gevonden
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">
            Audit Events ({logs.length})
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Real-time logging van alle gebruikersacties
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Gebruiker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Hash
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {logs.map((event) => (
                <tr 
                  key={event.id}
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span>{new Date(event.timestamp).toLocaleString('nl-NL')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {getEventTypeIcon(event.eventType)}
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getEventTypeColor(event.eventType)}`}>
                          {event.eventType}
                        </span>
                        <div className="text-sm text-neutral-900 mt-1">
                          {event.action}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {event.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {event.documentId || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">
                    {JSON.stringify(event.details)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-neutral-400" />
                      <span className="font-mono text-xs text-neutral-600">
                        {event.hash.substring(0, 8)}...
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {logs.length === 0 && !isLoading && (
            <div className="p-8 text-center">
              <Database className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Geen audit events gevonden
              </h3>
              <p className="text-neutral-600">
                Er zijn nog geen events gelogd of je filters zijn te restrictief.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Event Details
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700">Event ID</label>
                  <p className="text-sm text-neutral-900 font-mono">{selectedEvent.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Sequence</label>
                  <p className="text-sm text-neutral-900">{selectedEvent.sequence}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Timestamp</label>
                  <p className="text-sm text-neutral-900">
                    {new Date(selectedEvent.timestamp).toLocaleString('nl-NL')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Session ID</label>
                  <p className="text-sm text-neutral-900 font-mono">{selectedEvent.sessionId}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-700">Hash (SHA-256)</label>
                <p className="text-sm text-neutral-900 font-mono break-all bg-neutral-100 p-2 rounded">
                  {selectedEvent.hash}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-700">Previous Hash</label>
                <p className="text-sm text-neutral-900 font-mono break-all bg-neutral-100 p-2 rounded">
                  {selectedEvent.previousHash || 'Genesis event'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-700">Details (JSON)</label>
                <pre className="text-sm text-neutral-900 bg-neutral-100 p-3 rounded overflow-auto">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-700">Metadata</label>
                <pre className="text-sm text-neutral-900 bg-neutral-100 p-3 rounded overflow-auto">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLog 