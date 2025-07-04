import { useState, useCallback, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ZoomIn, ZoomOut, RotateCw, Download, Eye, EyeOff } from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Set up PDF.js worker - try local first, fallback to CDN
try {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString()
} catch (error) {
  // Fallback for development
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
}

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

interface PDFViewerProps {
  file?: string | File
  highlights: PIIHighlight[]
  showOriginal: boolean
  onToggleOriginal: () => void
  onHighlightClick: (highlightId: string) => void
  onApprovalToggle: (highlightId: string) => void
  className?: string
}

const PDFViewer = ({
  file,
  highlights,
  showOriginal,
  onToggleOriginal,
  onHighlightClick,
  onApprovalToggle,
  className = ''
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [textLayerItems, setTextLayerItems] = useState<any[]>([])
  const [detectedPositions, setDetectedPositions] = useState<Map<string, any>>(new Map())
  const pageRef = useRef<HTMLDivElement>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF loading error:', error)
    setIsLoading(false)
  }, [])

  // Handle page size updates and text extraction
  const onPageLoadSuccess = useCallback(async (page: any) => {
    const viewport = page.getViewport({ scale: 1, rotation: 0 })
    setPageSize({ width: viewport.width, height: viewport.height })

    try {
      // Extract text content with positions
      const textContent = await page.getTextContent()
      setTextLayerItems(textContent.items || [])
      
      // Find positions for our PII highlights
      const positions = new Map()
      
      highlights.forEach(highlight => {
        if (highlight.position.page === currentPage) {
          // Search for exact text match in textContent
          const searchText = highlight.original.toLowerCase()
          
          for (let i = 0; i < textContent.items.length; i++) {
            const item = textContent.items[i]
            if (!item.str) continue
            
            const itemText = item.str.toLowerCase()
            const index = itemText.indexOf(searchText)
            
            if (index !== -1) {
              // Found the text within this item
              const transform = item.transform
              const fontSize = Math.abs(transform[0]) // Use absolute value for font size
              
              // More accurate character width calculation
              const textWidth = item.width || (item.str.length > 0 ? item.str.length * fontSize * 0.55 : searchText.length * fontSize * 0.55)
              const charWidth = textWidth / item.str.length
              
              // Calculate position offset for the found text
              const textBeforeTarget = itemText.substring(0, index)
              let offsetX = 0
              
              // More accurate offset calculation
              if (textBeforeTarget.length > 0) {
                offsetX = textBeforeTarget.length * charWidth
              }
              
              const x = transform[4] + offsetX
              const y = viewport.height - transform[5] // Flip Y coordinate
              const width = searchText.length * charWidth
              const height = fontSize
              
              positions.set(highlight.id, {
                x: x,
                y: y - height, // Adjust for text baseline
                width: width,
                height: height
              })
              break // Found it, stop searching
            }
          }
          
          // If not found in single items, try to find across multiple items
          if (!positions.has(highlight.id)) {
            let fullText = ''
            let textItems = []
            
            // Build full text from consecutive items
            for (let i = 0; i < textContent.items.length; i++) {
              const item = textContent.items[i]
              if (item.str) {
                fullText += item.str
                textItems.push({
                  text: item.str,
                  transform: item.transform,
                  width: item.width || item.str.length * Math.abs(item.transform[0]) * 0.55,
                  startIndex: fullText.length - item.str.length
                })
              }
            }
            
            // Search in full text
            const fullTextLower = fullText.toLowerCase()
            const searchIndex = fullTextLower.indexOf(searchText)
            
            if (searchIndex !== -1) {
              // Find which text item contains the start of our search text
              for (const textItem of textItems) {
                if (searchIndex >= textItem.startIndex && 
                    searchIndex < textItem.startIndex + textItem.text.length) {
                  
                  const localIndex = searchIndex - textItem.startIndex
                  const transform = textItem.transform
                  const fontSize = Math.abs(transform[0])
                  const charWidth = textItem.width / textItem.text.length
                  
                  const offsetX = localIndex * charWidth
                  const x = transform[4] + offsetX
                  const y = viewport.height - transform[5]
                  const width = searchText.length * charWidth
                  const height = fontSize
                  
                  positions.set(highlight.id, {
                    x: x,
                    y: y - height,
                    width: width,
                    height: height
                  })
                  break
                }
              }
            }
          }
        }
      })
      
      setDetectedPositions(positions)
    } catch (error) {
      console.warn('Could not extract text content:', error)
    }
  }, [highlights, currentPage])

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const getHighlightColor = (type: PIIHighlight['type'], approved: boolean) => {
    const colors = {
      name: approved ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      email: approved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
      phone: approved ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      address: approved ? 'rgba(139, 92, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      bsn: approved ? 'rgba(220, 38, 127, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      other: approved ? 'rgba(107, 114, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'
    }
    return colors[type]
  }

  const getBorderColor = (type: PIIHighlight['type'], approved: boolean) => {
    const colors = {
      name: approved ? '#3B82F6' : '#EF4444',
      email: approved ? '#10B981' : '#F59E0B',
      phone: approved ? '#F59E0B' : '#EF4444',
      address: approved ? '#8B5CF6' : '#EF4444',
      bsn: approved ? '#DC2678' : '#EF4444',
      other: approved ? '#6B7280' : '#EF4444'
    }
    return colors[type]
  }

  const getTypeLabel = (type: PIIHighlight['type']) => {
    const labels = {
      name: 'NAAM',
      email: 'EMAIL',
      phone: 'TEL',
      address: 'ADRES',
      bsn: 'BSN',
      other: 'PII'
    }
    return labels[type]
  }

  // Get position from detected positions or fallback to manual
  const getHighlightPosition = (highlight: PIIHighlight) => {
    const detected = detectedPositions.get(highlight.id)
    if (detected) {
      return {
        x: detected.x * scale,
        y: detected.y * scale,
        width: detected.width * scale,
        height: detected.height * scale
      }
    }
    // Fallback to manual coordinates
    return {
      x: highlight.position.x * scale,
      y: highlight.position.y * scale,
      width: highlight.position.width * scale,
      height: highlight.position.height * scale
    }
  }

  if (!file) {
    return (
      <div className={`bg-neutral-100 rounded-lg p-8 text-center min-h-[600px] flex items-center justify-center border-2 border-dashed border-neutral-300 ${className}`}>
        <div>
          <div className="w-16 h-16 bg-neutral-300 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-neutral-600 text-lg font-medium">Geen document geselecteerd</p>
          <p className="text-neutral-500 text-sm mt-2">Upload een document om de PDF preview te zien</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col ${className}`}>
      {/* PDF Controls */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-medium text-neutral-900">
              Document Preview
            </h3>
            {numPages > 0 && (
              <span className="text-xs text-neutral-500">
                Pagina {currentPage} van {numPages}
              </span>
            )}
            {detectedPositions.size > 0 && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                {detectedPositions.size} posities gedetecteerd
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Page Navigation */}
            {numPages > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= numPages) {
                      setCurrentPage(page)
                    }
                  }}
                  className="w-12 px-1 py-0.5 text-xs text-center border border-neutral-300 rounded"
                />
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
                  disabled={currentPage >= numPages}
                  className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            )}
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border-l border-neutral-300 pl-2">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom uit"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-neutral-600 px-2">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3.0}
                className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            
            {/* Rotate */}
            <button
              onClick={handleRotate}
              className="p-1 text-neutral-400 hover:text-neutral-600"
              title="Roteren"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            
            {/* Show/Hide Original */}
            <button
              onClick={onToggleOriginal}
              className={`p-1 rounded ${showOriginal ? 'text-primary bg-primary/10' : 'text-neutral-400 hover:text-neutral-600'}`}
              title={showOriginal ? 'Verberg origineel' : 'Toon origineel'}
            >
              {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative overflow-auto flex-1 min-h-[600px] bg-neutral-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-neutral-600">PDF laden...</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-center p-4">
          <div className="relative inline-block shadow-lg" ref={pageRef}>
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onLoadSuccess={onPageLoadSuccess}
              />
            </Document>
            
            {/* Smart PII Highlights Overlay */}
            {pageSize.width > 0 && pageSize.height > 0 && (
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width="100%"
                height="100%"
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              >
                {highlights
                  .filter(h => h.position.page === currentPage)
                  .map(highlight => {
                    const pos = getHighlightPosition(highlight)
                    return (
                      <g key={highlight.id}>
                        {/* Main highlight rectangle */}
                        <rect
                          x={pos.x}
                          y={pos.y}
                          width={pos.width}
                          height={pos.height}
                          fill={getHighlightColor(highlight.type, highlight.approved)}
                          stroke={getBorderColor(highlight.type, highlight.approved)}
                          strokeWidth="2"
                          rx="3"
                          className="cursor-pointer pointer-events-auto transition-all duration-200 hover:stroke-4"
                          onClick={() => onHighlightClick(highlight.id)}
                        />
                        
                        {/* Approval status icon */}
                        <circle
                          cx={pos.x + pos.width - 8}
                          cy={pos.y - 8}
                          r="8"
                          fill={highlight.approved ? '#10B981' : '#EF4444'}
                          className="pointer-events-none"
                        />
                        <text
                          x={pos.x + pos.width - 8}
                          y={pos.y - 4}
                          fontSize="10"
                          fontWeight="bold"
                          fill="white"
                          textAnchor="middle"
                          className="pointer-events-none select-none"
                        >
                          {highlight.approved ? '✓' : '×'}
                        </text>
                        
                        {/* Detection status indicator */}
                        {detectedPositions.has(highlight.id) && (
                          <circle
                            cx={pos.x - 10}
                            cy={pos.y + pos.height / 2}
                            r="4"
                            fill="#10B981"
                            className="pointer-events-none"
                          />
                        )}
                      </g>
                    )
                  })}
              </svg>
            )}
          </div>
        </div>
        
        {/* Status Bar */}
        {highlights.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">
                {highlights.filter(h => h.position.page === currentPage).length} PII items op deze pagina
                {detectedPositions.size > 0 && (
                  <span className="text-green-600 ml-2">
                    ({detectedPositions.size} automatisch gedetecteerd)
                  </span>
                )}
              </span>
              <span className="text-neutral-500">
                {showOriginal ? 'Originele versie' : 'Geanonimiseerde versie'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PDFViewer 