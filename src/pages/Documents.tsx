import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  User,
  MoreVertical,
  Trash2
} from 'lucide-react'
import { useAuditLogger } from '../hooks/useAuditLogger'
import toast from 'react-hot-toast'

interface Document {
  id: string
  name: string
  status: 'completed' | 'processing' | 'error'
  piiFound: number
  user: string
  processedAt: string
  size: string
  type: string
}

const Documents = () => {
  const { logPageVisit, logDownloadRequested, logEvent } = useAuditLogger()
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'pii'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Log page visit
    logPageVisit('Documents')
    
    // Mock data - in real app this would come from API
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'WOO-verzoek-2024-001.pdf',
        status: 'completed',
        piiFound: 23,
        user: 'M. van der Berg',
        processedAt: '2024-01-15T11:30:00Z',
        size: '2.4 MB',
        type: 'PDF'
      },
      {
        id: '2', 
        name: 'Besluit-subsidie-aanvraag.docx',
        status: 'processing',
        piiFound: 0,
        user: 'J. Janssen',
        processedAt: '2024-01-15T10:45:00Z',
        size: '1.8 MB',
        type: 'Word'
      },
      {
        id: '3',
        name: 'Correspondentie-klacht-burger.pdf',
        status: 'completed',
        piiFound: 15,
        user: 'S. Patel',
        processedAt: '2024-01-15T09:20:00Z',
        size: '3.2 MB',
        type: 'PDF'
      },
      {
        id: '4',
        name: 'Raadsstuk-gemeentebegroting-2024.pdf',
        status: 'completed',
        piiFound: 8,
        user: 'A. de Vries',
        processedAt: '2024-01-15T08:15:00Z',
        size: '5.1 MB',
        type: 'PDF'
      },
      {
        id: '5',
        name: 'Vergunning-evenement-parkfeest.docx',
        status: 'completed',
        piiFound: 12,
        user: 'R. Bakker',
        processedAt: '2024-01-14T16:30:00Z',
        size: '0.9 MB',
        type: 'Word'
      },
      {
        id: '6',
        name: 'Interne-memo-reorganisatie.pdf',
        status: 'error',
        piiFound: 0,
        user: 'L. Visser',
        processedAt: '2024-01-14T14:20:00Z',
        size: '1.2 MB',
        type: 'PDF'
      }
    ]
    
    setDocuments(mockDocuments)
    setIsLoading(false)
  }, [])

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.user.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'pii':
          aValue = a.piiFound
          bValue = b.piiFound
          break
        case 'date':
        default:
          aValue = new Date(a.processedAt).getTime()
          bValue = new Date(b.processedAt).getTime()
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Voltooid
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <div className="w-3 h-3 mr-1 border border-warning border-t-transparent rounded-full animate-spin" />
            Verwerken
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Fout
          </span>
        )
    }
  }

  const getPIIBadge = (piiFound: number) => {
    if (piiFound === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-success/10 text-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Geen PII
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-warning/10 text-warning">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {piiFound} items
        </span>
      )
    }
  }

  // Handle document actions with audit logging
  const handleDocumentView = (documentId: string, documentName: string) => {
    logEvent({
      eventType: 'document_viewed',
      action: 'Document opened from documents list',
      documentId,
      details: { documentName, source: 'documents_page' }
    })
  }

  const handleDocumentDownload = (documentId: string, documentName: string) => {
    logDownloadRequested(documentId, 'anonymized')
    toast.success(`Download gestart voor ${documentName}`)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.length > 2) {
      logEvent({
        eventType: 'search_performed',
        action: 'Document search executed',
        details: { searchTerm: term, resultCount: filteredDocuments.length }
      })
    }
  }

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value)
    }
    
    logEvent({
      eventType: 'filter_applied',
      action: 'Document list filtered',
      details: { filterType, filterValue: value, resultCount: filteredDocuments.length }
    })
  }

  const handleSortChange = (sortValue: string) => {
    const [by, order] = sortValue.split('-')
    setSortBy(by as 'date' | 'name' | 'pii')
    setSortOrder(order as 'asc' | 'desc')
    
    logEvent({
      eventType: 'sort_applied',
      action: 'Document list sorted',
      details: { sortBy: by, sortOrder: order }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Alle Documenten
            </h1>
            <p className="text-neutral-600">
              Overzicht van alle verwerkte documenten en hun anonimisatiestatus
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-neutral-900">
              {documents.length}
            </div>
            <div className="text-sm text-neutral-500">
              Totaal documenten
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Zoek op documentnaam of gebruiker..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Alle statussen</option>
              <option value="completed">Voltooid</option>
              <option value="processing">Verwerken</option>
              <option value="error">Fout</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-600">Sorteer op:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="date-desc">Datum (nieuw eerst)</option>
              <option value="date-asc">Datum (oud eerst)</option>
              <option value="name-asc">Naam (A-Z)</option>
              <option value="name-desc">Naam (Z-A)</option>
              <option value="pii-desc">PII items (hoog-laag)</option>
              <option value="pii-asc">PII items (laag-hoog)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  PII Gevonden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Verwerkt door
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <Link
                          to={`/document/${doc.id}`}
                          className="text-sm font-medium text-primary hover:text-primary/80"
                          onClick={() => handleDocumentView(doc.id, doc.name)}
                        >
                          {doc.name}
                        </Link>
                        <div className="text-xs text-neutral-500">
                          {doc.type} • {doc.size}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPIIBadge(doc.piiFound)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-neutral-400 mr-2" />
                      <span className="text-sm text-neutral-900">{doc.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-neutral-400 mr-2" />
                      <div>
                        <div className="text-sm text-neutral-900">
                          {new Date(doc.processedAt).toLocaleDateString('nl-NL')}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {new Date(doc.processedAt).toLocaleTimeString('nl-NL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/document/${doc.id}`}
                        className="text-primary hover:text-primary/80 p-1 rounded"
                        title="Bekijken"
                        onClick={() => handleDocumentView(doc.id, doc.name)}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {doc.status === 'completed' && (
                        <button
                          className="text-success hover:text-success/80 p-1 rounded"
                          title="Downloaden"
                          onClick={() => handleDocumentDownload(doc.id, doc.name)}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="text-neutral-400 hover:text-neutral-600 p-1 rounded"
                        title="Meer opties"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              Geen documenten gevonden
            </h3>
            <p className="text-neutral-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Probeer je zoekopdracht of filters aan te passen.'
                : 'Upload je eerste document om aan de slag te gaan.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Documents 