import { useCallback } from 'react'
import { useUser } from '../store/userStore'

interface AuditEvent {
  eventType: string
  action: string
  documentId?: string
  details?: Record<string, any>
}

export const useAuditLogger = () => {
  const { currentUser, sessionId } = useUser()

  const logEvent = useCallback(async (event: AuditEvent) => {
    try {
      const payload = {
        ...event,
        userId: currentUser?.id || 'anonymous',
        sessionId: sessionId || 'demo-session',
        timestamp: new Date().toISOString()
      }

      const response = await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.warn('Failed to log audit event:', response.statusText)
      }
    } catch (error) {
      console.warn('Audit logging error:', error)
    }
  }, [currentUser?.id, sessionId])

  // Helper functions for common events
  const logPageVisit = useCallback((pageName: string) => {
    logEvent({
      eventType: 'page_visited',
      action: `Navigated to ${pageName}`,
      details: { pageName }
    })
  }, [logEvent])

  const logUploadStarted = useCallback((fileName: string, fileSize: number) => {
    logEvent({
      eventType: 'upload_started',
      action: 'Document upload initiated',
      details: { 
        fileName, 
        fileSize, 
        fileSizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100 
      }
    })
  }, [logEvent])

  const logUploadCompleted = useCallback((documentId: string, fileName: string) => {
    logEvent({
      eventType: 'upload_completed',
      action: 'Document upload completed',
      documentId,
      details: { fileName }
    })
  }, [logEvent])

  const logProfileSelected = useCallback((documentId: string, profileName: string) => {
    logEvent({
      eventType: 'profile_selected',
      action: 'Anonymization profile selected',
      documentId,
      details: { profileName }
    })
  }, [logEvent])

  const logMaskingRequested = useCallback((documentId: string, profileName: string) => {
    logEvent({
      eventType: 'masking_requested',
      action: 'Document anonymization started',
      documentId,
      details: { profileName, status: 'processing' }
    })
  }, [logEvent])

  const logMaskingSucceeded = useCallback((documentId: string, piiStats: Record<string, any>) => {
    logEvent({
      eventType: 'masking_succeeded',
      action: 'Document anonymization completed',
      documentId,
      details: { ...piiStats, status: 'completed' }
    })
  }, [logEvent])

  const logItemOverridden = useCallback((
    documentId: string, 
    itemType: string, 
    action: 'approved' | 'rejected',
    itemDetails: Record<string, any>
  ) => {
    logEvent({
      eventType: 'item_overridden',
      action: `PII item ${action}`,
      documentId,
      details: {
        itemType,
        overrideAction: action,
        ...itemDetails
      }
    })
  }, [logEvent])

  const logDownloadRequested = useCallback((
    documentId: string, 
    downloadType: 'original' | 'anonymized'
  ) => {
    logEvent({
      eventType: 'download_requested',
      action: 'Document download initiated',
      documentId,
      details: { downloadType, status: 'requested' }
    })
  }, [logEvent])

  const logDownloadCompleted = useCallback((
    documentId: string, 
    downloadType: 'original' | 'anonymized',
    fileSize?: number
  ) => {
    logEvent({
      eventType: 'download_completed',
      action: 'Document download completed',
      documentId,
      details: { 
        downloadType, 
        status: 'completed',
        fileSizeBytes: fileSize,
        fileSizeMB: fileSize ? Math.round(fileSize / 1024 / 1024 * 100) / 100 : undefined
      }
    })
  }, [logEvent])

  const logSessionStarted = useCallback((userRole: string) => {
    logEvent({
      eventType: 'session_started',
      action: 'User session started',
      details: { 
        userRole, 
        loginTime: new Date().toISOString() 
      }
    })
  }, [logEvent])

  const logUserSwitched = useCallback((fromUser: string, toUser: string, toRole: string) => {
    logEvent({
      eventType: 'user_switched',
      action: 'User account switched',
      details: { 
        fromUser, 
        toUser, 
        toRole,
        switchTime: new Date().toISOString()
      }
    })
  }, [logEvent])

  const logBatchAction = useCallback((
    documentId: string, 
    action: 'approve_all' | 'reject_all',
    itemCount: number
  ) => {
    logEvent({
      eventType: 'batch_action',
      action: `Batch ${action.replace('_', ' ')} performed`,
      documentId,
      details: { 
        batchAction: action,
        itemCount,
        performedAt: new Date().toISOString()
      }
    })
  }, [logEvent])

  const logSettingsChanged = useCallback((settingType: string, changes: Record<string, any>) => {
    logEvent({
      eventType: 'settings_changed',
      action: `${settingType} settings modified`,
      details: { 
        settingType,
        changes,
        modifiedAt: new Date().toISOString()
      }
    })
  }, [logEvent])

  return {
    logEvent,
    logPageVisit,
    logUploadStarted,
    logUploadCompleted,
    logProfileSelected,
    logMaskingRequested,
    logMaskingSucceeded,
    logItemOverridden,
    logDownloadRequested,
    logDownloadCompleted,
    logSessionStarted,
    logUserSwitched,
    logBatchAction,
    logSettingsChanged
  }
} 