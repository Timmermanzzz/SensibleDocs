import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'
import winston from 'winston'
import dotenv from 'dotenv-flow'
import auditService from './services/auditService.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Setup logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE || './tmp/demo/logs/app.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: winston.format.json()
    })
  ]
})

// Ensure log directory exists
try {
  await fs.mkdir('./tmp/demo/logs', { recursive: true })
} catch (error) {
  console.warn('Could not create log directory:', error.message)
}

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || true  // Allow all origins in production if not specified
    : 'http://localhost:3000',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: {
    error: 'Te veel verzoeken van dit IP adres, probeer het later opnieuw.'
  }
})
app.use('/api/', limiter)

// General middleware
app.use(compression())
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt').split(',')
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase()
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(new Error(`Bestandstype .${fileExtension} is niet toegestaan`))
    }
  }
})

// Mock AI service interaction
async function processWithAI(filePath, profile = 'default') {
  logger.info(`Processing file ${filePath} with profile ${profile}`)
  
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock AI response
  const mockPII = [
    {
      type: 'name',
      original: 'Jan van der Berg',
      masked: '[NAAM VERWIJDERD]',
      confidence: 0.98,
      position: { start: 45, end: 60, page: 1 }
    },
    {
      type: 'email',
      original: 'j.vandenberg@email.com',
      masked: '[EMAIL VERWIJDERD]',
      confidence: 0.99,
      position: { start: 120, end: 142, page: 1 }
    }
  ]
  
  return {
    piiItems: mockPII,
    processedAt: new Date(),
    confidence: 0.95,
    processingTime: 2000
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Sensible Docs API is actief',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

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

    // Bereid payload voor Private AI API (minimale structuur)
    const payload = {
      file: {
        data: fileData,
        content_type: contentType
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

// Document upload and processing
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Geen bestand geüpload'
      })
    }

    const { profile = 'default' } = req.body
    const documentId = Date.now().toString()
    
    logger.info(`Document uploaded: ${req.file.originalname} (${req.file.size} bytes)`)

    // Process with AI
    const aiResult = await processWithAI(req.file.path, profile)
    
    // Mock database save
    const document = {
      id: documentId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      profile,
      status: 'completed',
      ...aiResult
    }

    logger.info(`Document processed successfully: ${documentId}`)

    res.json({
      success: true,
      document
    })

  } catch (error) {
    logger.error('Upload error:', error)
    res.status(500).json({
      error: 'Fout bij het verwerken van het document',
      details: error.message
    })
  }
})

// Get document by ID
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Mock document retrieval
    const document = {
      id,
      originalName: 'WOO-verzoek-2024-001.pdf',
      status: 'completed',
      processedAt: new Date().toISOString(),
      piiItems: [
        {
          id: '1',
          type: 'name',
          original: 'Jan van der Berg',
          masked: '[NAAM VERWIJDERD]',
          confidence: 0.98,
          position: { start: 45, end: 60, page: 1 },
          approved: true
        }
      ]
    }

    res.json(document)
  } catch (error) {
    logger.error('Document retrieval error:', error)
    res.status(500).json({
      error: 'Fout bij het ophalen van het document'
    })
  }
})

// ==== AUDIT LOG API ENDPOINTS ====

// Get audit logs with filters
app.get('/api/audit', async (req, res) => {
  try {
    const { userId, documentId, eventType, startDate, endDate, userRole } = req.query
    
    // Check if user is admin (in real app, validate JWT token)
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Toegang geweigerd. Alleen beheerders kunnen audit logs bekijken.'
      })
    }
    
    const filters = {
      userId,
      documentId,
      eventType,
      startDate,
      endDate
    }
    
    const logs = auditService.getLogs(filters)
    const stats = auditService.getStatistics()
    const integrity = auditService.verifyLogIntegrity()
    
    res.json({
      logs,
      stats,
      integrity,
      filters: Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
    })
  } catch (error) {
    logger.error('Audit log retrieval error:', error)
    res.status(500).json({
      error: 'Fout bij het ophalen van de audit log'
    })
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

// Export audit logs to CSV
app.get('/api/audit/export', async (req, res) => {
  try {
    const { userId, documentId, eventType, startDate, endDate, userRole } = req.query
    
    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Toegang geweigerd. Alleen beheerders kunnen audit logs exporteren.'
      })
    }
    
    const filters = { userId, documentId, eventType, startDate, endDate }
    const csvContent = auditService.exportToCsv(filters)
    
    const filename = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csvContent)
    
  } catch (error) {
    logger.error('Audit export error:', error)
    res.status(500).json({
      error: 'Fout bij het exporteren van audit log'
    })
  }
})

