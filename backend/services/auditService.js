import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

class AuditService {
  constructor() {
    this.logPath = '/tmp/demo/audit-log.json'
    this.ensureLogFile()
  }

  ensureLogFile() {
    const dir = path.dirname(this.logPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    if (!fs.existsSync(this.logPath)) {
      fs.writeFileSync(this.logPath, JSON.stringify([], null, 2))
    }
  }

  generateHash(data, previousHash = '') {
    const content = JSON.stringify(data) + previousHash
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  async logEvent(eventData) {
    try {
      // Read existing logs directly from file
      const data = fs.readFileSync(this.logPath, 'utf8')
      const logs = JSON.parse(data)
      
      // Get previous hash for chain
      const previousHash = logs.length > 0 ? logs[logs.length - 1].hash : ''
      
      // Create new event
      const event = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        sequence: logs.length + 1,
        previousHash,
        ...eventData,
        metadata: {
          userAgent: eventData.userAgent || 'Unknown',
          ipAddress: eventData.ipAddress || '127.0.0.1',
          sessionId: eventData.sessionId || 'demo-session',
          ...eventData.metadata
        }
      }
      
      // Generate hash for this event (excluding the hash field itself)
      const eventForHashing = { ...event }
      event.hash = this.generateHash(eventForHashing, previousHash)
      
      // Append to logs
      logs.push(event)
      
      // Write back to file
      fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2))
      
      console.log(`✅ Audit Event Logged: ${event.eventType} by ${event.userId}`)
      return event
      
    } catch (error) {
      console.error('❌ Audit logging failed:', error)
      throw error
    }
  }

  getLogs(filters = {}) {
    try {
      const data = fs.readFileSync(this.logPath, 'utf8')
      let logs = JSON.parse(data)
      
      // Apply filters
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId)
      }
      
      if (filters.documentId) {
        logs = logs.filter(log => log.documentId === filters.documentId)
      }
      
      if (filters.eventType) {
        logs = logs.filter(log => log.eventType === filters.eventType)
      }
      
      if (filters.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate))
      }
      
      if (filters.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate))
      }
      
      return logs.reverse() // Most recent first
      
    } catch (error) {
      console.error('❌ Failed to read audit logs:', error)
      return []
    }
  }

  verifyLogIntegrity() {
    try {
      // Get logs in original order (not reversed) for verification
      const data = fs.readFileSync(this.logPath, 'utf8')
      const logs = JSON.parse(data)
      let isValid = true
      const issues = []
      
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i]
        const previousHash = i > 0 ? logs[i - 1].hash : ''
        
        // Create a copy of the log without the hash for verification
        const logForHashing = { ...log }
        delete logForHashing.hash
        
        // Verify hash
        const expectedHash = this.generateHash(logForHashing, previousHash)
        if (log.hash !== expectedHash) {
          isValid = false
          issues.push({
            sequence: log.sequence,
            issue: 'Hash mismatch - possible tampering',
            expected: expectedHash,
            actual: log.hash
          })
        }
        
        // Verify sequence
        if (log.sequence !== i + 1) {
          isValid = false
          issues.push({
            sequence: log.sequence,
            issue: 'Sequence number mismatch',
            expected: i + 1,
            actual: log.sequence
          })
        }
      }
      
      return { isValid, issues, totalEvents: logs.length }
    } catch (error) {
      console.error('❌ Failed to verify log integrity:', error)
      return { isValid: false, issues: [{ sequence: 0, issue: 'Failed to read log file' }], totalEvents: 0 }
    }
  }

  getStatistics() {
    const logs = this.getLogs()
    const stats = {
      totalEvents: logs.length,
      eventTypes: {},
      users: {},
      documentsProcessed: new Set(),
      timeRange: {
        first: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
        last: logs.length > 0 ? logs[0].timestamp : null
      }
    }
    
    logs.forEach(log => {
      // Event types
      stats.eventTypes[log.eventType] = (stats.eventTypes[log.eventType] || 0) + 1
      
      // Users
      stats.users[log.userId] = (stats.users[log.userId] || 0) + 1
      
      // Documents
      if (log.documentId) {
        stats.documentsProcessed.add(log.documentId)
      }
    })
    
    stats.documentsProcessed = stats.documentsProcessed.size
    
    return stats
  }

  // Event logging helpers
  async logUploadStarted(userId, fileName, fileSize, sessionId) {
    return this.logEvent({
      eventType: 'upload_started',
      userId,
      action: 'Document upload initiated',
      details: {
        fileName,
        fileSize,
        fileSizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100
      },
      sessionId
    })
  }

  async logUploadCompleted(userId, documentId, fileName, sessionId) {
    return this.logEvent({
      eventType: 'upload_completed',
      userId,
      documentId,
      action: 'Document upload completed',
      details: {
        fileName,
        documentId
      },
      sessionId
    })
  }

  async logProfileSelected(userId, documentId, profileName, sessionId) {
    return this.logEvent({
      eventType: 'profile_selected',
      userId,
      documentId,
      action: 'Anonymization profile selected',
      details: {
        profileName
      },
      sessionId
    })
  }

  async logMaskingRequested(userId, documentId, profileName, sessionId) {
    return this.logEvent({
      eventType: 'masking_requested',
      userId,
      documentId,
      action: 'Document anonymization started',
      details: {
        profileName,
        status: 'processing'
      },
      sessionId
    })
  }

  async logMaskingSucceeded(userId, documentId, piiStats, sessionId) {
    return this.logEvent({
      eventType: 'masking_succeeded',
      userId,
      documentId,
      action: 'Document anonymization completed',
      details: {
        ...piiStats,
        status: 'completed'
      },
      sessionId
    })
  }

  async logItemOverridden(userId, documentId, itemType, action, itemDetails, sessionId) {
    return this.logEvent({
      eventType: 'item_overridden',
      userId,
      documentId,
      action: `PII item ${action}`,
      details: {
        itemType,
        overrideAction: action, // 'approved' or 'rejected'
        ...itemDetails
      },
      sessionId
    })
  }

  async logDownloadRequested(userId, documentId, downloadType, sessionId) {
    return this.logEvent({
      eventType: 'download_requested',
      userId,
      documentId,
      action: 'Document download initiated',
      details: {
        downloadType, // 'original' or 'anonymized'
        status: 'requested'
      },
      sessionId
    })
  }

  async logDownloadCompleted(userId, documentId, downloadType, fileSize, sessionId) {
    return this.logEvent({
      eventType: 'download_completed',
      userId,
      documentId,
      action: 'Document download completed',
      details: {
        downloadType,
        fileSizeBytes: fileSize,
        fileSizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100,
        status: 'completed'
      },
      sessionId
    })
  }

  async logPageVisited(userId, pageName, sessionId) {
    return this.logEvent({
      eventType: 'page_visited',
      userId,
      action: 'Page navigation',
      details: {
        pageName,
        url: pageName
      },
      sessionId
    })
  }

  async logSessionStarted(userId, userRole, sessionId) {
    return this.logEvent({
      eventType: 'session_started',
      userId,
      action: 'User session started',
      details: {
        userRole,
        loginTime: new Date().toISOString()
      },
      sessionId
    })
  }

  // Export functionality
  exportToCsv(filters = {}) {
    const logs = this.getLogs(filters)
    
    const headers = [
      'Timestamp',
      'User ID', 
      'Event Type',
      'Action',
      'Document ID',
      'Details',
      'Session ID',
      'Hash'
    ]
    
    const rows = logs.map(log => [
      log.timestamp,
      log.userId,
      log.eventType,
      log.action,
      log.documentId || '',
      JSON.stringify(log.details),
      log.sessionId,
      log.hash
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    return csvContent
  }
}

// Singleton instance
const auditService = new AuditService()

export default auditService 