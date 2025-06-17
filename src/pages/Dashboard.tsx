import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Users,
  Shield,
  FolderOpen
} from 'lucide-react'
import { CardSkeleton } from '@components/LoadingSpinner'
import { useAuditLogger } from '../hooks/useAuditLogger'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'error'
}

const StatCard = ({ title, value, change, trend, icon: Icon, color }: StatCardProps) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success', 
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error'
  }

  const trendClasses = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-neutral-500'
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {change && trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`w-4 h-4 mr-1 ${trendClasses[trend]}`} />
              <span className={`text-sm ${trendClasses[trend]}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { logPageVisit } = useAuditLogger()
  const [isLoading] = useState(false)

  useEffect(() => {
    logPageVisit('Dashboard')
  }, [])

  const stats = [
    {
      title: 'Documenten deze maand',
      value: '1,247',
      change: '+12% t.o.v. vorige maand',
      trend: 'up' as const,
      icon: FileText,
      color: 'primary' as const
    },
    {
      title: 'Succesvol geanonimiseerd',
      value: '1,189',
      change: '95.3% success rate',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'success' as const
    },
    {
      title: 'In behandeling',
      value: '23',
      change: 'Gemiddeld 4 min wachttijd',
      trend: 'neutral' as const,
      icon: Clock,
      color: 'warning' as const
    },
    {
      title: 'Actieve gebruikers',
      value: '18',
      change: '+2 nieuwe gebruikers',
      trend: 'up' as const,
      icon: Users,
      color: 'primary' as const
    }
  ]

  const recentDocuments = [
    {
      id: '1',
      name: 'WOO-verzoek-2024-001.pdf',
      status: 'completed',
      processedAt: '2024-01-15T10:30:00Z',
      piiFound: 23,
      user: 'M. van der Berg'
    },
    {
      id: '2', 
      name: 'Besluit-subsidie-aanvraag.docx',
      status: 'processing',
      processedAt: '2024-01-15T09:45:00Z',
      piiFound: 0,
      user: 'J. Janssen'
    },
    {
      id: '3',
      name: 'Correspondentie-klacht-burger.pdf',
      status: 'completed',
      processedAt: '2024-01-15T08:20:00Z',
      piiFound: 15,
      user: 'S. Patel'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge-success">Voltooid</span>
      case 'processing':
        return <span className="badge-warning">Verwerken</span>
      case 'error':
        return <span className="badge-error">Fout</span>
      default:
        return <span className="badge-neutral">Onbekend</span>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="card p-6 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welkom bij Sensible Docs
            </h1>
            <p className="text-primary-100 mb-4">
              Uw documenten zijn veilig en compliant verwerkt volgens WOO-wetgeving
            </p>
            <div className="flex items-center space-x-3">
              <Link
                to="/projects"
                className="inline-flex items-center px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-primary-50 transition-colors"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Nieuw project starten
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Document uploaden
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <Shield className="w-24 h-24 text-white/20" />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent documents */}
      <div className="card">
        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Recent verwerkte documenten
            </h2>
            <Link
              to="/documents"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Alle bekijken →
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  PII Gevonden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Verwerkt door
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {recentDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-neutral-400 mr-3" />
                      <Link
                        to={`/document/${doc.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        {doc.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {doc.piiFound > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-warning mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-success mr-2" />
                      )}
                      <span className="text-sm text-neutral-900">
                        {doc.piiFound} items
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {doc.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {new Date(doc.processedAt).toLocaleDateString('nl-NL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 