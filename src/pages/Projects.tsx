import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Archive,
  Pause,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  FolderOpen,
  Upload
} from 'lucide-react'
import { Project, ProjectStatus, ProjectPriority } from '../types/project'
import { useAuditLogger } from '../hooks/useAuditLogger'
import ProjectCreateModal from '../components/ProjectCreateModal'

const Projects = () => {
  const { logEvent } = useAuditLogger()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'dueDate'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data - in real app this would come from API
  useEffect(() => {
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
    setProjects(mockProjects)
  }, [])

  useEffect(() => {
    logEvent({
      eventType: 'page_visited',
      action: 'Navigated to projects page',
      details: { page: 'projects' }
    })
  }, [logEvent])

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4 text-blue-600" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'on_hold': return <Pause className="w-4 h-4 text-yellow-600" />
      case 'archived': return <Archive className="w-4 h-4 text-neutral-600" />
      default: return <Clock className="w-4 h-4 text-neutral-600" />
    }
  }

  const getStatusBadge = (status: ProjectStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'active': return `${baseClasses} bg-blue-100 text-blue-800`
      case 'completed': return `${baseClasses} bg-green-100 text-green-800`
      case 'on_hold': return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'archived': return `${baseClasses} bg-neutral-100 text-neutral-800`
      default: return `${baseClasses} bg-neutral-100 text-neutral-800`
    }
  }

  const getPriorityBadge = (priority: ProjectPriority) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (priority) {
      case 'urgent': return `${baseClasses} bg-red-100 text-red-800`
      case 'high': return `${baseClasses} bg-orange-100 text-orange-800`
      case 'medium': return `${baseClasses} bg-blue-100 text-blue-800`
      case 'low': return `${baseClasses} bg-neutral-100 text-neutral-800`
      default: return `${baseClasses} bg-neutral-100 text-neutral-800`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getProgressPercentage = (project: Project) => {
    if (project.totalDocuments === 0) return 0
    return Math.round((project.processedDocuments / project.totalDocuments) * 100)
  }

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updated':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    logEvent({
      eventType: 'search_performed',
      action: 'Search performed in projects',
      details: { query: value, context: 'projects' }
    })
  }

  const handleStatusFilter = (status: ProjectStatus | 'all') => {
    setStatusFilter(status)
    logEvent({
      eventType: 'filter_applied',
      action: 'Status filter applied',
      details: { filter: 'status', value: status, context: 'projects' }
    })
  }

  const handlePriorityFilter = (priority: ProjectPriority | 'all') => {
    setPriorityFilter(priority)
    logEvent({
      eventType: 'filter_applied',
      action: 'Priority filter applied',
      details: { filter: 'priority', value: priority, context: 'projects' }
    })
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    logEvent({
      eventType: 'sort_applied',
      action: 'Projects sort applied',
      details: { field, order: sortOrder === 'asc' ? 'desc' : 'asc', context: 'projects' }
    })
  }

  const handleProjectView = (projectId: string) => {
    logEvent({
      eventType: 'project_viewed',
      action: 'Project details viewed',
      details: { projectId }
    })
    // Navigate to project detail
  }

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Projecten</h1>
          <p className="text-neutral-600">
            Beheer WOO-verzoeken en documentprojecten
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuw Project</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Actieve Projecten</p>
              <p className="text-2xl font-bold text-neutral-900">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Afgerond</p>
              <p className="text-2xl font-bold text-neutral-900">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Totaal Documenten</p>
              <p className="text-2xl font-bold text-neutral-900">
                {projects.reduce((sum, p) => sum + p.totalDocuments, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Urgent</p>
              <p className="text-2xl font-bold text-neutral-900">
                {projects.filter(p => p.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Zoek projecten..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value as ProjectStatus | 'all')}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">Alle statussen</option>
            <option value="active">Actief</option>
            <option value="completed">Afgerond</option>
            <option value="on_hold">On Hold</option>
            <option value="archived">Gearchiveerd</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => handlePriorityFilter(e.target.value as ProjectPriority | 'all')}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">Alle prioriteiten</option>
            <option value="urgent">Urgent</option>
            <option value="high">Hoog</option>
            <option value="medium">Gemiddeld</option>
            <option value="low">Laag</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field as typeof sortBy)
              setSortOrder(order as 'asc' | 'desc')
            }}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="updated-desc">Laatst bijgewerkt</option>
            <option value="created-desc">Nieuwste eerst</option>
            <option value="name-asc">Naam A-Z</option>
            <option value="dueDate-asc">Deadline dichtbij</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Voortgang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Aanvrager
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/project/${project.id}`}
                          onClick={() => handleProjectView(project.id)}
                          className="text-sm font-medium text-neutral-900 hover:text-primary truncate block"
                        >
                          {project.name}
                        </Link>
                        <p className="text-sm text-neutral-500 truncate">
                          {project.requestNumber} • {project.department}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={getPriorityBadge(project.priority)}>
                            {project.priority === 'urgent' ? 'Urgent' :
                             project.priority === 'high' ? 'Hoog' :
                             project.priority === 'medium' ? 'Gemiddeld' : 'Laag'}
                          </span>
                          {project.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(project.status)}
                      <span className={getStatusBadge(project.status)}>
                        {project.status === 'active' ? 'Actief' :
                         project.status === 'completed' ? 'Afgerond' :
                         project.status === 'on_hold' ? 'On Hold' : 'Gearchiveerd'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">
                          {project.processedDocuments}/{project.totalDocuments} documenten
                        </span>
                        <span className="text-neutral-900 font-medium">
                          {getProgressPercentage(project)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(project)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {project.dueDate && (
                      <div className="text-sm">
                        <p className="text-neutral-900">
                          {formatDate(project.dueDate)}
                        </p>
                        <p className="text-neutral-500">
                          {Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dagen
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-neutral-900 font-medium">
                        {project.requesterName}
                      </p>
                      <p className="text-neutral-500">
                        {project.requesterEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/upload?project=${project.id}`}
                        className="p-2 text-primary hover:text-primary/80 rounded-lg hover:bg-primary/10"
                        title="Documenten uploaden"
                      >
                        <Upload className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/project/${project.id}`}
                        onClick={() => handleProjectView(project.id)}
                        className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100"
                        title="Project bekijken"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100"
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
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Geen projecten gevonden
          </h3>
          <p className="text-neutral-600 mb-6">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Pas je filters aan om meer resultaten te zien.'
              : 'Maak je eerste project aan om te beginnen.'}
          </p>
          {(!searchTerm && statusFilter === 'all' && priorityFilter === 'all') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Nieuw Project Aanmaken
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}

export default Projects 