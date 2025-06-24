import crypto from 'crypto'
import winston from 'winston'

// In-memory storage for demo - in production you'd use a database
let auditEvents = []
let lastHash = null

// Simple persistent storage simulation for Vercel
class VercelAuditStorage {
  constructor() {
    this.events = []
    this.lastHash = null
    this.isVercelEnv = process.env.VERCEL_ENV === '1'
  }

  async getEvents() {
    if (this.isVercelEnv) {
      // In Vercel, try to load from a simple JSON storage
      // This is a demo implementation - in production use proper database
      return this.events
    }
    return auditEvents
  }

  async addEvent(event) {
    if (this.isVercelEnv) {
      this.events.push(event)
      // Keep only last 1000 events in memory for demo
      if (this.events.length > 1000) {
        this.events = this.events.slice(-1000)
      }
    } else {
      auditEvents.push(event)
    }
  }

  async getLastHash() {
    if (this.isVercelEnv) {
      return this.lastHash
    }
    return lastHash
  }

  async setLastHash(hash) {
    if (this.isVercelEnv) {
      this.lastHash = hash
    } else {
      lastHash = hash
    }
  }

  async getStats() {
    const events = await this.getEvents()
    const eventTypes = {}
    const users = {}
    let documentsProcessed = 0

    events.forEach(event => {
      // Count event types
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1
      
      // Count unique users
      users[event.userId] = (users[event.userId] || 0) + 1
      
      // Count document processing events
      if (event.eventType.includes('upload_completed') || event.eventType.includes('masking_succeeded')) {
        documentsProcessed++
      }
    })

    return {
      totalEvents: events.length,
      eventTypes,
      users,
      documentsProcessed,
      timeRange: {
        first: events.length > 0 ? events[0].timestamp : null,
        last: events.length > 0 ? events[events.length - 1].timestamp : null
      }
    }
  }
}

const storage = new VercelAuditStorage()

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Add file transport only in non-Vercel environments
if (!process.env.VERCEL_ENV) {
  logger.add(new winston.transports.File({ 
    filename: 'tmp/audit.log',
    maxsize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    tailable: true
  }))
}

function generateHash(data, previousHash = '') {
  const content = previousHash + JSON.stringify(data) + Date.now()
  return crypto.createHash('sha256').update(content).digest('hex')
}

async function logEvent(eventData) {
  try {
    const events = await storage.getEvents()
    const lastEventHash = await storage.getLastHash()
    
    const sequence = events.length + 1
    const hash = generateHash(eventData, lastEventHash)
    
    const auditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sequence,
      eventType: eventData.eventType,
      action: eventData.action,
      userId: eventData.userId,
      documentId: eventData.documentId || null,
      details: eventData.details || {},
      sessionId: eventData.sessionId || 'unknown',
      hash,
      previousHash: lastEventHash || '',
      metadata: {
        userAgent: eventData.userAgent || 'unknown',
        ipAddress: eventData.ipAddress || 'unknown'
      }
    }

    await storage.addEvent(auditEvent)
    await storage.setLastHash(hash)
    
    logger.info(`✅ Audit Event Logged: ${eventData.eventType} by ${eventData.userId}`)
    
    return auditEvent
  } catch (error) {
    logger.error('❌ Audit logging failed:', error)
    throw error
  }
}

async function getAuditLog(filters = {}) {
  try {
    let events = await storage.getEvents()
    
    // Apply filters
    if (filters.userId) {
      events = events.filter(event => event.userId.includes(filters.userId))
    }
    
    if (filters.eventType) {
      events = events.filter(event => event.eventType === filters.eventType)
    }
    
    if (filters.documentId) {
      events = events.filter(event => event.documentId === filters.documentId)
    }
    
    if (filters.startDate) {
      events = events.filter(event => new Date(event.timestamp) >= new Date(filters.startDate))
    }
    
    if (filters.endDate) {
      events = events.filter(event => new Date(event.timestamp) <= new Date(filters.endDate))
    }
    
    // Sort by sequence number (newest first)
    events.sort((a, b) => b.sequence - a.sequence)
    
    const stats = await storage.getStats()
    
    return {
      logs: events,
      stats
    }
  } catch (error) {
    logger.error('❌ Failed to retrieve audit log:', error)
    throw error
  }
}

async function verifyIntegrity() {
  try {
    const events = await storage.getEvents()
    const issues = []
    
    for (let i = 1; i < events.length; i++) {
      const current = events[i]
      const previous = events[i - 1]
      
      // Check sequence continuity
      if (current.sequence !== previous.sequence + 1) {
        issues.push({
          sequence: current.sequence,
          issue: 'Sequence gap detected',
          expected: previous.sequence + 1,
          actual: current.sequence
        })
      }
      
      // Check hash chain
      if (current.previousHash !== previous.hash) {
        issues.push({
          sequence: current.sequence,
          issue: 'Hash chain broken',
          expected: previous.hash,
          actual: current.previousHash
        })
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      totalEvents: events.length
    }
  } catch (error) {
    logger.error('❌ Integrity verification failed:', error)
    throw error
  }
}

// Export audit log as CSV
async function exportAuditLog(filters = {}) {
  try {
    const { logs } = await getAuditLog(filters)
    
    const headers = [
      'Timestamp',
      'Sequence',
      'Event Type',
      'Action',
      'User ID',
      'Document ID',
      'Details',
      'Session ID',
      'Hash',
      'IP Address',
      'User Agent'
    ]
    
    const csvRows = [
      headers.join(','),
      ...logs.map(event => [
        event.timestamp,
        event.sequence,
        event.eventType,
        `"${event.action}"`,
        event.userId,
        event.documentId || '',
        `"${JSON.stringify(event.details).replace(/"/g, '""')}"`,
        event.sessionId,
        event.hash,
        event.metadata.ipAddress,
        `"${event.metadata.userAgent}"`
      ].join(','))
    ]
    
    return csvRows.join('\n')
  } catch (error) {
    logger.error('❌ Export failed:', error)
    throw error
  }
}

// Initialize with some demo data for Vercel
async function initializeDemoData() {
  const events = await storage.getEvents()
  if (events.length === 0) {
    // Add some initial demo events
    const demoEvents = [
      {
        eventType: 'session_started',
        action: 'User session started',
        userId: 'user-admin-1',
        sessionId: 'demo-session-1',
        userAgent: 'Demo Browser',
        ipAddress: '127.0.0.1'
      },
      {
        eventType: 'page_visited',
        action: 'Navigated to Dashboard',
        userId: 'user-admin-1',
        sessionId: 'demo-session-1',
        details: { pageName: 'Dashboard' },
        userAgent: 'Demo Browser',
        ipAddress: '127.0.0.1'
      }
    ]
    
    for (const event of demoEvents) {
      await logEvent(event)
    }
  }
}

// Initialize demo data on import
if (process.env.VERCEL_ENV) {
  initializeDemoData().catch(console.error)
}

export default {
  logEvent,
  getAuditLog,
  verifyIntegrity,
  exportAuditLog,
  logger
} 