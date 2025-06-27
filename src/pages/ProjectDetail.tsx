import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Upload, 
  FileText, 
  Calendar, 
  User, 
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  Archive,
  Settings,
  Tag,
  Building,
  Package,
  Loader2,
  X
} from 'lucide-react'
import { Project, ProjectDocument } from '../types/project'
import { useAuditLogger } from '../hooks/useAuditLogger'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { logEvent } = useAuditLogger()
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'settings'>('overview')
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    step: number
    message: string
    completed: boolean
  }>({ step: 0, message: '', completed: false })

  useEffect(() => {
    if (id) {
      loadProject(id)
      logEvent({
        eventType: 'project_viewed',
        action: 'Project detail page opened',
        details: { projectId: id }
      })
    }
  }, [id, logEvent])

  const loadProject = async (projectId: string) => {
    setLoading(true)
    
    // Mock project data - in real app this would be API calls
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        name: 'WOO-verzoek 2025-001 - Verkeersveiligheid',
        description: 'Documenten betreffende verkeersveiligheidsmaatregelen Hoofdstraat',
        status: 'active',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-17T14:30:00Z',
        createdBy: 'admin-1',
        dueDate: '2025-02-15T23:59:59Z',
        priority: 'high',
        requestNumber: 'WOO-2025-001',
        requestDate: '2025-01-10T00:00:00Z',
        requesterName: 'J. van der Berg',
        requesterEmail: 'j.vandenberg@email.com',
        requestDescription: 'Verzoek om openbaarmaking van documenten betreffende verkeersveiligheidsmaatregelen',
        totalDocuments: 12,
        processedDocuments: 8,
        pendingDocuments: 4,
        totalPiiItems: 45,
        defaultProfile: 'woo-standard',
        autoProcess: true,
        notifyOnCompletion: true,
        tags: ['verkeer', 'veiligheid', 'woo'],
        department: 'Verkeer & Vervoer',
        assignedTo: 'user-1'
      },
      {
        id: 'proj-2',
        name: 'WOO-verzoek 2025-002 - Bouwvergunningen',
        description: 'Bouwvergunningen en correspondentie Nieuwbouwproject Centrum',
        status: 'completed',
        createdAt: '2025-01-08T09:15:00Z',
        updatedAt: '2025-01-16T16:45:00Z',
        createdBy: 'user-1',
        dueDate: '2025-02-08T23:59:59Z',
        priority: 'medium',
        requestNumber: 'WOO-2025-002',
        requestDate: '2025-01-05T00:00:00Z',
        requesterName: 'M. Bakker',
        requesterEmail: 'm.bakker@email.com',
        requestDescription: 'Openbaarmaking bouwvergunningen en gerelateerde correspondentie',
        totalDocuments: 28,
        processedDocuments: 28,
        pendingDocuments: 0,
        totalPiiItems: 156,
        defaultProfile: 'woo-standard',
        autoProcess: false,
        notifyOnCompletion: true,
        tags: ['bouw', 'vergunning', 'woo'],
        department: 'Ruimtelijke Ordening'
      },
      {
        id: 'proj-3',
        name: 'WOO-verzoek 2025-003 - Subsidies Sport',
        description: 'Subsidieaanvragen en toekenningen sportverenigingen 2024',
        status: 'on_hold',
        createdAt: '2025-01-12T11:30:00Z',
        updatedAt: '2025-01-17T09:20:00Z',
        createdBy: 'admin-1',
        dueDate: '2025-02-20T23:59:59Z',
        priority: 'low',
        requestNumber: 'WOO-2025-003',
        requestDate: '2025-01-08T00:00:00Z',
        requesterName: 'S. de Wit',
        requesterEmail: 's.dewit@email.com',
        requestDescription: 'Inzage in subsidieaanvragen en toekenningen voor sportverenigingen',
        totalDocuments: 5,
        processedDocuments: 2,
        pendingDocuments: 3,
        totalPiiItems: 23,
        defaultProfile: 'woo-high-privacy',
        autoProcess: false,
        notifyOnCompletion: false,
        tags: ['subsidie', 'sport', 'woo'],
        department: 'Sport & Recreatie',
        assignedTo: 'user-2'
      }
    ]

    const mockDocuments: ProjectDocument[] = [
      {
        id: 'doc-1',
        projectId: projectId,
        name: 'Verkeerstellingen-Hoofdstraat-2024.pdf',
        originalName: 'Verkeerstellingen-Hoofdstraat-2024.pdf',
        size: 2456789,
        type: 'application/pdf',
        status: 'completed',
        uploadedAt: '2025-01-15T10:30:00Z',
        processedAt: '2025-01-15T10:35:00Z',
        uploadedBy: 'admin-1',
        piiCount: 12,
        piiItems: [],
        originalPath: '/uploads/doc-1-original.pdf',
        processedPath: '/uploads/doc-1-processed.pdf',
        profileUsed: 'woo-standard',
        processingTime: 45000
      },
      {
        id: 'doc-2',
        projectId: projectId,
        name: 'Correspondentie-gemeente-bewoners.docx',
        originalName: 'Correspondentie-gemeente-bewoners.docx',
        size: 1234567,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        status: 'processing',
        uploadedAt: '2025-01-16T09:15:00Z',
        uploadedBy: 'user-1',
        piiCount: 0,
        piiItems: [],
        originalPath: '/uploads/doc-2-original.docx',
        profileUsed: 'woo-standard'
      },
      {
        id: 'doc-3',
        projectId: projectId,
        name: 'Besluitvorming-verkeersmaatregelen.pdf',
        originalName: 'Besluitvorming-verkeersmaatregelen.pdf',
        size: 3456789,
        type: 'application/pdf',
        status: 'completed',
        uploadedAt: '2025-01-16T14:20:00Z',
        processedAt: '2025-01-16T14:28:00Z',
        uploadedBy: 'admin-1',
        piiCount: 8,
        piiItems: [],
        originalPath: '/uploads/doc-3-original.pdf',
        processedPath: '/uploads/doc-3-processed.pdf',
        profileUsed: 'woo-standard',
        processingTime: 32000
      }
    ]

    const foundProject = mockProjects.find(p => p.id === projectId)
    if (foundProject) {
      setProject(foundProject)
      setDocuments(mockDocuments.filter(d => d.projectId === projectId))
    }
    
    setLoading(false)
  }

  const getStatusBadge = (status: Project['status']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'active': return `${baseClasses} bg-blue-100 text-blue-800`
      case 'completed': return `${baseClasses} bg-green-100 text-green-800`
      case 'on_hold': return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'archived': return `${baseClasses} bg-neutral-100 text-neutral-800`
      default: return `${baseClasses} bg-neutral-100 text-neutral-800`
    }
  }

  const getPriorityBadge = (priority: Project['priority']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (priority) {
      case 'urgent': return `${baseClasses} bg-red-100 text-red-800`
      case 'high': return `${baseClasses} bg-orange-100 text-orange-800`
      case 'medium': return `${baseClasses} bg-blue-100 text-blue-800`
      case 'low': return `${baseClasses} bg-neutral-100 text-neutral-800`
      default: return `${baseClasses} bg-neutral-100 text-neutral-800`
    }
  }

  const getDocumentStatusBadge = (status: ProjectDocument['status']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'uploading': return `${baseClasses} bg-blue-100 text-blue-800`
      case 'processing': return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'completed': return `${baseClasses} bg-green-100 text-green-800`
      case 'error': return `${baseClasses} bg-red-100 text-red-800`
      case 'pending': return `${baseClasses} bg-neutral-100 text-neutral-800`
      default: return `${baseClasses} bg-neutral-100 text-neutral-800`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getProgressPercentage = () => {
    if (!project || project.totalDocuments === 0) return 0
    return Math.round((project.processedDocuments / project.totalDocuments) * 100)
  }

  const handleDownloadAll = async () => {
    if (!project || documents.length === 0) return

    setIsDownloadingAll(true)
    setDownloadProgress({ step: 1, message: 'Documenten verzamelen...', completed: false })

    try {
      // Simulate the download process with realistic steps
      const steps = [
        { message: 'Documenten verzamelen...', delay: 1000 },
        { message: 'Bestanden voorbereiden...', delay: 1500 },
        { message: 'ZIP-archief maken...', delay: 2000 },
        { message: 'Anonimisering valideren...', delay: 1200 },
        { message: 'Download voorbereiden...', delay: 800 }
      ]

      for (let i = 0; i < steps.length; i++) {
        setDownloadProgress({ 
          step: i + 1, 
          message: steps[i].message, 
          completed: false 
        })
        await new Promise(resolve => setTimeout(resolve, steps[i].delay))
      }

      // Create mock ZIP file download
      const zipContent = `Project: ${project.name}\nDocumenten: ${documents.length}\nAnonimisatiedatum: ${new Date().toLocaleString('nl-NL')}\n\nDit zou een ZIP bestand zijn met alle geanonimiseerde documenten.`
      const blob = new Blob([zipContent], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.requestNumber}-alle-documenten-geanonimiseerd.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setDownloadProgress({ 
        step: steps.length, 
        message: 'Download voltooid!', 
        completed: true 
      })

      // Log the download event
      logEvent({
        eventType: 'download_requested',
        action: 'Bulk project download',
        details: { 
          projectId: project.id, 
          documentCount: documents.length,
          type: 'bulk_anonymized'
        }
      })

      // Auto-close after success
      setTimeout(() => {
        setIsDownloadingAll(false)
        setDownloadProgress({ step: 0, message: '', completed: false })
      }, 2000)

    } catch (error) {
      console.error('Download error:', error)
      setDownloadProgress({ 
        step: 0, 
        message: 'Download mislukt. Probeer opnieuw.', 
        completed: false 
      })
      setTimeout(() => {
        setIsDownloadingAll(false)
        setDownloadProgress({ step: 0, message: '', completed: false })
      }, 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Project niet gevonden</h3>
        <p className="text-neutral-600 mb-6">Het opgevraagde project bestaat niet of is verwijderd.</p>
        <Link to="/projects" className="btn btn-primary">
          Terug naar projecten
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200 hover:border-neutral-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{project.name}</h1>
            <p className="text-neutral-600">{project.requestNumber} • {project.department}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            to={`/upload?project=${project.id}`}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Documenten uploaden</span>
          </Link>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Instellingen</span>
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Status</p>
              <div className="mt-2">
                <span className={getStatusBadge(project.status)}>
                  {project.status === 'active' ? 'Actief' :
                   project.status === 'completed' ? 'Afgerond' :
                   project.status === 'on_hold' ? 'On Hold' : 'Gearchiveerd'}
                </span>
              </div>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Voortgang</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{getProgressPercentage()}%</p>
              <p className="text-sm text-neutral-500">{project.processedDocuments}/{project.totalDocuments} documenten</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">PII Items</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{project.totalPiiItems}</p>
              <p className="text-sm text-neutral-500">Gevonden en verwerkt</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Deadline</p>
              <p className="text-lg font-bold text-neutral-900 mt-1">
                {project.dueDate ? formatDate(project.dueDate).split(' ')[0] : 'Geen'}
              </p>
              {project.dueDate && (
                <p className="text-sm text-neutral-500">
                  {Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dagen
                </p>
              )}
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Project Voortgang</h3>
          <span className="text-sm text-neutral-600">{getProgressPercentage()}% voltooid</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overzicht', icon: FileText },
              { id: 'documents', label: 'Documenten', icon: FileText },
              { id: 'settings', label: 'Instellingen', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-neutral-900 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Aanvrager Informatie
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Naam:</span>
                      <span className="text-neutral-900 font-medium">{project.requesterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">E-mail:</span>
                      <span className="text-neutral-900">{project.requesterEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Verzoek datum:</span>
                      <span className="text-neutral-900">{formatDate(project.requestDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Prioriteit:</span>
                      <span className={getPriorityBadge(project.priority)}>
                        {project.priority === 'urgent' ? 'Urgent' :
                         project.priority === 'high' ? 'Hoog' :
                         project.priority === 'medium' ? 'Gemiddeld' : 'Laag'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-neutral-900 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Project Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Afdeling:</span>
                      <span className="text-neutral-900 font-medium">{project.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Aangemaakt:</span>
                      <span className="text-neutral-900">{formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Laatst bijgewerkt:</span>
                      <span className="text-neutral-900">{formatDate(project.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Auto verwerking:</span>
                      <span className="text-neutral-900">{project.autoProcess ? 'Aan' : 'Uit'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">Verzoek Beschrijving</h4>
                <p className="text-neutral-700 bg-neutral-50 p-4 rounded-lg">
                  {project.requestDescription}
                </p>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 text-neutral-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-neutral-900">
                  Documenten ({documents.length})
                </h4>
                <div className="flex items-center space-x-2">
                  {documents.length > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      disabled={isDownloadingAll}
                      className="btn-sm btn-secondary flex items-center space-x-2"
                      title="Download alle geanonimiseerde documenten als ZIP"
                    >
                      <Package className="w-4 h-4" />
                      <span>Download alles</span>
                    </button>
                  )}
                <Link
                  to={`/upload?project=${project.id}`}
                  className="btn-sm btn-primary flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </Link>
                </div>
              </div>

              {documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Document</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">PII</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Upload datum</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-neutral-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-neutral-900">{doc.name}</p>
                                <p className="text-xs text-neutral-500">{formatFileSize(doc.size)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={getDocumentStatusBadge(doc.status)}>
                              {doc.status === 'uploading' ? 'Uploaden' :
                               doc.status === 'processing' ? 'Verwerken' :
                               doc.status === 'completed' ? 'Voltooid' :
                               doc.status === 'error' ? 'Fout' : 'In wachtrij'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              {doc.piiCount > 0 ? (
                                <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                              )}
                              <span className="text-sm text-neutral-900">{doc.piiCount} items</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-neutral-900">{formatDate(doc.uploadedAt)}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {doc.status === 'completed' && (
                                <>
                                  <Link
                                    to={`/document/${doc.id}`}
                                    className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                                    title="Bekijken"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                  <button
                                    className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                                    title="Downloaden"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                                title="Meer opties"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Nog geen documenten</h3>
                  <p className="text-neutral-600 mb-6">Upload documenten om te beginnen met anonimiseren.</p>
                  <Link
                    to={`/upload?project=${project.id}`}
                    className="btn btn-primary"
                  >
                    Eerste document uploaden
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-neutral-900 mb-4">Project Instellingen</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-200">
                    <div>
                      <p className="font-medium text-neutral-900">Automatisch verwerken</p>
                      <p className="text-sm text-neutral-600">Documenten direct verwerken na upload</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={project.autoProcess}
                      className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-neutral-200">
                    <div>
                      <p className="font-medium text-neutral-900">Notificaties bij voltooiing</p>
                      <p className="text-sm text-neutral-600">E-mail sturen wanneer verwerking klaar is</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={project.notifyOnCompletion}
                      className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                      readOnly
                    />
                  </div>
                  <div className="py-3">
                    <p className="font-medium text-neutral-900 mb-2">Standaard profiel</p>
                    <p className="text-sm text-neutral-600 mb-2">Profiel gebruikt voor nieuwe uploads</p>
                    <select
                      value={project.defaultProfile}
                      className="w-full max-w-sm px-3 py-2 border border-neutral-300 rounded-lg"
                      disabled
                    >
                      <option value="woo-standard">WOO Standaard</option>
                      <option value="woo-high-privacy">WOO Hoge Privacy</option>
                      <option value="woo-minimal">WOO Minimaal</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Download All Progress Modal */}
      {isDownloadingAll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Project downloaden
              </h3>
              {downloadProgress.completed && (
                <button
                  onClick={() => {
                    setIsDownloadingAll(false)
                    setDownloadProgress({ step: 0, message: '', completed: false })
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Progress steps */}
              <div className="space-y-3">
                {[
                  'Documenten verzamelen',
                  'Bestanden voorbereiden',
                  'ZIP-archief maken',
                  'Anonimisering valideren',
                  'Download voorbereiden'
                ].map((step, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      downloadProgress.step > index + 1
                        ? 'bg-green-100 text-green-600'
                        : downloadProgress.step === index + 1
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {downloadProgress.step > index + 1 ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : downloadProgress.step === index + 1 ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      downloadProgress.step >= index + 1
                        ? 'text-neutral-900 font-medium'
                        : 'text-neutral-500'
                    }`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              {/* Current status */}
              <div className="pt-4 border-t border-neutral-200">
                <div className="flex items-center space-x-2">
                  {!downloadProgress.completed ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    downloadProgress.completed ? 'text-green-600' : 'text-primary'
                  }`}>
                    {downloadProgress.message}
                  </span>
                </div>

                {downloadProgress.completed && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>{documents.length} documenten</strong> succesvol gedownload als ZIP-bestand.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail 