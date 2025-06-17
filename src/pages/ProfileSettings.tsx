import { useState, useEffect } from 'react'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Copy,
  Star,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Hash,
  Globe,
  Building
} from 'lucide-react'
import { useAuditLogger } from '../hooks/useAuditLogger'
import toast from 'react-hot-toast'

interface PIISubcategory {
  id: string
  name: string
  description: string
  enabled: boolean
  examples: string[]
  patterns?: string[]
}

interface PIICategory {
  id: string
  name: string
  description: string
  icon: any
  enabled: boolean
  sensitivity: 'low' | 'medium' | 'high'
  examples: string[]
  patterns?: string[]
  subcategories?: PIISubcategory[]
}

interface Profile {
  id: string
  name: string
  description: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  lastModified: string
  piiCategories: PIICategory[]
  settings: {
    confidenceThreshold: number
    maskingStyle: 'redact' | 'replace' | 'hash'
    preserveStructure: boolean
    logDetections: boolean
  }
}

const defaultPIICategories: PIICategory[] = [
  {
    id: 'personal',
    name: 'Persoonlijke Gegevens',
    description: 'Namen, leeftijd en persoonlijke identificatie',
    icon: User,
    enabled: true,
    sensitivity: 'high',
    examples: ['Jan Jansen', 'Dr. Maria van der Berg', 'J.P. Smit'],
    subcategories: [
      {
        id: 'full-names',
        name: 'Volledige namen',
        description: 'Voor- en achternamen van personen',
        enabled: true,
        examples: ['Jan Jansen', 'Maria van der Berg'],
        patterns: ['[A-Z][a-z]+ [A-Z][a-z]+', '[A-Z][a-z]+ (van|de|der) [A-Z][a-z]+']
      },
      {
        id: 'initials',
        name: 'Initialen',
        description: 'Afkortingen van namen',
        enabled: false,
        examples: ['J.P. Smit', 'M.v.d. Berg'],
        patterns: ['[A-Z]\\.[A-Z]\\. [A-Z][a-z]+', '[A-Z]\\.[a-z]\\.[a-z]\\. [A-Z][a-z]+']
      },
      {
        id: 'titles',
        name: 'Titels en aanhef',
        description: 'Academische en professionele titels',
        enabled: false,
        examples: ['Dr. Jansen', 'Prof. Smith', 'Dhr. Pietersen'],
        patterns: ['(Dr|Prof|Dhr|Mevr|Mr|Ir)\\. [A-Z][a-z]+']
      },
      {
        id: 'nicknames',
        name: 'Bijnamen en roepnamen',
        description: 'Informele namen en aliassen',
        enabled: false,
        examples: ['Jantje', 'Piet de Grote', 'Henkie'],
        patterns: ['[A-Z][a-z]+je', '[A-Z][a-z]+ de [A-Z][a-z]+']
      }
    ]
  },
  {
    id: 'contact',
    name: 'Contactgegevens',
    description: 'Telefoon, email en digitale contactinformatie',
    icon: Mail,
    enabled: true,
    sensitivity: 'high',
    examples: ['j.jansen@gemeente.nl', '06-12345678', '@janjansen'],
    subcategories: [
      {
        id: 'email-personal',
        name: 'Persoonlijke e-mailadressen',
        description: 'Privé en werk e-mailadressen van individuen',
        enabled: true,
        examples: ['jan.jansen@gmail.com', 'j.jansen@bedrijf.nl'],
        patterns: ['[a-z]+\\.[a-z]+@(gmail|hotmail|outlook|yahoo)', '[a-z]\\.[a-z]+@[a-z]+\\.(nl|com)']
      },
      {
        id: 'email-generic',
        name: 'Algemene e-mailadressen',
        description: 'Info, contact en service e-mailadressen',
        enabled: false,
        examples: ['info@gemeente.nl', 'contact@bedrijf.com'],
        patterns: ['(info|contact|service|support)@[a-z]+\\.(nl|com)']
      },
      {
        id: 'phone-mobile',
        name: 'Mobiele telefoonnummers',
        description: 'Persoonlijke mobiele nummers',
        enabled: true,
        examples: ['06-12345678', '+31 6 12345678'],
        patterns: ['06[\\s-]?[0-9]{8}', '\\+31[\\s]?6[\\s]?[0-9]{8}']
      },
      {
        id: 'phone-landline',
        name: 'Vaste telefoonnummers',
        description: 'Huistelefoons en kantoorlijnen',
        enabled: false,
        examples: ['020-1234567', '0800-1234'],
        patterns: ['0[0-9]{2,3}[\\s-]?[0-9]{6,7}']
      },
      {
        id: 'social-media',
        name: 'Social media handles',
        description: 'Gebruikersnamen op sociale platformen',
        enabled: false,
        examples: ['@janjansen', 'linkedin.com/in/jan-jansen'],
        patterns: ['@[a-z0-9_]+', 'linkedin\\.com/in/[a-z-]+']
      }
    ]
  },
  {
    id: 'location',
    name: 'Locatiegegevens',
    description: 'Adressen, postcodes en geografische informatie',
    icon: MapPin,
    enabled: true,
    sensitivity: 'medium',
    examples: ['Hoofdstraat 123', '1234 AB Amsterdam'],
    subcategories: [
      {
        id: 'full-address',
        name: 'Volledige adressen',
        description: 'Straat, huisnummer en plaats',
        enabled: true,
        examples: ['Hoofdstraat 123, Amsterdam', 'Kerkstraat 45 bis'],
        patterns: ['[A-Z][a-z]+straat [0-9]+[a-z]?', '[A-Z][a-z]+ [0-9]+[a-z]?, [A-Z][a-z]+']
      },
      {
        id: 'postal-codes',
        name: 'Postcodes',
        description: 'Nederlandse postcodes',
        enabled: true,
        examples: ['1234 AB', '5678CD'],
        patterns: ['[0-9]{4}\\s?[A-Z]{2}']
      },
      {
        id: 'po-boxes',
        name: 'Postbussen',
        description: 'Postbus adressen',
        enabled: false,
        examples: ['Postbus 123', 'Postbus 456, Amsterdam'],
        patterns: ['Postbus [0-9]+', 'Postbus [0-9]+, [A-Z][a-z]+']
      },
      {
        id: 'coordinates',
        name: 'GPS coördinaten',
        description: 'Geografische coördinaten',
        enabled: false,
        examples: ['52.3676° N, 4.9041° E', 'N52°22 E4°54'],
        patterns: ['[0-9]{2}\\.[0-9]+°\\s?[NS], [0-9]\\.[0-9]+°\\s?[EW]']
      }
    ]
  },
  {
    id: 'financial',
    name: 'Financiële Gegevens',
    description: 'Bankgegevens, betalingen en financiële identificatie',
    icon: CreditCard,
    enabled: true,
    sensitivity: 'high',
    examples: ['NL91 ABNA 0417 1643 00', '1234 5678 9012 3456'],
    subcategories: [
      {
        id: 'iban',
        name: 'IBAN rekeningnummers',
        description: 'Internationale bankrekeningnummers',
        enabled: true,
        examples: ['NL91 ABNA 0417 1643 00', 'DE89 3704 0044 0532 0130 00'],
        patterns: ['[A-Z]{2}[0-9]{2}\\s?[A-Z]{4}\\s?[0-9]{4}\\s?[0-9]{4}\\s?[0-9]{2}']
      },
      {
        id: 'credit-cards',
        name: 'Creditcard nummers',
        description: 'Visa, Mastercard, American Express',
        enabled: true,
        examples: ['1234 5678 9012 3456', '4111-1111-1111-1111'],
        patterns: ['[0-9]{4}[\\s-]?[0-9]{4}[\\s-]?[0-9]{4}[\\s-]?[0-9]{4}']
      },
      {
        id: 'invoice-numbers',
        name: 'Factuurnummers',
        description: 'Commerciële factuurnummers',
        enabled: false,
        examples: ['INV-2024-001', 'F240117-001'],
        patterns: ['(INV|F)[\\-]?[0-9]{4,6}[\\-]?[0-9]{3}']
      },
      {
        id: 'tax-numbers',
        name: 'BTW en belastingnummers',
        description: 'Fiscale identificatienummers',
        enabled: false,
        examples: ['NL123456789B01', 'BTW: NL001234567B01'],
        patterns: ['NL[0-9]{9}B[0-9]{2}', 'BTW:?\\s?NL[0-9]{9}B[0-9]{2}']
      }
    ]
  },
  {
    id: 'identification',
    name: 'Identificatienummers',
    description: 'Officiële ID nummers en documenten',
    icon: Hash,
    enabled: true,
    sensitivity: 'high',
    examples: ['123456789', 'AB1234567', 'NL123456789B01'],
    subcategories: [
      {
        id: 'bsn',
        name: 'Burgerservicenummers (BSN)',
        description: 'Nederlandse BSN nummers',
        enabled: true,
        examples: ['123456789', '987654321'],
        patterns: ['[0-9]{9}']
      },
      {
        id: 'passport',
        name: 'Paspoortnummers',
        description: 'Nederlandse paspoortnummers',
        enabled: true,
        examples: ['AB1234567', 'CD9876543'],
        patterns: ['[A-Z]{2}[0-9]{7}']
      },
      {
        id: 'drivers-license',
        name: 'Rijbewijsnummers',
        description: 'Nederlandse rijbewijzen',
        enabled: true,
        examples: ['1234567890', '0987654321'],
        patterns: ['[0-9]{10}']
      },
      {
        id: 'employee-id',
        name: 'Personeelsnummers',
        description: 'Interne medewerker identificatie',
        enabled: false,
        examples: ['EMP-001234', 'PNR123456'],
        patterns: ['(EMP|PNR)[\\-]?[0-9]{6}']
      }
    ]
  },
  {
    id: 'temporal',
    name: 'Datum en Tijd Gegevens',
    description: 'Geboortedatums en tijdsgevoelige informatie',
    icon: Calendar,
    enabled: false,
    sensitivity: 'low',
    examples: ['01-01-1990', '15 maart 1985'],
    subcategories: [
      {
        id: 'birth-dates',
        name: 'Geboortedatums',
        description: 'Specifieke geboortedatums',
        enabled: false,
        examples: ['01-01-1990', '15 maart 1985', '12/05/1978'],
        patterns: ['[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}', '[0-9]{1,2} [a-z]+ [0-9]{4}']
      },
      {
        id: 'age-references',
        name: 'Leeftijdsverwijzingen',
        description: 'Expliciete leeftijd vermeldingen',
        enabled: false,
        examples: ['45 jaar oud', '67-jarige man', 'leeftijd: 32'],
        patterns: ['[0-9]{2,3}[\\s-]?jaar', '[0-9]{2}[\\s-]?jarige', 'leeftijd:?\\s?[0-9]{2}']
      },
      {
        id: 'retirement-dates',
        name: 'Pensioendatums',
        description: 'AOW en pensioen gerelateerde datums',
        enabled: false,
        examples: ['AOW vanaf 01-01-2030', 'pensioen per 15-06-2025'],
        patterns: ['(AOW|pensioen) (vanaf|per) [0-9]{2}-[0-9]{2}-[0-9]{4}']
      }
    ]
  },
  {
    id: 'organizations',
    name: 'Organisaties en Bedrijven',
    description: 'Bedrijfsnamen en organisatorische informatie',
    icon: Building,
    enabled: false,
    sensitivity: 'low',
    examples: ['Gemeente Amsterdam', 'KPN B.V.', 'Stichting Welzijn'],
    subcategories: [
      {
        id: 'companies',
        name: 'Bedrijfsnamen',
        description: 'Commerciële bedrijven en ondernemingen',
        enabled: false,
        examples: ['KPN B.V.', 'Rabobank Nederland', 'Shell Nederland'],
        patterns: ['[A-Z][a-zA-Z\\s]+(B\\.V\\.|N\\.V\\.|Nederland)']
      },
      {
        id: 'government',
        name: 'Overheidsorganisaties',
        description: 'Gemeenten, ministeries en overheidsinstanties',
        enabled: false,
        examples: ['Gemeente Amsterdam', 'Ministerie van BZK', 'CBS'],
        patterns: ['(Gemeente|Ministerie van) [A-Z][a-z]+', '[A-Z]{2,4}\\s?(Nederland)?']
      },
      {
        id: 'foundations',
        name: 'Stichtingen en verenigingen',
        description: 'Non-profit organisaties',
        enabled: false,
        examples: ['Stichting Welzijn', 'Vereniging Eigenaren'],
        patterns: ['(Stichting|Vereniging) [A-Z][a-z\\s]+']
      }
    ]
  },
  {
    id: 'digital',
    name: 'Digitale Identiteiten',
    description: 'Online accounts en digitale voetafdrukken',
    icon: Globe,
    enabled: false,
    sensitivity: 'low',
    examples: ['www.gemeente.nl', 'https://example.com', '@gebruiker'],
    subcategories: [
      {
        id: 'websites',
        name: 'Website URLs',
        description: 'Weblinks en domeinnamen',
        enabled: false,
        examples: ['www.gemeente.nl', 'https://example.com'],
        patterns: ['https?://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', 'www\\.[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}']
      },
      {
        id: 'ip-addresses',
        name: 'IP-adressen',
        description: 'IPv4 en IPv6 adressen',
        enabled: false,
        examples: ['192.168.1.1', '2001:db8::1'],
        patterns: ['[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}']
      },
      {
        id: 'usernames',
        name: 'Gebruikersnamen',
        description: 'Online gebruikersaccounts',
        enabled: false,
        examples: ['gebruiker123', 'jan_jansen'],
        patterns: ['[a-z0-9_]{3,}']
      }
    ]
  }
]