// Verify audit log integrity
app.get('/api/audit/verify', async (req, res) => {
  try {
    const { userRole } = req.query
    
    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Toegang geweigerd. Alleen beheerders kunnen log integriteit verifiëren.'
      })
    }
    
    const verification = auditService.verifyLogIntegrity()
    
    res.json({
      verification,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Audit verification error:', error)
    res.status(500).json({
      error: 'Fout bij het verifiëren van log integriteit'
    })
  }
})

// ==== ENHANCED DOCUMENT ENDPOINTS WITH AUDIT LOGGING ====

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const { period = 'month' } = req.query
    
    // Mock analytics data
    const analytics = {
      totalDocuments: 1247,
      processedSuccessfully: 1189,
      avgProcessingTime: 3.2,
      piiItemsFound: 15637,
      period
    }

    res.json(analytics)
  } catch (error) {
    logger.error('Analytics error:', error)
    res.status(500).json({
      error: 'Fout bij het ophalen van analytics'
    })
  }
})

// ==== PROFILE MANAGEMENT API ENDPOINTS ====

// Get all profiles
app.get('/api/profiles', async (req, res) => {
  try {
    // Mock profiles data - in real app, fetch from database
    const profiles = [
      {
        id: '1',
        name: 'Standaard WOO-profiel',
        description: 'Detecteert alle standaard PII volgens WOO-wetgeving',
        isDefault: true,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-15T10:30:00Z',
        piiCategories: [
          { id: 'names', enabled: true, sensitivity: 'high' },
          { id: 'emails', enabled: true, sensitivity: 'high' },
          { id: 'phones', enabled: true, sensitivity: 'medium' },
          { id: 'addresses', enabled: true, sensitivity: 'medium' },
          { id: 'financial', enabled: true, sensitivity: 'high' },
          { id: 'ids', enabled: true, sensitivity: 'high' }
        ],
        settings: {
          confidenceThreshold: 0.8,
          maskingStyle: 'redact',
          preserveStructure: true,
          logDetections: true
        }
      },
      {
        id: '2',
        name: 'Strict profiel',
        description: 'Extra voorzichtig, detecteert ook potentieel gevoelige informatie',
        isDefault: false,
        isActive: true,
        createdAt: '2024-01-05T00:00:00Z',
        lastModified: '2024-01-16T14:20:00Z',
        piiCategories: [
          { id: 'names', enabled: true, sensitivity: 'high' },
          { id: 'emails', enabled: true, sensitivity: 'high' },
          { id: 'phones', enabled: true, sensitivity: 'medium' },
          { id: 'addresses', enabled: true, sensitivity: 'medium' },
          { id: 'financial', enabled: true, sensitivity: 'high' },
          { id: 'dates', enabled: true, sensitivity: 'low' },
          { id: 'ids', enabled: true, sensitivity: 'high' },
          { id: 'organizations', enabled: true, sensitivity: 'low' },
          { id: 'websites', enabled: true, sensitivity: 'low' }
        ],
        settings: {
          confidenceThreshold: 0.6,
          maskingStyle: 'replace',
          preserveStructure: true,
          logDetections: true
        }
      }
    ]

    logger.info(`Retrieved ${profiles.length} anonymization profiles`)
    res.json(profiles)
  } catch (error) {
    logger.error('Profile retrieval error:', error)
    res.status(500).json({
      error: 'Fout bij het ophalen van profielen'
    })
  }
})

