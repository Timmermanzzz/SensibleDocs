export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'archived' | 'on_hold'
  createdAt: string
  updatedAt: string
  createdBy: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // WOO specific fields
  requestNumber: string
  requestDate: string
  requesterName: string
  requesterEmail: string
  requestDescription: string
  
  // Statistics
  totalDocuments: number
  processedDocuments: number
  pendingDocuments: number
  totalPiiItems: number
  
  // Settings
  defaultProfile: string
  autoProcess: boolean
  notifyOnCompletion: boolean
  
  // Metadata
  tags: string[]
  department: string
  assignedTo?: string
}

export interface ProjectDocument {
  id: string
  projectId: string
  name: string
  originalName: string
  size: number
  type: string
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'pending'
  uploadedAt: string
  processedAt?: string
  uploadedBy: string
  
  // Processing results
  piiCount: number
  piiItems: Array<{
    type: string
    text: string
    confidence: number
    position: { start: number; end: number }
    status: 'pending' | 'approved' | 'rejected'
  }>
  
  // File paths
  originalPath: string
  processedPath?: string
  
  // Metadata
  profileUsed?: string
  processingTime?: number
  errorMessage?: string
}

export type ProjectStatus = Project['status']
export type ProjectPriority = Project['priority']
export type DocumentStatus = ProjectDocument['status'] 