import { useEffect, useRef, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import axios from 'axios'

// Appel direct au service OCR (port 9001, hors gateway)
const ocr = axios.create({ baseURL: 'http://localhost:9001/api' })

interface OcrFields { nom?: string; prenom?: string; dateNaissance?: string; numeroDocument?: string }
interface OcrResult { confidence: number; fields: OcrFields; rawText: string; engine: string }
interface Doc { id: string; documentType: string; fileUrl: string; verified: boolean }

const DOCUMENT_TYPES: Record<string, string> = {
  ID_CARD: 'Carte nationale d\'identité',
  PASSPORT: 'Passeport',
  PROOF_OF_ADDRESS: 'Justificatif de domicile',
  INCOME_PROOF: 'Justificatif de revenus',
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value)
  const ok = pct >= 70
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ok ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
      {ok ? '✓' : '⚠'} Confiance : {pct}%
    </span>
  )
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [pageError, setPageError] = useState('')
  const [loadingDocs, setLoadingDocs] = useState(true)

  // Formulaire
  const [documentType, setDocumentType] = useState('ID_CARD')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Étapes : 'pick' → 'analyzing' → 'ocr-done' → 'submitting' → 'done'
  const [step, setStep] = useState<'pick' | 'analyzing' | 'ocr-done' | 'submitting'>('pick')
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [ocrError, setOcrError] = useState('')
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
    setOcrResult(null)
    setOcrError('')
    setSubmitMsg('')
    setSubmitError('')
    setStep('pick')
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  async function handleAnalyze() {
    if (!selectedFile) return
    setStep('analyzing')
    setOcrError('')
    setOcrResult(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const { data } = await ocr.post('/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30_000,
      })
      setOcrResult(data)
      setStep('ocr-done')
    } catch (err: any) {
      const msg = err.code === 'ERR_NETWORK'
        ? 'Service OCR indisponible (port 9001). Vérifiez que le service est démarré.'
        : (err.response?.data?.detail ?? 'Erreur lors de l\'analyse OCR.')
      setOcrError(msg)
      setStep('pick')
    }
  }

  async function handleSubmit() {
    if (!customerId || !selectedFile || !ocrResult) return
    setStep('submitting')
    setSubmitError('')
    setSubmitMsg('')

    try {
      // 1. Sauvegarder la référence du document (nom du fichier comme référence)
      const { data: docData } = await api.post('/documents', {
        customerId,
        documentType,
        fileUrl: `local:${selectedFile.name}`,
      })

      // 2. Appliquer le résultat OCR directement (sans RabbitMQ)
      await api.post(`/documents/${docData.id}/process`, {
        confidence: ocrResult.confidence / 100,
        rawText: ocrResult.rawText,
      })

      setSubmitMsg(`Document soumis avec succès. KYC ${ocrResult.confidence >= 70 ? 'VÉRIFIÉ ✓' : 'REJETÉ — qualité insuffisante'}`)
      setSelectedFile(null)
      setPreview(null)
      setOcrResult(null)
      setStep('pick')
      if (fileRef.current) fileRef.current.value = ''
      fetchDocs(customerId)
    } catch (err: any) {
      setSubmitError(err.response?.data?.message ?? 'Erreur lors de la soumission.')
      setStep('ocr-done')
    }
  }

  function reset() {
    setSelectedFile(null)
    setPreview(null)
    setOcrResult(null)
    setOcrError('')
    setSubmitMsg('')
    setSubmitError('')
    setStep('pick')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <Card title="Soumettre un document KYC" className="max-w-lg">
        <div className="space-y-4">
          {/* Type de document */}
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

          {/* Sélecteur de fichier */}
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

          {/* Prévisualisation */}
          {preview && selectedFile?.type.startsWith('image/') && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={preview} alt="Aperçu" className="w-full max-h-48 object-contain" />
            </div>
          )}
          {selectedFile && !selectedFile.type.startsWith('image/') && (
            <p className="text-sm text-orange-500">Seules les images sont acceptées par l'analyseur OCR.</p>
          )}

          {/* Erreur OCR */}
          {ocrError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {ocrError}
            </div>
          )}

          {/* Résultat OCR */}
          {ocrResult && step === 'ocr-done' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Résultats de l'analyse OCR</p>
                <ConfidenceBadge value={ocrResult.confidence} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {ocrResult.fields.nom && (
                  <div>
                    <p className="text-xs text-slate-400">Nom</p>
                    <p className="font-medium text-slate-700">{ocrResult.fields.nom}</p>
                  </div>
                )}
                {ocrResult.fields.prenom && (
                  <div>
                    <p className="text-xs text-slate-400">Prénom</p>
                    <p className="font-medium text-slate-700">{ocrResult.fields.prenom}</p>
                  </div>
                )}
                {ocrResult.fields.dateNaissance && (
                  <div>
                    <p className="text-xs text-slate-400">Date de naissance</p>
                    <p className="font-medium text-slate-700">{ocrResult.fields.dateNaissance}</p>
                  </div>
                )}
                {ocrResult.fields.numeroDocument && (
                  <div>
                    <p className="text-xs text-slate-400">N° document</p>
                    <p className="font-medium font-mono text-slate-700">{ocrResult.fields.numeroDocument}</p>
                  </div>
                )}
              </div>
              {Object.keys(ocrResult.fields).length === 0 && (
                <p className="text-xs text-slate-400 italic">Aucun champ structuré extrait — vérifiez la qualité de l'image.</p>
              )}
              {ocrResult.rawText && (
                <details className="mt-1">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Texte brut extrait</summary>
                  <pre className="mt-2 text-xs text-slate-500 whitespace-pre-wrap bg-white border border-slate-100 rounded p-2 max-h-28 overflow-auto">
                    {ocrResult.rawText}
                  </pre>
                </details>
              )}
              <p className="text-xs text-slate-400">
                Moteur : {ocrResult.engine} &nbsp;·&nbsp;
                {ocrResult.confidence >= 70
                  ? 'La confiance est suffisante — le document sera marqué comme VÉRIFIÉ.'
                  : 'La confiance est insuffisante — le document sera marqué comme REJETÉ.'}
              </p>
            </div>
          )}

          {/* Messages succès/erreur soumission */}
          {submitMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              {submitMsg}
            </div>
          )}
          {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

          {/* Boutons */}
          <div className="flex gap-3">
            {step === 'pick' && (
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition"
              >
                Analyser le document
              </button>
            )}
            {step === 'analyzing' && (
              <button disabled className="flex-1 bg-blue-400 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyse en cours…
              </button>
            )}
            {step === 'ocr-done' && (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={!customerId}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition"
                >
                  Soumettre le document
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition"
                >
                  Annuler
                </button>
              </>
            )}
            {step === 'submitting' && (
              <button disabled className="flex-1 bg-green-400 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours…
              </button>
            )}
          </div>

          {pageError && <p className="text-red-500 text-sm">{pageError}</p>}
        </div>
      </Card>

      {/* Liste des documents */}
      <Card title="Mes documents soumis">
        {loadingDocs ? (
          <p className="text-slate-400 text-sm">Chargement…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b text-xs">
                <th className="pb-2">Type</th>
                <th className="pb-2">Fichier</th>
                <th className="pb-2">Statut KYC</th>
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
                      {d.verified ? '✓ Vérifié' : '⏳ En attente'}
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