// Create new profile
app.post('/api/profiles', async (req, res) => {
  try {
    const { name, description, piiCategories, settings, userId } = req.body
    
    if (!name || !description) {
      return res.status(400).json({
        error: 'Naam en beschrijving zijn verplicht'
      })
    }

    const profile = {
      id: Date.now().toString(),
      name,
      description,
      isDefault: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      piiCategories: piiCategories || [],
      settings: settings || {
        confidenceThreshold: 0.8,
        maskingStyle: 'redact',
        preserveStructure: true,
        logDetections: true
      }
    }

    // Log the profile creation
    await auditService.logEvent({
      eventType: 'profile_created',
      userId: userId || 'system',
      action: 'New anonymization profile created',
      details: { 
        profileName: profile.name, 
        profileId: profile.id,
        categoriesEnabled: piiCategories?.filter(cat => cat.enabled).length || 0
      }
    })

    logger.info(`Profile created: ${profile.name} (ID: ${profile.id})`)
    res.status(201).json(profile)
  } catch (error) {
    logger.error('Profile creation error:', error)
    res.status(500).json({
      error: 'Fout bij het aanmaken van profiel'
    })
  }
})

// Update existing profile
app.put('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, isActive, piiCategories, settings, userId } = req.body
    
    // Mock profile update - in real app, update in database
    const updatedProfile = {
      id,
      name,
      description,
      isActive,
      piiCategories,
      settings,
      lastModified: new Date().toISOString()
    }

    // Log the profile update
    await auditService.logEvent({
      eventType: 'profile_updated',
      userId: userId || 'system',
      action: 'Anonymization profile configuration updated',
      details: { 
        profileName: name, 
        profileId: id,
        categoriesEnabled: piiCategories?.filter(cat => cat.enabled).length || 0,
        confidenceThreshold: settings?.confidenceThreshold
      }
    })

    logger.info(`Profile updated: ${name} (ID: ${id})`)
    res.json(updatedProfile)
  } catch (error) {
    logger.error('Profile update error:', error)
    res.status(500).json({
      error: 'Fout bij het bijwerken van profiel'
    })
  }
})

// Delete profile
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId, profileName } = req.query
    
    // Check if it's the default profile
    if (id === '1') {
      return res.status(400).json({
        error: 'Standaardprofiel kan niet worden verwijderd'
      })
    }

    // Log the profile deletion
    await auditService.logEvent({
      eventType: 'profile_deleted',
      userId: userId || 'system',
      action: 'Anonymization profile deleted',
      details: { 
        profileName: profileName || 'Unknown', 
        profileId: id
      }
    })

    logger.info(`Profile deleted: ${profileName} (ID: ${id})`)
    res.json({ success: true, message: 'Profiel verwijderd' })
  } catch (error) {
    logger.error('Profile deletion error:', error)
    res.status(500).json({
      error: 'Fout bij het verwijderen van profiel'
    })
  }
})

// Set default profile
app.post('/api/profiles/:id/set-default', async (req, res) => {
  try {
    const { id } = req.params
    const { userId, profileName } = req.body
    
    // Mock setting default profile
    await auditService.logEvent({
      eventType: 'profile_default_changed',
      userId: userId || 'system',
      action: 'Default anonymization profile changed',
      details: { 
        profileName: profileName || 'Unknown', 
        profileId: id
      }
    })

    logger.info(`Default profile changed to: ${profileName} (ID: ${id})`)
    res.json({ success: true, message: 'Standaardprofiel ingesteld' })
  } catch (error) {
    logger.error('Set default profile error:', error)
    res.status(500).json({
      error: 'Fout bij het instellen van standaardprofiel'
    })
  }
})

// Duplicate profile
app.post('/api/profiles/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params
    const { userId, originalProfileName } = req.body
    
    // Mock profile duplication
    const duplicatedProfile = {
      id: Date.now().toString(),
      name: `${originalProfileName} (kopie)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    await auditService.logEvent({
      eventType: 'profile_duplicated',
      userId: userId || 'system',
      action: 'Anonymization profile duplicated',
      details: { 
        originalProfile: originalProfileName, 
        newProfile: duplicatedProfile.name,
        newProfileId: duplicatedProfile.id
      }
    })

    logger.info(`Profile duplicated: ${originalProfileName} -> ${duplicatedProfile.name}`)
    res.status(201).json(duplicatedProfile)
  } catch (error) {
    logger.error('Profile duplication error:', error)
    res.status(500).json({
      error: 'Fout bij het dupliceren van profiel'
    })
  }
})

// ==== END PROFILE MANAGEMENT API ENDPOINTS ====

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error)
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Bestand is te groot (max 50MB)'
      })
    }
  }
  
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

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(`🚀 Sensible Docs API server draait op poort ${PORT}`)
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`)
  })
}

// Export for Vercel serverless functions (ES module syntax)
export default app 