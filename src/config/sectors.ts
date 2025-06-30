export type SectorType = 'government' | 'education'

export interface SectorConfig {
  id: SectorType
  name: string
  tagline: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  terminology: {
    // Navigation
    projects: string
    documents: string
    profiles: string
    
    // Entity names
    organization: string
    user: string
    subject: string
    request: string
    
    // Actions
    process: string
    anonymize: string
    compliance: string
  }
  sampleDocuments: string[]
  defaultProfiles: Array<{
    id: string
    name: string
    description: string
    settings: any
  }>
}

export const sectorConfigs: Record<SectorType, SectorConfig> = {
  government: {
    id: 'government',
    name: 'Sensible Docs WOO',
    tagline: 'Document anonimisering volgens de Wet Open Overheid',
    primaryColor: '#00584A',
    secondaryColor: '#E6F4F1', 
    accentColor: '#6B46C1',
    terminology: {
      projects: 'WOO-verzoeken',
      documents: 'Overheidsdocumenten',
      profiles: 'Anonimiseringsprofielen',
      organization: 'Gemeente',
      user: 'Ambtenaar',
      subject: 'Burger',
      request: 'WOO-verzoek',
      process: 'Verwerken',
      anonymize: 'Anonimiseren',
      compliance: 'WOO-compliance'
    },
    sampleDocuments: [
      'woo-verzoek-2024-001.pdf',
      'raadsbesluit-bestemmingsplan.pdf',
      'subsidieaanvraag-sportvereniging.docx'
    ],
    defaultProfiles: [
      {
        id: 'woo-standard',
        name: 'Standaard WOO-profiel',
        description: 'Detecteert alle standaard PII volgens WOO-wetgeving',
        settings: {
          detectNames: true,
          detectEmails: true,
          detectPhones: true,
          detectAddresses: true,
          detectBSN: true,
          confidence: 0.8
        }
      }
    ]
  },
  
  education: {
    id: 'education',
    name: 'Sensible Docs Onderwijs',
    tagline: 'Privacy-bescherming voor onderwijsdocumenten',
    primaryColor: '#1E40AF',
    secondaryColor: '#EBF4FF',
    accentColor: '#F59E0B',
    terminology: {
      projects: 'Privacy-audits',
      documents: 'Onderwijsdocumenten', 
      profiles: 'Privacy-profielen',
      organization: 'Onderwijsinstelling',
      user: 'Docent/Administrator',
      subject: 'Leerling/Student',
      request: 'Privacy-audit',
      process: 'Screenen',
      anonymize: 'Anonimiseren',
      compliance: 'AVG-compliance'
    },
    sampleDocuments: [
      'leerling-rapport-2024-Q1.pdf',
      'ouder-gesprek-verslag.docx',
      'psychologische-evaluatie.pdf',
      'examen-beoordeling-wiskunde.pdf'
    ],
    defaultProfiles: [
      {
        id: 'education-standard',
        name: 'Standaard Onderwijs-profiel',
        description: 'Detecteert PII in onderwijsdocumenten volgens AVG',
        settings: {
          detectNames: true,
          detectEmails: true,
          detectPhones: true,
          detectAddresses: true,
          detectStudentIds: true,
          detectGrades: true,
          confidence: 0.85
        }
      },
      {
        id: 'education-sensitive',
        name: 'Gevoelige Data Profiel',
        description: 'Extra bescherming voor medische en psychologische rapporten',
        settings: {
          detectNames: true,
          detectEmails: true,
          detectPhones: true,
          detectAddresses: true,
          detectStudentIds: true,
          detectGrades: true,
          detectMedicalInfo: true,
          detectPsychInfo: true,
          confidence: 0.9
        }
      }
    ]
  }
}

// Get current sector from environment or URL
export const getCurrentSector = (): SectorType => {
  // Check URL subdomain or environment variable
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  
  if (hostname.includes('edu') || hostname.includes('onderwijs')) {
    return 'education'
  }
  
  // Default to government for existing WOO setup
  return process.env.VITE_SECTOR as SectorType || 'government'
}

export const currentSectorConfig = sectorConfigs[getCurrentSector()] 