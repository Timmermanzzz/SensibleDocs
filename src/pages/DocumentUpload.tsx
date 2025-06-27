import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  Settings,
  Play
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuditLogger } from '../hooks/useAuditLogger'
import { useLanguageStore } from '../store/languageStore'
import { useEffect } from 'react'

interface UploadedFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  piiFound?: number
  errorMessage?: string
}

const DocumentUpload = () => {
  const { logPageVisit, logUploadStarted, logUploadCompleted, logProfileSelected, logMaskingRequested } = useAuditLogger()
  const { t } = useLanguageStore()
  const [searchParams] = useSearchParams()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [selectedProfile, setSelectedProfile] = useState('default')
  const [isProcessing, setIsProcessing] = useState(false)
  const navigate = useNavigate()
  
  const projectId = searchParams.get('project')
  const [selectedProject, setSelectedProject] = useState<any>(null)

  useEffect(() => {
    logPageVisit('Document Upload')
  }, [])

  // Load project if projectId is provided
  useEffect(() => {
    if (projectId) {
      // Mock project data - in real app this would be an API call
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'WOO-verzoek 2025-001 - Verkeersveiligheid',
          requestNumber: 'WOO-2025-001',
          defaultProfile: 'woo-standard'
        },
        {
          id: 'proj-2', 
          name: 'WOO-verzoek 2025-002 - Bouwvergunningen',
          requestNumber: 'WOO-2025-002',
          defaultProfile: 'woo-standard'
        },
        {
          id: 'proj-3',
          name: 'WOO-verzoek 2025-003 - Subsidies Sport', 
          requestNumber: 'WOO-2025-003',
          defaultProfile: 'woo-high-privacy'
        }
      ]
      
      const project = mockProjects.find(p => p.id === projectId)
      if (project) {
        setSelectedProject(project)
        setSelectedProfile(project.defaultProfile)
      }
    }
  }, [projectId])

  const profiles = [
    {
      id: 'default',
      name: t('upload.standardProfile'),
      description: t('upload.standardDesc')
    },
    {
      id: 'strict',
      name: t('upload.strictProfile'),
      description: t('upload.strictDesc')
    },
    {
      id: 'minimal',
      name: t('upload.minimalProfile'),
      description: t('upload.minimalDesc')
    },
    {
      id: 'full-anonymization',
      name: t('upload.fullAnonymization'),
      description: t('upload.fullAnonDesc')
    }
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as const,
      progress: 0
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    
    // Log upload started for each file
    acceptedFiles.forEach(file => {
      logUploadStarted(file.name, file.size)
    })
    
    toast.success(`${acceptedFiles.length} bestand(en) toegevoegd`)
  }, [logUploadStarted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name} ${t('upload.fileTooLarge')}`)
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name} ${t('upload.invalidFileType')}`)
          }
        })
      })
    }
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Helper function to get content type
  const getContentType = (file: File): string => {
    const extension = file.name.toLowerCase().split('.').pop()
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'txt': 'text/plain'
    }
    return mimeTypes[extension || ''] || file.type || 'application/octet-stream'
  }

  // Private AI full anonymization
  const processWithPrivateAI = async (file: File): Promise<void> => {
    try {
      // Convert file to base64
      const fileData = await fileToBase64(file)
      const contentType = getContentType(file)

      // Call Private AI API
      const response = await fetch('/api/anonymize-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileData,
          contentType,
          options: {
            accuracy: 'high',
            redactionType: 'marker'
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'API fout bij anonimisering')
      }

      const result = await response.json()

      if (result.success) {
        // Create download link for anonymized document
        const anonymizedData = result.processed_file
        const byteCharacters = atob(anonymizedData)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: contentType })

        // Auto-download the anonymized document
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `anoniem_${file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Show success message
        toast.success(
          `${file.name} volledig geanonimiseerd! ${result.stats?.entities_found || 0} PII items vervangen.`,
          { 
            duration: 4000,
            icon: '🛡️'
          }
        )

      } else {
        throw new Error('Anonimisering mislukt')
      }

    } catch (error: any) {
      console.error('Private AI error:', error)
      throw new Error(`Fout bij anonimisering: ${error.message}`)
    }
  }

  const processFiles = async () => {
    if (files.length === 0) {
      toast.error('Voeg eerst bestanden toe')
      return
    }

    setIsProcessing(true)

    try {
      for (const file of files) {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'uploading', progress: 25 }
            : f
        ))

        // Check if full anonymization profile is selected
        if (selectedProfile === 'full-anonymization') {
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'processing', progress: 50 }
              : f
          ))

          // Process with Private AI
          await processWithPrivateAI(file.file)
          
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: 'completed', 
                  progress: 100,
                  piiFound: 0 // Will be updated from API response
                }
              : f
          ))

        } else {
          // Regular processing (mock)
        await new Promise(resolve => setTimeout(resolve, 1000))

        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing', progress: 75 }
            : f
        ))

        await new Promise(resolve => setTimeout(resolve, 2000))

        // Mock AI processing result
        const piiFound = Math.floor(Math.random() * 20)
        
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100,
                piiFound 
              }
            : f
        ))
        }

        // Log upload completion
        logUploadCompleted(file.id, file.file.name)
      }

      if (selectedProfile === 'full-anonymization') {
        toast.success('Alle documenten zijn volledig geanonimiseerd en gedownload!')
      } else {
      toast.success('Alle documenten zijn succesvol verwerkt!')
      setTimeout(() => {
        navigate('/documents')
      }, 2000)
      }

    } catch (error: any) {
      console.error('Processing error:', error)
      toast.error(`Er is een fout opgetreden: ${error.message}`)
      
      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'error',
        errorMessage: error.message || 'Verwerking mislukt'
      })))
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="w-5 h-5 text-neutral-400" />
      case 'uploading':
      case 'processing':
        return <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error" />
    }
  }

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'pending':
        return t('upload.readyForProcessing')
      case 'uploading':
        return t('upload.uploading')
      case 'processing':
        return selectedProfile === 'full-anonymization' ? t('upload.documentAnonymizing') : t('upload.aiProcessing')
      case 'completed':
        return selectedProfile === 'full-anonymization' ? t('upload.fullyAnonymized') : `${t('upload.completed')} - ${file.piiFound} ${t('upload.piiItemsFound')}`
      case 'error':
        return file.errorMessage || t('upload.errorOccurred')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6">
        {selectedProject ? (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 text-primary mr-2" />
              <span className="text-sm font-medium text-primary">{t('upload.uploadingTo')}</span>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">
              {selectedProject.name}
            </h2>
            <p className="text-sm text-neutral-600">
              {selectedProject.requestNumber}
            </p>
          </div>
        ) : null}
        
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          {selectedProject ? t('upload.addToProject') : t('upload.title')}
        </h1>
      </div>

      {/* Profile selection */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-neutral-600 mr-2" />
          <h2 className="text-lg font-semibold text-neutral-900">
            {t('upload.anonymizationProfile')}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedProfile === profile.id
                  ? 'border-primary bg-primary/5'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => {
                setSelectedProfile(profile.id)
                logProfileSelected('upload-session', profile.name)
              }}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  checked={selectedProfile === profile.id}
                  onChange={() => setSelectedProfile(profile.id)}
                  className="mr-3"
                />
                <h3 className="font-medium text-neutral-900">
                  {profile.name}
                </h3>
              </div>
              <p className="text-sm text-neutral-600">
                {profile.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* File upload area */}
      <div className="card p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-neutral-300 hover:border-neutral-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          
          {isDragActive ? (
            <p className="text-lg text-primary font-medium">
              {t('upload.dropFiles')}
            </p>
          ) : (
            <div>
              <p className="text-lg font-medium text-neutral-900 mb-2">
                {t('upload.dragFiles')}
              </p>
              <p className="text-neutral-600">
                {t('upload.supportedFormats')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {t('upload.selectedFiles')} ({files.length})
              </h2>
              <button
                onClick={processFiles}
                disabled={isProcessing || files.every(f => f.status === 'completed')}
                className="btn btn-primary disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                {isProcessing ? t('upload.processing') : t('upload.startProcessing')}
              </button>
            </div>
          </div>

          <div className="divide-y divide-neutral-200">
            {files.map(file => (
              <div key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 mr-4">
                    {getStatusIcon(file.status)}
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB • {getStatusText(file)}
                      </p>
                      {file.progress > 0 && file.status !== 'completed' && (
                        <div className="mt-2 w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentUpload 