import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import Card from '../../components/Card'

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
  transaction: 'badge-blue',
  loan:        'badge-green',
  user:        'badge-violet',
  manual:      'badge-slate',
}

const RESOURCES = ['', 'transaction', 'loan', 'user']

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
      setError("Service d'audit indisponible (port 9003).")
    } finally {
      setLoading(false)
    }
  }, [resource, actor, fromDate, toDate])

  useEffect(() => { fetchLogs(1) }, [])

  function handleFilter() { setPage(1); fetchLogs(1) }
  function goToPage(p: number) { setPage(p); fetchLogs(p) }

  function resourceBadge(res: string) {
    const cls = RESOURCE_COLORS[res] ?? 'badge-slate'
    return <span className={cls}>{res.toUpperCase()}</span>
  }

  function actorDisplay(a: string) {
    const [type, id] = a.split(':')
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
        <h1 className="page-title">Journal d'audit</h1>
        <p className="page-subtitle">
          Traçabilité de toutes les opérations de la plateforme
          {pagination && (
            <span className="ml-2 font-semibold text-slate-700">({pagination.total} entrées)</span>
          )}
        </p>
      </div>

      {/* Filtres */}
      <Card title="Filtres">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="form-label">Ressource</label>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="form-select w-36"
            >
              {RESOURCES.map((r) => (
                <option key={r} value={r}>{r || 'Toutes'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Acteur</label>
            <input
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="ex : client:"
              className="form-input w-40"
            />
          </div>

          <div>
            <label className="form-label">Du</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Au</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-input"
            />
          </div>

          <button onClick={handleFilter} className="btn-primary btn-md">
            Filtrer
          </button>
          <button
            onClick={() => { setResource(''); setActor(''); setPage(1); fetchLogs(1) }}
            className="btn-ghost btn-md"
          >
            Réinitialiser
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card title="Événements">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Chargement…</p>
        ) : error ? (
          <p className="text-sm text-red-500 text-center py-8">{error}</p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date / Heure</th>
                  <th>Ressource</th>
                  <th>Action</th>
                  <th>Acteur</th>
                  <th>Routing Key</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-slate-400 text-xs whitespace-nowrap pr-4">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="pr-4">{resourceBadge(log.resource)}</td>
                    <td className="font-medium text-slate-700 text-xs pr-4">{log.action}</td>
                    <td className="pr-4">{actorDisplay(log.actor)}</td>
                    <td className="text-slate-400 text-xs font-mono">{log.routingKey ?? '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-slate-400 text-center text-sm">
                      Aucune entrée d'audit pour ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Page {pagination.page} / {pagination.totalPages} — {pagination.total} résultats
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={!pagination.hasPrev}
                    className="btn-secondary btn-sm"
                  >
                    ← Précédent
                  </button>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={!pagination.hasNext}
                    className="btn-secondary btn-sm"
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
