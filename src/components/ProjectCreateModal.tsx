import { useState } from 'react'
import { X, Calendar, User, Mail, FileText, Tag, AlertCircle } from 'lucide-react'
import { Project, ProjectPriority } from '../types/project'
import { useUser } from '../store/userStore'
import { useAuditLogger } from '../hooks/useAuditLogger'

interface ProjectCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: Project) => void
}

const ProjectCreateModal = ({ isOpen, onClose, onProjectCreated }: ProjectCreateModalProps) => {
  const { currentUser } = useUser()
  const { logEvent } = useAuditLogger()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requestNumber: '',
    requestDate: new Date().toISOString().split('T')[0],
    requesterName: '',
    requesterEmail: '',
    requestDescription: '',
    dueDate: '',
    priority: 'medium' as ProjectPriority,
    department: '',
    tags: '',
    defaultProfile: 'woo-standard',
    autoProcess: true,
    notifyOnCompletion: true
  })

  const departments = [
    'Algemene Zaken',
    'Burgerzaken',
    'Financiën',
    'Juridische Zaken',
    'Ruimtelijke Ordening',
    'Sport & Recreatie',
    'Verkeer & Vervoer',
    'Werk & Inkomen',
    'Zorg & Welzijn'
  ]

  const profiles = [
    { id: 'woo-standard', name: 'WOO Standaard', description: 'Standaard anonimisatie voor WOO-verzoeken' },
    { id: 'woo-high-privacy', name: 'WOO Hoge Privacy', description: 'Verhoogde privacy voor gevoelige documenten' },
    { id: 'woo-minimal', name: 'WOO Minimaal', description: 'Minimale anonimisatie voor openbare documenten' }
  ]

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate unique request number if not provided
      const requestNumber = formData.requestNumber || `WOO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'unknown',
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        priority: formData.priority,
        requestNumber,
        requestDate: new Date(formData.requestDate).toISOString(),
        requesterName: formData.requesterName,
        requesterEmail: formData.requesterEmail,
        requestDescription: formData.requestDescription,
        totalDocuments: 0,
        processedDocuments: 0,
        pendingDocuments: 0,
        totalPiiItems: 0,
        defaultProfile: formData.defaultProfile,
        autoProcess: formData.autoProcess,
        notifyOnCompletion: formData.notifyOnCompletion,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        department: formData.department,
        assignedTo: currentUser?.id
      }

      // Log the project creation
      logEvent('project_created', {
        projectId: newProject.id,
        projectName: newProject.name,
        requestNumber: newProject.requestNumber,
        priority: newProject.priority,
        department: newProject.department
      })

      onProjectCreated(newProject)
      onClose()

      // Reset form
      setFormData({
        name: '',
        description: '',
        requestNumber: '',
        requestDate: new Date().toISOString().split('T')[0],
        requesterName: '',
        requesterEmail: '',
        requestDescription: '',
        dueDate: '',
        priority: 'medium',
        department: '',
        tags: '',
        defaultProfile: 'woo-standard',
        autoProcess: true,
        notifyOnCompletion: true
      })
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Nieuw Project Aanmaken
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Maak een nieuw WOO-project aan om documenten te beheren
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Projectinformatie
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Projectnaam *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="bijv. WOO-verzoek 2025-001 - Verkeersveiligheid"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Beschrijving
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Korte beschrijving van het project..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Verzoek nummer
                        </label>
                        <input
                          type="text"
                          value={formData.requestNumber}
                          onChange={(e) => handleInputChange('requestNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="Automatisch gegenereerd"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Verzoek datum *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.requestDate}
                          onChange={(e) => handleInputChange('requestDate', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Afdeling *
                      </label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Selecteer afdeling</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Tags (gescheiden door komma's)
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="bijv. woo, verkeer, veiligheid"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Aanvrager informatie
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Naam aanvrager *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.requesterName}
                        onChange={(e) => handleInputChange('requesterName', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Voor- en achternaam"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        E-mailadres *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.requesterEmail}
                        onChange={(e) => handleInputChange('requesterEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="naam@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Verzoek beschrijving *
                      </label>
                      <textarea
                        required
                        value={formData.requestDescription}
                        onChange={(e) => handleInputChange('requestDescription', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Beschrijf wat de aanvrager wil inzien..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Planning & Instellingen
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Deadline
                        </label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => handleInputChange('dueDate', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Prioriteit
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value as ProjectPriority)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="low">Laag</option>
                          <option value="medium">Gemiddeld</option>
                          <option value="high">Hoog</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Standaard profiel
                      </label>
                      <select
                        value={formData.defaultProfile}
                        onChange={(e) => handleInputChange('defaultProfile', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        {profiles.map(profile => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name} - {profile.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="autoProcess"
                          checked={formData.autoProcess}
                          onChange={(e) => handleInputChange('autoProcess', e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                        />
                        <label htmlFor="autoProcess" className="ml-2 text-sm text-neutral-700">
                          Automatisch verwerken bij upload
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notifyOnCompletion"
                          checked={formData.notifyOnCompletion}
                          onChange={(e) => handleInputChange('notifyOnCompletion', e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                        />
                        <label htmlFor="notifyOnCompletion" className="ml-2 text-sm text-neutral-700">
                          Notificatie bij voltooiing
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
              <div className="flex items-center text-sm text-neutral-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Alle velden met * zijn verplicht
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Bezig...' : 'Project Aanmaken'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProjectCreateModal 