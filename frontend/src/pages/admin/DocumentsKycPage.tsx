import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import { parseError } from '../../api/parseError'

interface Doc {
  id: string
  documentType: string
  fileUrl: string
  verified: boolean
  customerId: string
  customerName: string
}

export default function DocumentsKycPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending')

  const fetchDocs = () =>
    api.get('/documents')
      .then((r) => setDocs(r.data))
      .catch(() => setError('Impossible de charger les documents.'))
      .finally(() => setLoading(false))

  useEffect(() => { fetchDocs() }, [])

  async function handleVerify(id: string) {
    setVerifying(id)
    try {
      await api.patch(`/documents/${id}/verify`)
      setDocs((prev) => prev.map((d) => d.id === id ? { ...d, verified: true } : d))
    } catch (err: any) {
      setError(parseError(err, 'Impossible de valider le document.'))
    } finally {
      setVerifying(null)
    }
  }

  const filtered = docs.filter((d) =>
    filter === 'all' ? true : filter === 'pending' ? !d.verified : d.verified
  )

  const pending = docs.filter((d) => !d.verified).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(['pending', 'verified', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'pending' ? `En attente (${pending})` : f === 'verified' ? 'Validés' : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Card title="Documents soumis par les clients">
        {loading ? (
          <p className="text-slate-400 text-sm">Chargement...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b">
                <th className="pb-2">Client</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Référence fichier</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{d.customerName || '—'}</td>
                  <td className="py-2 text-slate-500">{d.documentType}</td>
                  <td className="py-2 text-slate-400 text-xs truncate max-w-xs">{d.fileUrl}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {d.verified ? 'Validé' : 'En attente'}
                    </span>
                  </td>
                  <td className="py-2">
                    {!d.verified && (
                      <button
                        onClick={() => handleVerify(d.id)}
                        disabled={verifying === d.id}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {verifying === d.id ? '...' : 'Valider'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-400 text-center text-sm">
                    {filter === 'pending' ? 'Aucun document en attente.' : 'Aucun document.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Comment fonctionne la validation ?">
        <div className="text-xs text-slate-500 space-y-1.5">
          <p><span className="font-medium text-slate-700">Automatique (OCR) :</span> Quand le service Python OCR tourne, il traite le document automatiquement via RabbitMQ et met à jour le statut si la confiance est ≥ 70%.</p>
          <p><span className="font-medium text-slate-700">Manuelle (admin) :</span> Cliquer sur "Valider" marque le document comme vérifié et passe le KYC du client à VERIFIED.</p>
          <p><span className="font-medium text-slate-700">Effet :</span> Quand le KYC est VERIFIED, le client peut accéder à toutes les fonctionnalités (prêts, transferts inter-opérateurs).</p>
        </div>
      </Card>
    </div>
  )
}
