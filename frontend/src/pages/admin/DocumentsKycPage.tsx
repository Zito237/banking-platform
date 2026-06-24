import React, { useEffect, useState } from 'react'
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
  ocrConfidence?: number
  rejected?: boolean
}

const DOC_TYPES: Record<string, string> = {
  ID_CARD: 'CNI',
  PASSPORT: 'Passeport',
  PROOF_OF_ADDRESS: 'Domicile',
  INCOME_PROOF: 'Revenus',
}

export default function DocumentsKycPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending')
  const [viewingDoc, setViewingDoc] = useState<string | null>(null)

  const fetchDocs = () =>
    api.get('/documents')
      .then((r) => setDocs(r.data))
      .catch(() => setError('Impossible de charger les documents.'))
      .finally(() => setLoading(false))

  useEffect(() => { fetchDocs() }, [])

  async function handleVerify(id: string) {
    setActionLoading(id)
    try {
      await api.patch(`/documents/${id}/verify`)
      setDocs((prev) => prev.map((d) => d.id === id ? { ...d, verified: true } : d))
      setViewingDoc(null)
    } catch (err: any) {
      setError(parseError(err, 'Impossible de valider le document.'))
    } finally {
      setActionLoading(null)
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
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">
            {filter === 'pending' ? 'Aucun document en attente.' : 'Aucun document.'}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => {
              const confidence = d.ocrConfidence != null ? Math.round(d.ocrConfidence * 100) : null
              const isOpen = viewingDoc === d.id

              return (
                <div key={d.id} className={`rounded-xl border p-4 ${
                  d.verified
                    ? 'border-green-200 bg-green-50'
                    : confidence != null && confidence < 70
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{d.customerName || '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {DOC_TYPES[d.documentType] ?? d.documentType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {confidence != null && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          confidence >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          OCR : {confidence}%
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        d.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {d.verified
                          ? (confidence != null && confidence >= 70 ? 'Auto-validé' : 'Validé manuellement')
                          : 'En attente'}
                      </span>
                    </div>
                  </div>

                  {!d.verified && (
                    <div className="mt-3">
                      <button
                        onClick={() => setViewingDoc(isOpen ? null : d.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {isOpen ? '▲ Masquer le document' : '▼ Voir le document'}
                      </button>
                    </div>
                  )}

                  {isOpen && (
                    <div className="mt-3 space-y-3">
                      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                        {d.fileUrl.startsWith('http') ? (
                          <img
                            src={d.fileUrl}
                            alt="Document KYC"
                            className="w-full max-h-96 object-contain"
                          />
                        ) : (
                          <div className="p-6 text-center text-slate-400 text-sm">
                            Aperçu non disponible pour les anciens documents.
                            <br />
                            <span className="text-xs font-mono">{d.fileUrl}</span>
                          </div>
                        )}
                      </div>

                      {confidence != null && (
                        <p className="text-sm text-slate-500">
                          Score de confiance OCR : <span className={`font-bold ${confidence >= 70 ? 'text-green-600' : 'text-orange-600'}`}>{confidence}%</span>
                          {confidence < 70 && ' — confiance insuffisante, vérifiez visuellement avant de valider.'}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerify(d.id)}
                          disabled={actionLoading === d.id}
                          className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {actionLoading === d.id ? 'Validation...' : 'Valider le document'}
                        </button>
                        <button
                          onClick={() => {
                            setDocs((prev) => prev.filter((doc) => doc.id !== d.id))
                            setViewingDoc(null)
                          }}
                          className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 transition"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
