# 🚀 Sensible Docs - Vercel Deployment

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/sensible-docs)

## Manual Deployment Steps

### 1. Prerequisites
- GitHub account
- Vercel account (free tier is sufficient)
- Git repository met deze code

### 2. Setup Repository
```bash
# Push naar GitHub
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 3. Deploy via Vercel Dashboard
1. Ga naar [vercel.com](https://vercel.com)
2. Log in met GitHub
3. Klik "New Project"
4. Selecteer je repository
5. Vercel detecteert automatisch de configuratie
6. Klik "Deploy"

### 4. Environment Variables (optioneel)
In Vercel dashboard → Settings → Environment Variables:
```
NODE_ENV=production
CORS_ORIGIN=https://jouw-app.vercel.app
```

## ✅ Features die werken op Vercel:
- ✅ Frontend (React + Vite)
- ✅ Backend API (Express als serverless functions)
- ✅ Keycloak Mock SSO
- ✅ Audit logging (in-memory)
- ✅ File uploads (temporary)
- ✅ PDF processing (mock)

## ⚠️ Beperkingen Vercel Free Tier:
- Serverless functions timeout na 10 seconden
- Geen persistent file storage
- Geen database (we gebruiken in-memory)
- Audit logs worden niet bewaard tussen requests

## 🎯 Perfect voor:
- ✅ Demo's en presentaties
- ✅ Stakeholder reviews
- ✅ User acceptance testing
- ✅ Prototype validatie

## 📱 Toegang voor collega's:
Na deployment krijg je een URL zoals:
`https://sensible-docs-abc123.vercel.app`

Deze kun je delen met collega's voor testing!

## 🔄 Updates deployen:
Elke push naar de main branch triggert automatisch een nieuwe deployment.

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel deployed automatisch binnen 1-2 minuten
```

## 🐛 Troubleshooting:
- Check Vercel dashboard voor deployment logs
- Serverless functions logs zijn zichtbaar in Functions tab
- Voor local testing: `npm run dev` 

## Private AI API toegang voor teams

Er zijn verschillende strategieën om de Private AI API toegang te delen met je team:

### Optie 1: Gedeelde API Key (Eenvoudig) 🔑
**Voor kleine teams (2-5 personen)**

1. **Vercel Environment Variables**:
   - Ga naar je Vercel project dashboard
   - Ga naar Settings → Environment Variables
   - Voeg toe: `PRIVATE_AI_API_KEY` = `jouw-api-key`
   - Herdeployeer de applicatie

2. **Shared Secret Management**:
   ```bash
   # Team members kunnen de API key delen via:
   - Password manager (1Password, Bitwarden)
   - Secure team chat (Signal, encrypted Slack)
   - Internal documentation (GitBook, Notion)
   ```

### Optie 2: Private AI Self-Hosted (Geavanceerd) 🏠
**Voor grotere teams met eigen infrastructuur**

1. **Docker Setup**:
   ```bash
   # Private AI container
   docker run -d \
     --name private-ai \
     -p 8080:8080 \
     -e PRIVATE_AI_LICENSE_KEY=your-license \
     privateai/private-ai:latest
   ```

2. **Update Vercel configuratie**:
   ```javascript
   // In je Vercel environment variables:
   PRIVATE_AI_URL=https://your-internal-server.com:8080
   PRIVATE_AI_MODE=self-hosted
   ```

### Optie 3: Per-User API Keys (Enterprise) 👥
**Voor grote organisaties met individuele licenties**

1. **Database schema uitbreiding**:
   ```sql
   ALTER TABLE users ADD COLUMN private_ai_key VARCHAR(255);
   ```

2. **Frontend aanpassingen**:
   - User settings pagina voor API key input
   - Per-user API quota monitoring
   - Team admin kan keys beheren

### Optie 4: API Gateway / Proxy (Professioneel) 🚪
**Voor organisaties die centraal beheer willen**

1. **Setup API Gateway**:
   ```yaml
   # Kong, AWS API Gateway, of Azure API Management
   routes:
     - paths: ["/api/anonymize"]
       service: private-ai-service
       plugins:
         - rate-limiting:
             minute: 100
         - key-auth
   ```

2. **Kostenbeheer**:
   - Per-team quota's
   - Usage monitoring
   - Automatic billing allocation

## Huidige implementatie voor demo/testing

Voor de demo versie op Vercel gebruiken we momenteel:

```javascript
// In api/index.js - Fallback naar demo mode
const PRIVATE_AI_API_KEY = process.env.PRIVATE_AI_API_KEY || 'demo-mode'
const PRIVATE_AI_URL = process.env.PRIVATE_AI_URL || 'https://api.private-ai.com'

