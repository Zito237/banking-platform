import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import Card from '../../components/Card'

// Appel direct au audit-service (port 9003, hors gateway)
const audit = axios.create({ baseURL: 'http://localhost:9003' })

interface AuditLog {
  id: string
  actor: string
  action: string
  resource: string
  routingKey?: string
  timestamp: string
}

interface Pagination {
  page: number
  totalPages: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

const RESOURCE_COLORS: Record<string, string> = {
  transaction: 'bg-blue-100 text-blue-700',
  loan: 'bg-emerald-100 text-emerald-700',
  user: 'bg-violet-100 text-violet-700',
  manual: 'bg-slate-100 text-slate-600',
}

const RESOURCES = ['', 'transaction', 'loan', 'user']

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filtres
  const [resource, setResource] = useState('')
  const [actor, setActor] = useState('')
  const [page, setPage] = useState(1)
  const now = new Date()
  const [fromDate, setFromDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  )
  const [toDate, setToDate] = useState(now.toISOString().slice(0, 10))

  const fetchLogs = useCallback(async (pg = 1) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { page: pg, limit: 20 }
      if (resource) params.resource = resource
      if (actor.trim()) params.actor = actor.trim()
      if (fromDate) params.from = fromDate + 'T00:00:00.000Z'
      if (toDate) params.to = toDate + 'T23:59:59.999Z'

      const { data } = await audit.get('/audit', { params })
      setLogs(data.data)
      setPagination(data.pagination)
    } catch {
      setError('Service d\'audit indisponible (port 9003).')
    } finally {
      setLoading(false)
    }
  }, [resource, actor, fromDate, toDate])

  useEffect(() => { fetchLogs(1) }, [])

  function handleFilter() {
    setPage(1)
    fetchLogs(1)
  }

  function goToPage(p: number) {
    setPage(p)
    fetchLogs(p)
  }

  function resourceBadge(res: string) {
    const cls = RESOURCE_COLORS[res] ?? 'bg-slate-100 text-slate-600'
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
        {res.toUpperCase()}
      </span>
    )
  }

  function actorBadge(actor: string) {
    const [type, id] = actor.split(':')
    return (
      <span className="font-mono text-xs text-slate-600">
        <span className="text-slate-400">{type}:</span>
        {id ? id.slice(0, 8) + (id.length > 8 ? '…' : '') : '?'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Journal d'audit</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Traçabilité de toutes les opérations de la plateforme
          {pagination && <span className="ml-2 font-medium text-slate-600">({pagination.total} entrées)</span>}
        </p>
      </div>

      {/* Filtres */}
      <Card title="Filtres">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Ressource</label>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {RESOURCES.map((r) => (
                <option key={r} value={r}>{r || 'Toutes'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Acteur (ID partiel)</label>
            <input
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="ex: client:"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Du</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Au</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Filtrer
          </button>
          <button
            onClick={() => { setResource(''); setActor(''); setPage(1); fetchLogs(1) }}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Réinitialiser
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card title="Événements">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">Chargement…</p>
        ) : error ? (
          <p className="text-sm text-red-500 text-center py-6">{error}</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b text-xs">
                  <th className="pb-2 pr-4">Date / Heure</th>
                  <th className="pb-2 pr-4">Ressource</th>
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 pr-4">Acteur</th>
                  <th className="pb-2">Routing Key</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2 pr-4">{resourceBadge(log.resource)}</td>
                    <td className="py-2 pr-4 font-medium text-slate-700 text-xs">{log.action}</td>
                    <td className="py-2 pr-4">{actorBadge(log.actor)}</td>
                    <td className="py-2 text-slate-400 text-xs font-mono">{log.routingKey ?? '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-slate-400 text-center text-sm">
                      Aucune entrée d'audit pour ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Page {pagination.page} / {pagination.totalPages} — {pagination.total} résultats
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                  >
                    ← Précédent
                  </button>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
