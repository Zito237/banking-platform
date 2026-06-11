// Documents : upload + liste des documents du client
import { useEffect, useState, ChangeEvent } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Doc { id: string; fileName: string; status: string; createdAt: string }

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState('')

  const fetchDocs = () => api.get('/documents').then((r) => setDocs(r.data))
  useEffect(() => { fetchDocs() }, [])

  async function handleUpload() {
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    await api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    setMsg('Document envoyé.')
    setFile(null)
    fetchDocs()
  }

  return (
    <div className="space-y-6">
      <Card title="Uploader un document" className="max-w-md">
        <input
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
          className="block text-sm text-slate-600 mb-3"
        />
        {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}
        <button
          onClick={handleUpload}
          disabled={!file}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Envoyer
        </button>
      </Card>

      <Card title="Mes documents">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Fichier</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="py-2">{d.fileName}</td>
                <td className="py-2 text-slate-500">{d.status}</td>
                <td className="py-2 text-slate-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-slate-400 text-center">Aucun document.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