const ProfileSettings = () => {
  const { logPageVisit, logEvent } = useAuditLogger()
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: '1',
      name: 'Standaard WOO-profiel',
      description: 'Detecteert alle standaard PII volgens WOO-wetgeving',
      isDefault: true,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-15T10:30:00Z',
      piiCategories: defaultPIICategories.map(cat => ({ ...cat, enabled: cat.sensitivity === 'high' })),
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
      piiCategories: defaultPIICategories.map(cat => ({ ...cat, enabled: true })),
      settings: {
        confidenceThreshold: 0.6,
        maskingStyle: 'replace',
        preserveStructure: true,
        logDetections: true
      }
    }
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [newProfile, setNewProfile] = useState<Partial<Profile>>({
    name: '',
    description: '',
    piiCategories: defaultPIICategories,
    settings: {
      confidenceThreshold: 0.8,
      maskingStyle: 'redact',
      preserveStructure: true,
      logDetections: true
    }
  })

  useEffect(() => {
    logPageVisit('Profile Settings')
  }, [])

  const handleCreateProfile = () => {
    if (!newProfile.name || !newProfile.description) {
      toast.error('Naam en beschrijving zijn verplicht')
      return
    }

    const profile: Profile = {
      id: Date.now().toString(),
      name: newProfile.name,
      description: newProfile.description,
      isDefault: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      piiCategories: newProfile.piiCategories || defaultPIICategories,
      settings: newProfile.settings || {
        confidenceThreshold: 0.8,
        maskingStyle: 'redact',
        preserveStructure: true,
        logDetections: true
      }
    }

    setProfiles(prev => [...prev, profile])
    setShowCreateModal(false)
    setNewProfile({
      name: '',
      description: '',
      piiCategories: defaultPIICategories,
      settings: {
        confidenceThreshold: 0.8,
        maskingStyle: 'redact',
        preserveStructure: true,
        logDetections: true
      }
    })

    logEvent({
      eventType: 'profile_created',
      action: 'New anonymization profile created',
      details: { profileName: profile.name, profileId: profile.id }
    })

    toast.success(`Profiel "${profile.name}" aangemaakt`)
  }

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile({ ...profile })
  }

  const handleSaveProfile = () => {
    if (!editingProfile) return

    setProfiles(prev => prev.map(p => 
      p.id === editingProfile.id 
        ? { ...editingProfile, lastModified: new Date().toISOString() }
        : p
    ))

    logEvent({
      eventType: 'profile_updated',
      action: 'Anonymization profile configuration updated',
      details: { profileName: editingProfile.name, profileId: editingProfile.id }
    })

    setEditingProfile(null)
    toast.success(`Profiel "${editingProfile.name}" opgeslagen`)
  }

  const handleDeleteProfile = (profile: Profile) => {
    if (profile.isDefault) {
      toast.error('Standaardprofiel kan niet worden verwijderd')
      return
    }

    setProfiles(prev => prev.filter(p => p.id !== profile.id))

    logEvent({
      eventType: 'profile_deleted',
      action: 'Anonymization profile deleted',
      details: { profileName: profile.name, profileId: profile.id }
    })

    toast.success(`Profiel "${profile.name}" verwijderd`)
  }

  const handleDuplicateProfile = (profile: Profile) => {
    const duplicatedProfile: Profile = {
      ...profile,
      id: Date.now().toString(),
      name: `${profile.name} (kopie)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    setProfiles(prev => [...prev, duplicatedProfile])

    logEvent({
      eventType: 'profile_duplicated',
      action: 'Anonymization profile duplicated',
      details: { 
        originalProfile: profile.name, 
        newProfile: duplicatedProfile.name,
        newProfileId: duplicatedProfile.id
      }
    })

    toast.success(`Profiel gekopieerd als "${duplicatedProfile.name}"`)
  }

  const handleSetDefault = (profileId: string) => {
    setProfiles(prev => prev.map(p => ({
      ...p,
      isDefault: p.id === profileId
    })))

    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      logEvent({
        eventType: 'profile_default_changed',
        action: 'Default anonymization profile changed',
        details: { profileName: profile.name, profileId }
      })

      toast.success(`"${profile.name}" ingesteld als standaardprofiel`)
    }
  }

  const updatePIICategory = (categoryId: string, updates: Partial<PIICategory>) => {
    if (!editingProfile) return

    setEditingProfile(prev => ({
      ...prev!,
      piiCategories: prev!.piiCategories.map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
    }))
  }

  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSensitivityLabel = (sensitivity: string) => {
    switch (sensitivity) {
      case 'high': return 'Hoog'
      case 'medium': return 'Gemiddeld'
      case 'low': return 'Laag'
      default: return 'Onbekend'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Profielinstellingen
        </h1>
        <p className="text-neutral-600">
          Beheer uw anonimisatieprofielen en PII-detectie instellingen voor optimale WOO-compliance.
        </p>
      </div>

      {/* Profiles Overview */}
      <div className="card">
        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Anonimisatieprofielen ({profiles.length})
            </h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw profiel
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-neutral-200">
          {profiles.map(profile => (
            <div key={profile.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-medium text-neutral-900 mr-3">
                      {profile.name}
                    </h3>
                    {profile.isDefault && (
                      <span className="badge-success mr-2">
                        <Star className="w-3 h-3 mr-1" />
                        Standaard
                      </span>
                    )}
                    <span className={`badge-${profile.isActive ? 'success' : 'neutral'}`}>
                      {profile.isActive ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">
                    {profile.description}
                  </p>
                  
                  {/* Profile Stats */}
                  <div className="flex items-center space-x-4 text-xs text-neutral-500">
                    <span className="flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      {profile.piiCategories.filter(cat => cat.enabled).length} van {profile.piiCategories.length} categorieën
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {Math.round(profile.settings.confidenceThreshold * 100)}% drempel
                    </span>
                    <span>
                      Gewijzigd: {new Date(profile.lastModified).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!profile.isDefault && (
                    <button 
                      className="btn btn-ghost text-sm"
                      onClick={() => handleSetDefault(profile.id)}
                      title="Als standaard instellen"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    className="btn btn-ghost"
                    onClick={() => handleDuplicateProfile(profile)}
                    title="Dupliceren"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    className="btn btn-ghost"
                    onClick={() => handleEditProfile(profile)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!profile.isDefault && (
                    <button 
                      className="btn btn-ghost text-error"
                      onClick={() => handleDeleteProfile(profile)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)} />
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-neutral-900">
                  Nieuw anonimisatieprofiel
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Profielnaam
                  </label>
                  <input
                    type="text"
                    value={newProfile.name || ''}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="Bijv. Streng WOO-profiel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Beschrijving
                  </label>
                  <textarea
                    value={newProfile.description || ''}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    rows={3}
                    placeholder="Beschrijf wanneer dit profiel gebruikt moet worden..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Detectiedrempel
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.1"
                      value={newProfile.settings?.confidenceThreshold || 0.8}
                      onChange={(e) => setNewProfile(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, confidenceThreshold: parseFloat(e.target.value) }
                      }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-neutral-900 min-w-[3rem]">
                      {Math.round((newProfile.settings?.confidenceThreshold || 0.8) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Lagere waarde = meer detecties, maar ook meer false positives
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateProfile}
                  className="btn btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Profiel aanmaken
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setEditingProfile(null)} />
            
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-neutral-900">
                  Profiel bewerken: {editingProfile.name}
                </h3>
                <button
                  onClick={() => setEditingProfile(null)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Profielnaam
                    </label>
                    <input
                      type="text"
                      value={editingProfile.name}
                      onChange={(e) => setEditingProfile(prev => ({ ...prev!, name: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editingProfile.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditingProfile(prev => ({ ...prev!, isActive: e.target.value === 'active' }))}
                      className="input"
                    >
                      <option value="active">Actief</option>
                      <option value="inactive">Inactief</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Beschrijving
                  </label>
                  <textarea
                    value={editingProfile.description}
                    onChange={(e) => setEditingProfile(prev => ({ ...prev!, description: e.target.value }))}
                    className="input"
                    rows={2}
                  />
                </div>

                {/* Detection Settings */}
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-medium text-neutral-900 mb-4">Detectie-instellingen</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Detectiedrempel ({Math.round(editingProfile.settings.confidenceThreshold * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.05"
                        value={editingProfile.settings.confidenceThreshold}
                        onChange={(e) => setEditingProfile(prev => ({
                          ...prev!,
                          settings: { ...prev!.settings, confidenceThreshold: parseFloat(e.target.value) }
                        }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Maskering stijl
                      </label>
                      <select
                        value={editingProfile.settings.maskingStyle}
                        onChange={(e) => setEditingProfile(prev => ({
                          ...prev!,
                          settings: { ...prev!.settings, maskingStyle: e.target.value as any }
                        }))}
                        className="input"
                      >
                        <option value="redact">[VERWIJDERD]</option>
                        <option value="replace">[VERVANGEN]</option>
                        <option value="hash">###HASH###</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProfile.settings.preserveStructure}
                        onChange={(e) => setEditingProfile(prev => ({
                          ...prev!,
                          settings: { ...prev!.settings, preserveStructure: e.target.checked }
                        }))}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-neutral-700">
                        Documentstructuur behouden
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProfile.settings.logDetections}
                        onChange={(e) => setEditingProfile(prev => ({
                          ...prev!,
                          settings: { ...prev!.settings, logDetections: e.target.checked }
                        }))}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-neutral-700">
                        Detecties loggen
                      </span>
                    </label>
                  </div>
                </div>

                {/* PII Categories */}
                <div>
                  <h4 className="font-medium text-neutral-900 mb-4">
                    PII Categorieën ({editingProfile.piiCategories.filter(cat => cat.enabled).length} van {editingProfile.piiCategories.length} actief)
                  </h4>
                  
                  <div className="space-y-4">
                    {editingProfile.piiCategories.map(category => {
                      const Icon = category.icon
                      const enabledSubcategories = category.subcategories?.filter(sub => sub.enabled).length || 0
                      const totalSubcategories = category.subcategories?.length || 0
                      
                      return (
                        <div key={category.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                          {/* Main Category Header */}
                          <div className="p-4 bg-neutral-50 border-b border-neutral-200">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className="flex items-center mt-1">
                                  <input
                                    type="checkbox"
                                    checked={category.enabled}
                                    onChange={(e) => updatePIICategory(category.id, { enabled: e.target.checked })}
                                    className="rounded border-neutral-300 text-primary focus:ring-primary"
                                  />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Icon className="w-5 h-5 text-neutral-600" />
                                    <h5 className="font-semibold text-neutral-900">{category.name}</h5>
                                    <span className={`px-2 py-1 text-xs rounded-full ${getSensitivityColor(category.sensitivity)}`}>
                                      {getSensitivityLabel(category.sensitivity)}
                                    </span>
                                    {totalSubcategories > 0 && (
                                      <span className="px-2 py-1 text-xs bg-neutral-200 text-neutral-700 rounded-full">
                                        {enabledSubcategories}/{totalSubcategories} actief
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-neutral-600 mb-2">
                                    {category.description}
                                  </p>
                                  
                                  <div className="text-xs text-neutral-500">
                                    <strong>Voorbeelden:</strong> {category.examples.join(', ')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Subcategories */}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <div className="p-4">
                              <div className="space-y-3">
                                {category.subcategories.map(subcategory => (
                                  <div key={subcategory.id} className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg">
                                    <div className="flex items-center mt-1">
                                      <input
                                        type="checkbox"
                                        checked={subcategory.enabled}
                                        onChange={(e) => {
                                          const updatedCategory = {
                                            ...category,
                                            subcategories: category.subcategories?.map(sub =>
                                              sub.id === subcategory.id 
                                                ? { ...sub, enabled: e.target.checked }
                                                : sub
                                            )
                                          }
                                          setEditingProfile(prev => ({
                                            ...prev!,
                                            piiCategories: prev!.piiCategories.map(cat =>
                                              cat.id === category.id ? updatedCategory : cat
                                            )
                                          }))
                                        }}
                                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                                      />
                                    </div>
                                    
                                    <div className="flex-1">
                                      <h6 className="font-medium text-neutral-900 mb-1">
                                        {subcategory.name}
                                      </h6>
                                      <p className="text-sm text-neutral-600 mb-2">
                                        {subcategory.description}
                                      </p>
                                      <div className="text-xs text-neutral-500">
                                        <strong>Voorbeelden:</strong> {subcategory.examples.join(', ')}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-neutral-200">
                <button
                  onClick={() => setEditingProfile(null)}
                  className="btn btn-ghost"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="btn btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Wijzigingen opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSettings 