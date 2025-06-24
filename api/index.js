// Vercel serverless function wrapper (ES module syntax)
import express from 'express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import winston from 'winston'

// Initialize Express app
const app = express()

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
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

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  }
}))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://sensible-docs-so31.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

app.use(cors(corsOptions))
app.use(compression())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Te veel verzoeken, probeer het later opnieuw'
  }
})
app.use('/api/', limiter)

// Enhanced Audit service for Vercel
class VercelAuditService {
  constructor() {
    this.events = []
    this.lastHash = null
    // Initialize with some demo data
    this.initializeDemoData()
  }

  generateHash(data, previousHash = '') {
    const crypto = require('crypto')
    const content = previousHash + JSON.stringify(data) + Date.now()
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  async logEvent(eventData) {
    const sequence = this.events.length + 1
    const hash = this.generateHash(eventData, this.lastHash)
    
    const event = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      sequence,
      eventType: eventData.eventType,
      action: eventData.action,
      userId: eventData.userId,
      documentId: eventData.documentId || null,
      details: eventData.details || {},
      sessionId: eventData.sessionId || 'unknown',
      hash,
      previousHash: this.lastHash || '',
      metadata: {
        userAgent: eventData.userAgent || 'unknown',
        ipAddress: eventData.ipAddress || 'unknown'
      }
    }
    
    this.events.push(event)
    this.lastHash = hash
    
    // Keep only last 1000 events for demo
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
    
    logger.info(`✅ Audit Event Logged: ${event.eventType} by ${event.userId}`)
    return event
  }

  async getAuditLog(filters = {}) {
    let filteredEvents = [...this.events]
    
    if (filters.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId.includes(filters.userId))
    }
    
    if (filters.eventType) {
      filteredEvents = filteredEvents.filter(event => event.eventType === filters.eventType)
    }
    
    if (filters.documentId) {
      filteredEvents = filteredEvents.filter(event => event.documentId === filters.documentId)
    }
    
    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) >= new Date(filters.startDate)
      )
    }
    
    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) <= new Date(filters.endDate)
      )
    }
    
    // Sort by sequence (newest first)
    filteredEvents.sort((a, b) => b.sequence - a.sequence)
    
    const stats = this.getStats()
    
    return {
      logs: filteredEvents,
      stats
    }
  }

  getStats() {
    const eventTypes = {}
    const users = {}
    let documentsProcessed = 0

    this.events.forEach(event => {
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1
      users[event.userId] = (users[event.userId] || 0) + 1
      
      if (event.eventType.includes('upload_completed') || event.eventType.includes('masking_succeeded')) {
        documentsProcessed++
      }
    })

    return {
      totalEvents: this.events.length,
      eventTypes,
      users,
      documentsProcessed,
      timeRange: {
        first: this.events.length > 0 ? this.events[0].timestamp : null,
        last: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null
      }
    }
  }

  async verifyIntegrity() {
    const issues = []
    
    for (let i = 1; i < this.events.length; i++) {
      const current = this.events[i]
      const previous = this.events[i - 1]
      
      if (current.sequence !== previous.sequence + 1) {
        issues.push({
          sequence: current.sequence,
          issue: 'Sequence gap detected',
          expected: previous.sequence + 1,
          actual: current.sequence
        })
      }
      
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
      totalEvents: this.events.length
    }
  }

  async exportAuditLog(filters = {}) {
    const { logs } = await this.getAuditLog(filters)
    
    const headers = [
      'Timestamp', 'Sequence', 'Event Type', 'Action', 'User ID', 
      'Document ID', 'Details', 'Session ID', 'Hash', 'IP Address', 'User Agent'
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
  }

  initializeDemoData() {
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
    
    demoEvents.forEach(event => {
      this.logEvent(event).catch(console.error)
    })
  }
}

const auditService = new VercelAuditService()

