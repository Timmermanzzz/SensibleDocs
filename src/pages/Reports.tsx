import { useState, useEffect } from 'react'
import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react'
import { useAuditLogger } from '../hooks/useAuditLogger'
import toast from 'react-hot-toast'

const Reports = () => {
  const { logPageVisit, logEvent } = useAuditLogger()
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  useEffect(() => {
    logPageVisit('Reports')
  }, [])

  const periods = [
    { value: 'week', label: 'Deze week' },
    { value: 'month', label: 'Deze maand' },
    { value: 'quarter', label: 'Dit kwartaal' },
    { value: 'year', label: 'Dit jaar' }
  ]

  const reportData = {
    totalDocuments: 1247,
    processedSuccessfully: 1189,
    avgProcessingTime: '3.2 min',
    piiItemsFound: 15637
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Rapporten & Analytics
        </h1>
        <p className="text-neutral-600">
          Inzicht in documentverwerking, compliance en gebruik van het systeem.
        </p>
      </div>

      {/* Period selector */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-neutral-600" />
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value)
                logEvent({
                  eventType: 'report_period_changed',
                  action: 'Report period filter changed',
                  details: { period: e.target.value }
                })
              }}
              className="input"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              logEvent({
                eventType: 'report_downloaded',
                action: 'Report downloaded',
                details: { period: selectedPeriod, format: 'pdf' }
              })
              toast.success('Rapport wordt gedownload...')
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Rapport downloaden
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Totaal documenten</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {reportData.totalDocuments.toLocaleString()}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Succesvol verwerkt</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {reportData.processedSuccessfully.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Gem. verwerkingstijd</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {reportData.avgProcessingTime}
              </p>
            </div>
            <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">PII items gevonden</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {reportData.piiItemsFound.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 bg-error/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-error" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">
              Verwerking per dag
            </h3>
          </div>
          <div className="p-6">
            <div className="bg-neutral-100 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
              <div>
                <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">Grafiek wordt hier weergegeven</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">
              PII types gevonden
            </h3>
          </div>
          <div className="p-6">
            <div className="bg-neutral-100 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
              <div>
                <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">Grafiek wordt hier weergegeven</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports 