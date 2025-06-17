#!/usr/bin/env node

import { promises as fs } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DEMO_DIR = join(__dirname, '..', 'tmp', 'demo')
const UPLOADS_DIR = join(__dirname, '..', 'uploads')

async function resetDemo() {
  console.log('🧹 Starting demo reset...')
  
  try {
    // Clean demo directory
    console.log('📁 Cleaning demo directory...')
    await fs.rm(DEMO_DIR, { recursive: true, force: true })
    await fs.mkdir(DEMO_DIR, { recursive: true })
    
    // Create subdirectories
    await fs.mkdir(join(DEMO_DIR, 'logs'), { recursive: true })
    await fs.mkdir(join(DEMO_DIR, 'cache'), { recursive: true })
    
    // Clean uploads directory but keep the folder
    console.log('📎 Cleaning uploads directory...')
    try {
      const uploadFiles = await fs.readdir(UPLOADS_DIR)
      for (const file of uploadFiles) {
        if (file !== '.gitkeep') {
          await fs.rm(join(UPLOADS_DIR, file), { recursive: true, force: true })
        }
      }
    } catch (error) {
      // Uploads directory doesn't exist, create it
      await fs.mkdir(UPLOADS_DIR, { recursive: true })
      await fs.writeFile(join(UPLOADS_DIR, '.gitkeep'), '')
    }
    
    // Reset in-memory data (create fresh state files)
    console.log('💾 Resetting application state...')
    
    const initialState = {
      documents: [],
      auditLog: [],
      analytics: {
        totalDocuments: 0,
        processedSuccessfully: 0,
        avgProcessingTime: 0,
        piiItemsFound: 0,
        lastReset: new Date().toISOString()
      },
      profiles: [
        {
          id: 'default',
          name: 'Standaard WOO-profiel',
          description: 'Detecteert alle standaard PII volgens WOO-wetgeving',
          isDefault: true,
          settings: {
            detectNames: true,
            detectEmails: true,
            detectPhones: true,
            detectAddresses: true,
            detectBSN: true,
            confidence: 0.8
          }
        },
        {
          id: 'strict',
          name: 'Strict profiel',
          description: 'Extra voorzichtig, detecteert ook potentieel gevoelige informatie',
          isDefault: false,
          settings: {
            detectNames: true,
            detectEmails: true,
            detectPhones: true,
            detectAddresses: true,
            detectBSN: true,
            detectOrganizations: true,
            detectDates: true,
            confidence: 0.6
          }
        }
      ]
    }
    
    await fs.writeFile(
      join(DEMO_DIR, 'state.json'),
      JSON.stringify(initialState, null, 2)
    )
    
    // Create demo log entry
    const resetLogEntry = {
      timestamp: new Date().toISOString(),
      action: 'DEMO_RESET',
      message: 'Demo environment reset successfully',
      user: 'System',
      details: {
        resetBy: 'reset-demo.js',
        directoriesCleared: [DEMO_DIR, UPLOADS_DIR],
        stateReset: true
      }
    }
    
    await fs.writeFile(
      join(DEMO_DIR, 'logs', 'reset.log'),
      JSON.stringify(resetLogEntry, null, 2) + '\n'
    )
    
    console.log('✅ Demo reset completed successfully!')
    console.log(`📍 Demo directory: ${DEMO_DIR}`)
    console.log(`📍 Uploads directory: ${UPLOADS_DIR}`)
    console.log(`🕒 Reset time: ${new Date().toLocaleString('nl-NL')}`)
    
  } catch (error) {
    console.error('❌ Error during demo reset:', error)
    process.exit(1)
  }
}

// Auto-reset functionality
async function scheduleAutoReset() {
  const interval = process.env.DEMO_RESET_INTERVAL || 3600000 // 1 hour default
  
  console.log(`⏰ Auto-reset scheduled every ${interval / 1000 / 60} minutes`)
  
  setInterval(async () => {
    console.log('🔄 Auto-reset triggered...')
    await resetDemo()
  }, parseInt(interval))
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  
  if (args.includes('--auto')) {
    await resetDemo()
    await scheduleAutoReset()
    
    // Keep process running
    process.on('SIGINT', () => {
      console.log('\n👋 Auto-reset stopped by user')
      process.exit(0)
    })
    
    console.log('🔄 Auto-reset is running. Press Ctrl+C to stop.')
    
  } else {
    await resetDemo()
  }
} 