// Mock data
const mockProjects = [
  {
    id: '1',
    name: 'WOO-verzoek Bestemmingsplan Centrum',
    description: 'Verzoek om alle documenten betreffende het bestemmingsplan voor het centrum van de gemeente.',
    status: 'in_progress',
    progress: 65,
    requester: {
      name: 'Jan van der Berg',
      email: 'j.vandenberg@gemeente.nl',
      organization: 'Gemeente Voorbeeld'
    },
    department: 'Ruimtelijke Ordening',
    deadline: '2024-02-15',
    createdAt: '2024-01-15T10:00:00Z',
    tags: ['bestemmingsplan', 'centrum', 'ruimtelijke ordening'],
    documentsCount: 24,
    processedCount: 16,
    piiItemsFound: 89
  },
  {
    id: '2',
    name: 'Subsidieaanvraag Sportvereniging',
    description: 'Documenten over subsidieverstrekking aan lokale sportverenigingen in 2023.',
    status: 'completed',
    progress: 100,
    requester: {
      name: 'Maria Janssen',
      email: 'm.janssen@sportvereniging.nl',
      organization: 'Sportvereniging De Eendracht'
    },
    department: 'Sport & Recreatie',
    deadline: '2024-01-20',
    createdAt: '2024-01-08T14:30:00Z',
    tags: ['subsidie', 'sport', 'vereniging'],
    documentsCount: 12,
    processedCount: 12,
    piiItemsFound: 34
  },
  {
    id: '3',
    name: 'Vergunningaanvraag Evenement',
    description: 'Alle correspondentie en besluiten over de vergunningaanvraag voor het jaarlijkse straatfestival.',
    status: 'pending',
    progress: 0,
    requester: {
      name: 'Peter de Vries',
      email: 'p.devries@evenementen.nl',
      organization: 'Stichting Straatfestival'
    },
    department: 'Vergunningen',
    deadline: '2024-03-01',
    createdAt: '2024-01-20T09:15:00Z',
    tags: ['evenement', 'vergunning', 'festival'],
    documentsCount: 8,
    processedCount: 0,
    piiItemsFound: 0
  }
]

// API Routes

// Private AI Document Anonymization
app.post('/api/anonymize-document', async (req, res) => {
  try {
    const { fileData, contentType, options = {} } = req.body

    // Validatie
    if (!fileData || !contentType) {
      return res.status(400).json({ 
        error: 'fileData en contentType zijn verplicht' 
      })
    }

    // Bereid payload voor Private AI API
    const payload = {
      file: {
        data: fileData,
        content_type: contentType
      },
      processing_options: {
        entity_detection: {
          accuracy: options.accuracy || 'standard',
          return_entity: true
        },
        redaction: {
          redaction_type: options.redactionType || 'marker',
          redact_with: options.redactWith || '[GEANONIMISEERD]'
        }
      }
    }

    logger.info(`📄 Processing document anonymization: ${contentType}`)
    const startTime = Date.now()

    // Call Private AI API
    const privateAIResponse = await fetch('https://api.private-ai.com/community/v4/process/files/base64', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '57271f9a4cdf47ada3b3848942be0fd9'
      },
      body: JSON.stringify(payload)
    })

    const processingTime = Date.now() - startTime

    if (!privateAIResponse.ok) {
      const errorText = await privateAIResponse.text()
      logger.error(`❌ Private AI Error: ${privateAIResponse.status} - ${errorText}`)
      return res.status(500).json({ 
        error: `Private AI service error: ${errorText}` 
      })
    }

    const result = await privateAIResponse.json()
    
    logger.info(`✅ Document anonymization completed in ${processingTime}ms`)
    logger.info(`📊 Found ${result.entities?.length || 0} PII entities`)

    // Return result
    res.json({
      success: true,
      processed_file: result.processed_file,
      entities: result.entities || [],
      processing_time: processingTime,
      stats: {
        entities_found: result.entities?.length || 0,
        api_processing_time: result.processing_time
      }
    })

  } catch (error) {
    logger.error('❌ Document anonymization error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Audit logging endpoint
app.post('/api/audit/log', async (req, res) => {
  try {
    const { eventType, userId, action, details } = req.body
    
    const event = await auditService.logEvent({
      eventType,
      userId,
      action,
      details,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })
    
    res.json(event)
  } catch (error) {
    logger.error('Audit logging error:', error)
    res.status(500).json({ error: 'Fout bij het loggen van audit event' })
  }
})

// Get audit logs (enhanced for admin interface)
app.get('/api/audit', async (req, res) => {
  try {
    const { userId, eventType, documentId, startDate, endDate, userRole } = req.query
    
    // Only admins can view audit logs
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Alleen beheerders kunnen audit logs bekijken'
      })
    }
    
    const filters = { userId, eventType, documentId, startDate, endDate }
    const auditData = await auditService.getAuditLog(filters)
    const integrity = await auditService.verifyIntegrity()
    
    res.json({
      logs: auditData.logs,
      stats: auditData.stats,
      integrity,
      filters: Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
    })
  } catch (error) {
    logger.error('Get audit logs error:', error)
    res.status(500).json({ error: 'Fout bij het ophalen van audit logs' })
  }
})