if (PRIVATE_AI_API_KEY === 'demo-mode') {
  // Gebruik mock PII detectie voor demo
  return mockPIIDetection(text)
}
```

## Audit Trail verbetering voor Vercel

### Probleem
Vercel serverless functions hebben geen persistente opslag, waardoor audit logs verloren gaan tussen deployments.

### Oplossing 1: Vercel KV Storage (Aanbevolen) 💾
```bash
# Install Vercel KV
npm install @vercel/kv

# In je Vercel project:
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

```javascript
// services/auditService.js
import { kv } from '@vercel/kv'

class VercelAuditService {
  async logEvent(event) {
    const key = `audit:${Date.now()}:${event.id}`
    await kv.set(key, event)
    
    // Maintain an index
    await kv.lpush('audit:index', key)
    
    // Keep only last 10,000 events
    const length = await kv.llen('audit:index')
    if (length > 10000) {
      const oldest = await kv.rpop('audit:index')
      await kv.del(oldest)
    }
  }

  async getAuditLog(filters) {
    const keys = await kv.lrange('audit:index', 0, -1)
    const events = await Promise.all(
      keys.map(key => kv.get(key))
    )
    
    return this.filterEvents(events, filters)
  }
}
```

### Oplossing 2: Externe Database (PostgreSQL/MongoDB) 🗄️
```javascript
// Voor production gebruik:
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

class DatabaseAuditService {
  async logEvent(event) {
    await pool.query(`
      INSERT INTO audit_events (id, timestamp, event_type, user_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [event.id, event.timestamp, event.eventType, event.userId, JSON.stringify(event.details)])
  }
}
```

### Oplossing 3: Cloud Logging Service (Datadog/LogRocket) ☁️
```javascript
// Integratie met externe logging:
import { logger as datadogLogger } from '@datadog/logger'

class CloudAuditService {
  async logEvent(event) {
    datadogLogger.info('Audit Event', {
      ...event,
      source: 'sensible-docs',
      environment: process.env.VERCEL_ENV
    })
  }
}
```

## Security best practices

### Environment Variables
```bash
# Nooit in code committen:
PRIVATE_AI_API_KEY=real-key-here
DATABASE_URL=postgresql://...
JWT_SECRET=random-secret

# Gebruik Vercel CLI:
vercel env add PRIVATE_AI_API_KEY
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

### Rate Limiting
```javascript
// Per API key rate limiting
const rateLimitByKey = new Map()

app.use('/api/anonymize', (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  const limit = rateLimitByKey.get(apiKey) || 0
  
  if (limit > 100) { // per hour
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }
  
  rateLimitByKey.set(apiKey, limit + 1)
  setTimeout(() => rateLimitByKey.delete(apiKey), 3600000) // 1 hour
  next()
})
```

## Monitoring & Alerting

### Vercel Analytics
```javascript
// Track API usage
import { track } from '@vercel/analytics'

app.post('/api/anonymize', async (req, res) => {
  const startTime = Date.now()
  
  try {
    const result = await anonymizeDocument(req.body)
    
    track('document_processed', {
      processingTime: Date.now() - startTime,
      piiItemsFound: result.piiItems.length,
      documentSize: req.body.length
    })
    
    res.json(result)
  } catch (error) {
    track('processing_error', { error: error.message })
    throw error
  }
})
```

### Health Checks
```javascript
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      privateAI: await checkPrivateAI(),
      database: await checkDatabase(),
      storage: await checkStorage()
    }
  }
  
  const isHealthy = Object.values(health.services).every(s => s.status === 'ok')
  
  res.status(isHealthy ? 200 : 503).json(health)
})
```

## Deployment Checklist

- [ ] Environment variables geconfigureerd in Vercel
- [ ] Private AI API key toegevoegd (of demo mode enabled)
- [ ] Database/KV storage geconfigureerd voor audit logs
- [ ] Rate limiting ingesteld
- [ ] CORS origins geconfigureerd voor production domains
- [ ] Health check endpoints toegevoegd
- [ ] Error monitoring geactiveerd (Sentry/LogRocket)
- [ ] Team toegang geconfigureerd voor Private AI
- [ ] Backup strategie voor audit logs
- [ ] Security headers geconfigureerd (HSTS, CSP, etc.)
- [ ] SSL certificaat gevalideerd
