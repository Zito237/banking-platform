// Documents : soumission + liste des documents du client (KYC)
import { useEffect, useState, FormEvent } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Doc { id: string; documentType: string; fileUrl: string; verified: boolean }

const DOCUMENT_TYPES = ['ID_CARD', 'PASSPORT', 'PROOF_OF_ADDRESS', 'INCOME_PROOF']

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0])
  const [fileUrl, setFileUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchDocs = (custId: string) =>
    api.get(`/customers/${custId}`).then((r) => setDocs(r.data.documents ?? []))

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        if (!data.linkedCustomerId) {
          setError('Aucun profil client n\'est encore associé à votre compte.')
          return
        }
        setCustomerId(data.linkedCustomerId)
        return fetchDocs(data.linkedCustomerId)
      })
      .catch(() => setError('Impossible de charger vos documents.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    if (!customerId) return
    try {
      await api.post('/documents', { customerId, documentType, fileUrl })
      setMsg('Document soumis avec succès.')
      setFileUrl('')
      fetchDocs(customerId)
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(typeof message === 'string' ? message : 'Impossible de soumettre le document.')
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Soumettre un document" className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de document</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL / référence du fichier</label>
            <input
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!customerId}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Envoyer
          </button>
        </form>
      </Card>

      <Card title="Mes documents">
        {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b">
                <th className="pb-2">Type</th>
                <th className="pb-2">Fichier</th>
                <th className="pb-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2">{d.documentType}</td>
                  <td className="py-2 text-slate-500 truncate max-w-xs">{d.fileUrl}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${d.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {d.verified ? 'Vérifié' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-slate-400 text-center">Aucun document.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
