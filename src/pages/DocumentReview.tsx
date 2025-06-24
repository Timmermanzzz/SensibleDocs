import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Download, 
  ArrowLeft, 
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Undo2,
  FileText,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import PDFViewer from '../components/PDFViewer'
import { useAuditLogger } from '../hooks/useAuditLogger'

interface PIIHighlight {
  id: string
  type: 'name' | 'email' | 'phone' | 'address' | 'bsn' | 'other'
  original: string
  masked: string
  confidence: number
  position: {
    x: number
    y: number
    width: number
    height: number
    page: number
  }
  approved: boolean
}

const DocumentReview = () => {
  const { logPageVisit, logItemOverridden, logDownloadRequested, logMaskingRequested } = useAuditLogger()
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState<any>(null)
  const [piiItems, setPiiItems] = useState<PIIHighlight[]>([])
  const [showOriginal, setShowOriginal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  
  // Sample PDF URL (local file for demo)
  const samplePdfUrl = '/samples/woo-verzoek-2024-001.pdf'

  useEffect(() => {
    logPageVisit('Document Review')
    
    // Mock document data
    setDocument({
      id,
      name: 'WOO-verzoek-2024-001.pdf',
      originalSize: '2.4 MB',
      processedAt: '2024-01-15T10:30:00Z',
      status: 'completed',
      url: samplePdfUrl
    })

    // Mock PII items with exact text that should be found in the PDF TextLayer
    setPiiItems([
      {
        id: '1',
        type: 'name',
        original: 'Jan Janssen',
        masked: '[NAAM VERWIJDERD]',
        confidence: 0.98,
        position: { x: 114, y: 521, width: 70, height: 12, page: 1 },
        approved: false
      },
      {
        id: '2', 
        type: 'address',
        original: 'Postbus 12345',
        masked: '[ADRES VERWIJDERD]',
        confidence: 0.92,
        position: { x: 114, y: 540, width: 85, height: 12, page: 1 },
        approved: false
      },
      {
        id: '3',
        type: 'address',
        original: '1234 AB Amsterdam',
        masked: '[ADRES VERWIJDERD]',
        confidence: 0.94,
        position: { x: 114, y: 559, width: 120, height: 12, page: 1 },
        approved: false
      },
      {
        id: '4',
        type: 'phone',
        original: '06-12345678',
        masked: '[TELEFOON VERWIJDERD]',
        confidence: 0.95,
        position: { x: 114, y: 578, width: 90, height: 12, page: 1 },
        approved: false
      },
      {
        id: '5',
        type: 'email',
        original: 'jan.janssen@email.nl',
        masked: '[EMAIL VERWIJDERD]',
        confidence: 0.97,
        position: { x: 114, y: 597, width: 130, height: 12, page: 1 },
        approved: false
      },
      {
        id: '6',
        type: 'bsn',
        original: '123456789',
        masked: '[BSN VERWIJDERD]',
        confidence: 0.99,
        position: { x: 114, y: 616, width: 70, height: 12, page: 1 },
        approved: false
      },
      {
        id: '7',
        type: 'name',
        original: 'Andreas Gal',
        masked: '[NAAM VERWIJDERD]',
        confidence: 0.96,
        position: { x: 270, y: 389, width: 75, height: 12, page: 1 },
        approved: false
      },
      {
        id: '8',
        type: 'email',
        original: 'agal@mozilla.com',
        masked: '[EMAIL VERWIJDERD]',
        confidence: 0.98,
        position: { x: 238, y: 408, width: 110, height: 12, page: 1 },
        approved: false
      },
      {
        id: '9',
        type: 'name',
        original: 'Brendan Eich',
        masked: '[NAAM VERWIJDERD]',
        confidence: 0.97,
        position: { x: 268, y: 467, width: 85, height: 12, page: 1 },
        approved: false
      },
      {
        id: '10',
        type: 'phone',
        original: '1-650-903-0800',
        masked: '[TELEFOON VERWIJDERD]',
        confidence: 0.94,
        position: { x: 330, y: 427, width: 100, height: 12, page: 1 },
        approved: false
      }
    ])
  }, [id])

  const handleApprovalToggle = (itemId: string) => {
    setPiiItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, approved: !item.approved }
        : item
    ))
    
    const item = piiItems.find(p => p.id === itemId)
    if (item) {
      // Log the override action
      logItemOverridden(
        id || 'unknown',
        item.type,
        !item.approved ? 'approved' : 'rejected',
        {
          original: item.original,
          masked: item.masked,
          confidence: item.confidence,
          position: item.position
        }
      )
      
      toast.success(
        `${getTypeLabel(item.type)} ${item.approved ? 'geweigerd' : 'goedgekeurd'}`,
        { icon: item.approved ? '❌' : '✅' }
      )
    }
  }

  const handleHighlightClick = (highlightId: string) => {
    setSelectedItem(selectedItem === highlightId ? null : highlightId)
  }

  const handleBatchApproval = (approve: boolean) => {
    const unapprovedItems = piiItems.filter(item => item.approved !== approve)
    
    setPiiItems(prev => prev.map(item => ({ ...item, approved: approve })))
    
    toast.success(
      `${unapprovedItems.length} items ${approve ? 'goedgekeurd' : 'geweigerd'}`,
      { icon: approve ? '✅' : '❌' }
    )
  }

  const handleReprocess = () => {
    setIsProcessing(true)
    
    // Log reprocessing request
    logMaskingRequested(id || 'unknown', 'reprocess')
    
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 3000)),
      {
        loading: 'Document opnieuw verwerken...',
        success: 'Document succesvol herverwerkt!',
        error: 'Fout bij herverwerken'
      }
    ).finally(() => setIsProcessing(false))
  }

  const handleDownload = () => {
    const approvedCount = piiItems.filter(item => item.approved).length
    if (approvedCount === 0) {
      toast.error('Goedkeuring vereist voor tenminste één PII item')
      return
    }
    
    // Log download request
    logDownloadRequested(id || 'unknown', 'anonymized')
    
    toast.success(`Document gedownload met ${approvedCount} geanonimiseerde items`)
  }



  const getTypeLabel = (type: PIIHighlight['type']) => {
    const labels = {
      name: 'Naam',
      email: 'E-mail', 
      phone: 'Telefoon',
      address: 'Adres',
      bsn: 'BSN',
      other: 'Overig'
    }
    return labels[type]
  }

  const getTypeColor = (type: PIIHighlight['type']) => {
    const colors = {
      name: 'bg-blue-100 text-blue-800 border-blue-300',
      email: 'bg-green-100 text-green-800 border-green-300',
      phone: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
      address: 'bg-purple-100 text-purple-800 border-purple-300',
      bsn: 'bg-red-100 text-red-800 border-red-300',
      other: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return colors[type]
  }

  const approvedCount = piiItems.filter(item => item.approved).length
  const totalCount = piiItems.length

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Document laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/audit')}
            className="btn btn-ghost mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {document.name}
            </h1>
            <p className="text-neutral-600">
              Verwerkt op {new Date(document.processedAt).toLocaleString('nl-NL')} • {document.originalSize}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReprocess}
            disabled={isProcessing}
            className="btn btn-outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Herverwerken
          </button>
          
          <button
            onClick={handleDownload}
            className="btn btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download ({approvedCount}/{totalCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                 {/* PDF Viewer */}
         <div className="xl:col-span-3">
           <PDFViewer
             file={document.url}
             highlights={piiItems}
             showOriginal={showOriginal}
             onToggleOriginal={() => setShowOriginal(!showOriginal)}
             onHighlightClick={handleHighlightClick}
             onApprovalToggle={handleApprovalToggle}
             className="min-h-[800px]"
           />
         </div>

        {/* PII Control Panel */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                PII Overzicht
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Totaal gevonden:</span>
                  <span className="font-semibold">{totalCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Goedgekeurd:</span>
                  <span className="font-semibold text-green-600">{approvedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Te beoordelen:</span>
                  <span className="font-semibold text-orange-600">{totalCount - approvedCount}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(approvedCount / totalCount) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  {Math.round((approvedCount / totalCount) * 100)}% goedgekeurd
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Snelle acties
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleBatchApproval(true)}
                  className="w-full btn btn-outline btn-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Alles goedkeuren
                </button>
                
                <button
                  onClick={() => handleBatchApproval(false)}
                  className="w-full btn btn-outline btn-sm"
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  Alles weigeren
                </button>
                

                
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="w-full btn btn-outline btn-sm"
                >
                  {showOriginal ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Verberg origineel
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Toon origineel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* PII Items List */}
          <div className="card">
            <div className="px-6 py-4 border-b border-neutral-200">
                             <h3 className="text-lg font-semibold text-neutral-900">
                 PII Items ({piiItems.length})
               </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Klik op een item om het in het document te selecteren
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {piiItems.map(item => (
                <div
                  key={item.id}
                  className={`px-6 py-4 border-b border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    selectedItem === item.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => handleHighlightClick(item.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(item.type)}`}>
                          {getTypeLabel(item.type)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-neutral-900 font-medium">
                          {showOriginal ? item.original : item.masked}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Pagina {item.position.page}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprovalToggle(item.id)
                      }}
                      className={`ml-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        item.approved 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {item.approved ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentReview 