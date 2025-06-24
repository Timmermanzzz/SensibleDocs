import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import winston from 'winston'

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

class SupabaseAuditService {
  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('⚠️ Supabase credentials not found, falling back to in-memory storage')
      this.supabase = null
      this.events = []
      this.lastHash = null
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey)
      logger.info('✅ Supabase audit service initialized')
    }
  }

  generateHash(data, previousHash = '') {
    const content = previousHash + JSON.stringify(data) + Date.now()
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  async logEvent(eventData) {
    try {
      // Get last hash for chain integrity
      const lastEventHash = await this.getLastHash()
      const sequence = await this.getNextSequence()
      const hash = this.generateHash(eventData, lastEventHash)
      
      const auditEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        sequence,
        event_type: eventData.eventType,
        action: eventData.action,
        user_id: eventData.userId,
        document_id: eventData.documentId || null,
        details: eventData.details || {},
        session_id: eventData.sessionId || 'unknown',
        hash,
        previous_hash: lastEventHash || '',
        user_agent: eventData.userAgent || 'unknown',
        ip_address: eventData.ipAddress || 'unknown'
      }

      if (this.supabase) {
        // Store in Supabase
        const { data, error } = await this.supabase
          .from('audit_events')
          .insert([auditEvent])
          .select()
        
        if (error) {
          logger.error('❌ Supabase insert failed:', error)
          throw error
        }
        
        logger.info(`✅ Audit Event Logged to Supabase: ${eventData.eventType} by ${eventData.userId}`)
        return data[0]
      } else {
        // Fallback to in-memory
        this.events.push(auditEvent)
        this.lastHash = hash
        
        if (this.events.length > 1000) {
          this.events = this.events.slice(-1000)
        }
        
        logger.info(`✅ Audit Event Logged (in-memory): ${eventData.eventType} by ${eventData.userId}`)
        return auditEvent
      }
    } catch (error) {
      logger.error('❌ Audit logging failed:', error)
      throw error
    }
  }

  async getAuditLog(filters = {}) {
    try {
      let events = []
      
      if (this.supabase) {
        // Query from Supabase
        let query = this.supabase
          .from('audit_events')
          .select('*')
          .order('sequence', { ascending: false })
        
        // Apply filters
        if (filters.userId) {
          query = query.ilike('user_id', `%${filters.userId}%`)
        }
        
        if (filters.eventType) {
          query = query.eq('event_type', filters.eventType)
        }
        
        if (filters.documentId) {
          query = query.eq('document_id', filters.documentId)
        }
        
        if (filters.startDate) {
          query = query.gte('timestamp', filters.startDate)
        }
        
        if (filters.endDate) {
          query = query.lte('timestamp', filters.endDate)
        }
        
        const { data, error } = await query.limit(1000)
        
        if (error) {
          logger.error('❌ Supabase query failed:', error)
          throw error
        }
        
        events = data || []
      } else {
        // Fallback to in-memory
        events = [...this.events]
        
        if (filters.userId) {
          events = events.filter(event => event.user_id.includes(filters.userId))
        }
        
        if (filters.eventType) {
          events = events.filter(event => event.event_type === filters.eventType)
        }
        
        if (filters.documentId) {
          events = events.filter(event => event.document_id === filters.documentId)
        }
        
        if (filters.startDate) {
          events = events.filter(event => new Date(event.timestamp) >= new Date(filters.startDate))
        }
        
        if (filters.endDate) {
          events = events.filter(event => new Date(event.timestamp) <= new Date(filters.endDate))
        }
        
        events.sort((a, b) => b.sequence - a.sequence)
      }
      
      const stats = await this.getStats(events)
      
      return {
        logs: events,
        stats
      }
    } catch (error) {
      logger.error('❌ Failed to retrieve audit log:', error)
      throw error
    }
  }

  async getStats(events = null) {
    try {
      if (!events) {
        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('audit_events')
            .select('event_type, user_id, timestamp')
          
          if (error) throw error
          events = data || []
        } else {
          events = this.events
        }
      }
      
      const eventTypes = {}
      const users = {}
      let documentsProcessed = 0

      events.forEach(event => {
        const eventType = event.event_type || event.eventType
        const userId = event.user_id || event.userId
        
        eventTypes[eventType] = (eventTypes[eventType] || 0) + 1
        users[userId] = (users[userId] || 0) + 1
        
        if (eventType && (eventType.includes('upload_completed') || eventType.includes('masking_succeeded'))) {
          documentsProcessed++
        }
      })

      return {
        totalEvents: events.length,
        eventTypes,
        users,
        documentsProcessed,
        timeRange: {
          first: events.length > 0 ? events[events.length - 1].timestamp : null,
          last: events.length > 0 ? events[0].timestamp : null
        }
      }
    } catch (error) {
      logger.error('❌ Failed to get stats:', error)
      return {
        totalEvents: 0,
        eventTypes: {},
        users: {},
        documentsProcessed: 0,
        timeRange: { first: null, last: null }
      }
    }
  }

  async verifyIntegrity() {
    try {
      let events = []
      
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('audit_events')
          .select('sequence, hash, previous_hash')
          .order('sequence', { ascending: true })
        
        if (error) throw error
        events = data || []
      } else {
        events = [...this.events].sort((a, b) => a.sequence - b.sequence)
      }
      
      const issues = []
      
      for (let i = 1; i < events.length; i++) {
        const current = events[i]
        const previous = events[i - 1]
        
        if (current.sequence !== previous.sequence + 1) {
          issues.push({
            sequence: current.sequence,
            issue: 'Sequence gap detected',
            expected: previous.sequence + 1,
            actual: current.sequence
          })
        }
        
        if (current.previous_hash !== previous.hash) {
          issues.push({
            sequence: current.sequence,
            issue: 'Hash chain broken',
            expected: previous.hash,
            actual: current.previous_hash
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

  async exportAuditLog(filters = {}) {
    try {
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
          event.event_type || event.eventType,
          `"${event.action}"`,
          event.user_id || event.userId,
          event.document_id || event.documentId || '',
          `"${JSON.stringify(event.details).replace(/"/g, '""')}"`,
          event.session_id || event.sessionId,
          event.hash,
          event.ip_address || event.ipAddress,
          `"${event.user_agent || event.userAgent}"`
        ].join(','))
      ]
      
      return csvRows.join('\n')
    } catch (error) {
      logger.error('❌ Export failed:', error)
      throw error
    }
  }

  async getLastHash() {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('audit_events')
          .select('hash')
          .order('sequence', { ascending: false })
          .limit(1)
        
        if (error) throw error
        return data && data.length > 0 ? data[0].hash : null
      } else {
        return this.lastHash
      }
    } catch (error) {
      logger.error('❌ Failed to get last hash:', error)
      return null
    }
  }

  async getNextSequence() {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('audit_events')
          .select('sequence')
          .order('sequence', { ascending: false })
          .limit(1)
        
        if (error) throw error
        return data && data.length > 0 ? data[0].sequence + 1 : 1
      } else {
        return this.events.length + 1
      }
    } catch (error) {
      logger.error('❌ Failed to get next sequence:', error)
      return 1
    }
  }

  async initializeDemoData() {
    try {
      // Check if we have any events
      const count = await this.getEventCount()
      
      if (count === 0) {
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
          await this.logEvent(event)
        }
        
        logger.info('✅ Demo data initialized')
      }
    } catch (error) {
      logger.warn('⚠️ Could not initialize demo data:', error.message)
    }
  }

  async getEventCount() {
    try {
      if (this.supabase) {
        const { count, error } = await this.supabase
          .from('audit_events')
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        return count || 0
      } else {
        return this.events.length
      }
    } catch (error) {
      return 0
    }
  }
}

// Create singleton instance
const auditService = new SupabaseAuditService()

// Initialize demo data
auditService.initializeDemoData().catch(console.error)

export default auditService 