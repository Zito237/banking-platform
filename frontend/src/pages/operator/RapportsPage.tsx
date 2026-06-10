// Opérateur : rapports
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Report { id: string; type: string; generatedAt: string; summary: string }

export default function RapportsPage() {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    api.get('/reports/operator').then((r) => setReports(r.data)).catch(() => setReports([]))
  }, [])

  return (
    <Card title="Rapports">
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">{r.type}</span>
              <span className="text-xs text-slate-400">{new Date(r.generatedAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{r.summary}</p>
          </div>
        ))}
        {reports.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Aucun rapport disponible.</p>}
      </div>
    </Card>
  )
}
