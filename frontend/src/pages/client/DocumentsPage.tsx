import { useEffect, useRef, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import axios from 'axios'

const ocr = axios.create({ baseURL: 'http://localhost:9001/api' })

interface Doc {
  id: string
  documentType: string
  fileUrl: string
  verified: boolean
}

const DOCUMENT_TYPES: Record<string, string> = {
  ID_CARD: 'Carte nationale d\'identité',
  PASSPORT: 'Passeport',
  PROOF_OF_ADDRESS: 'Justificatif de domicile',
  INCOME_PROOF: 'Justificatif de revenus',
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [pageError, setPageError] = useState('')
  const [loadingDocs, setLoadingDocs] = useState(true)

  const [documentType, setDocumentType] = useState('ID_CARD')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [submitError, setSubmitError] = useState('')

  const fetchDocs = (custId: string) =>
    api.get(`/customers/${custId}`)
      .then((r) => setDocs(r.data.documents ?? []))
      .catch(() => {})

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        if (!data.linkedCustomerId) {
          setPageError('Aucun profil client associé à votre compte.')
          return
        }
        setCustomerId(data.linkedCustomerId)
        return fetchDocs(data.linkedCustomerId)
      })
      .catch(() => setPageError('Impossible de charger vos documents.'))
      .finally(() => setLoadingDocs(false))
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setSubmitMsg('')
    setSubmitError('')
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit() {
    if (!customerId || !selectedFile) return
    setSubmitting(true)
    setSubmitError('')
    setSubmitMsg('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const { data: ocrData } = await ocr.post('/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30_000,
      })

      const { data: docData } = await api.post('/documents', {
        customerId,
        documentType,
        fileUrl: ocrData.fileUrl || `local:${selectedFile.name}`,
      })

      await api.post(`/documents/${docData.id}/process`, {
        confidence: ocrData.confidence / 100,
        rawText: ocrData.rawText,
      })

      setSubmitMsg('Document soumis avec succès. Il sera analysé et vous serez informé du résultat.')
      setSelectedFile(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      fetchDocs(customerId)
    } catch (err: any) {
      const msg = err.code === 'ERR_NETWORK'
        ? 'Service OCR indisponible (port 9001). Vérifiez que le service est démarré.'
        : (err.response?.data?.message ?? err.response?.data?.detail ?? 'Erreur lors de la soumission.')
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Soumettre un document KYC" className="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de document</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(DOCUMENT_TYPES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Image du document <span className="text-slate-400 font-normal">(JPG, PNG, WEBP)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {preview && selectedFile?.type.startsWith('image/') && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={preview} alt="Aperçu" className="w-full max-h-48 object-contain" />
            </div>
          )}

          {submitMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              {submitMsg}
            </div>
          )}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedFile || submitting}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
          >
            {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? 'Soumission en cours…' : 'Soumettre le document'}
          </button>

          {pageError && <p className="text-red-500 text-sm">{pageError}</p>}
        </div>
      </Card>

      <Card title="Mes documents soumis">
        {loadingDocs ? (
          <p className="text-slate-400 text-sm">Chargement…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b text-xs">
                <th className="pb-2">Type</th>
                <th className="pb-2">Fichier</th>
                <th className="pb-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 font-medium">{DOCUMENT_TYPES[d.documentType] ?? d.documentType}</td>
                  <td className="py-2 text-slate-500 text-xs truncate max-w-xs font-mono">
                    {d.fileUrl.replace('local:', '')}
                  </td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${d.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {d.verified ? '✓ Vérifié' : '⏳ En cours de vérification'}
                    </span>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-slate-400 text-center text-sm">
                    Aucun document soumis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