// Log new audit event
app.post('/api/audit/log', async (req, res) => {
  try {
    const { eventType, userId, action, documentId, details, sessionId } = req.body
    
    const event = await auditService.logEvent({
      eventType,
      userId,
      action,
      documentId,
      details,
      sessionId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    })
    
    res.json({
      success: true,
      event
    })
  } catch (error) {
    logger.error('Audit logging error:', error)
    res.status(500).json({
      error: 'Fout bij het loggen van audit event'
    })
  }
})

// Audit export endpoint
app.get('/api/audit/export', async (req, res) => {
  try {
    const { userId, eventType, documentId, startDate, endDate, userRole } = req.query
    
    // Only admins can export audit logs
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Alleen beheerders kunnen audit logs exporteren'
      })
    }
    
    const filters = { userId, eventType, documentId, startDate, endDate }
    const csvContent = await auditService.exportAuditLog(filters)
    
    const filename = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csvContent)
  } catch (error) {
    logger.error('Audit export error:', error)
    res.status(500).json({ error: 'Fout bij het exporteren van audit log' })
  }
})

// Audit verify endpoint
app.get('/api/audit/verify', async (req, res) => {
  try {
    const { userRole } = req.query
    
    // Only admins can verify audit logs
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Alleen beheerders kunnen log integriteit verifiëren'
      })
    }
    
    const verification = await auditService.verifyIntegrity()
    
    res.json({
      verification,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Audit verify error:', error)
    res.status(500).json({ error: 'Fout bij het verifiëren van log integriteit' })
  }
})

// Projects endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const { userId } = req.query
    
    await auditService.logEvent({
      eventType: 'projects_viewed',
      userId: userId || 'anonymous',
      action: 'Projects list accessed',
      details: { projectCount: mockProjects.length }
    })
    
    res.json(mockProjects)
  } catch (error) {
    logger.error('Get projects error:', error)
    res.status(500).json({ error: 'Fout bij het ophalen van projecten' })
  }
})

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId } = req.query
    
    const project = mockProjects.find(p => p.id === id)
    
    if (!project) {
      return res.status(404).json({ error: 'Project niet gevonden' })
    }
    
    await auditService.logEvent({
      eventType: 'project_viewed',
      userId: userId || 'anonymous',
      action: 'Project details accessed',
      details: { projectId: id, projectName: project.name }
    })
    
    res.json(project)
  } catch (error) {
    logger.error('Get project error:', error)
    res.status(500).json({ error: 'Fout bij het ophalen van project' })
  }
})

// Mock Keycloak authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    // Mock users database
    const users = {
      'admin': { password: 'admin123', role: 'admin', name: 'Administrator', email: 'admin@gemeente.nl' },
      'woo.officer': { password: 'woo123', role: 'woo_officer', name: 'WOO Officer', email: 'woo@gemeente.nl' },
      'clerk': { password: 'clerk123', role: 'clerk', name: 'Clerk', email: 'clerk@gemeente.nl' },
      'viewer': { password: 'viewer123', role: 'viewer', name: 'Viewer', email: 'viewer@gemeente.nl' }
    }
    
    const user = users[username]
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Ongeldige gebruikersnaam of wachtwoord' })
    }
    
    // Mock JWT token
    const token = `mock-jwt-${username}-${Date.now()}`
    
    await auditService.logEvent({
      eventType: 'user_login',
      userId: username,
      action: 'User logged in via SSO',
      details: { role: user.role, loginMethod: 'keycloak' }
    })
    
    res.json({
      token,
      user: {
        id: username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ error: 'Fout bij inloggen' })
  }
})

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { userId } = req.body
    
    await auditService.logEvent({
      eventType: 'user_logout',
      userId: userId || 'unknown',
      action: 'User logged out',
      details: { logoutMethod: 'keycloak' }
    })
    
    res.json({ success: true })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({ error: 'Fout bij uitloggen' })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error)
  
  res.status(500).json({
    error: 'Interne serverfout',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Er is iets misgegaan'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Eindpunt niet gevonden'
  })
})

// Export for Vercel
export default app 