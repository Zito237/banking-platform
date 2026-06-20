// Page de statut de tous les microservices (Java + Python)
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import api from '../api/axios'

interface ServiceStatus {
  name: string
  url: string
  port: number
  type: 'java' | 'python' | 'node'
  status: 'checking' | 'up' | 'down'
  detail?: string
}

const JAVA_SERVICES: Omit<ServiceStatus, 'status'>[] = [
  { name: 'API Gateway',         url: '/actuator/health', port: 8080, type: 'java' },
  { name: 'Auth Service',        url: '/auth/health',     port: 8081, type: 'java' },
  { name: 'Operator Service',    url: '/operators',       port: 8082, type: 'java' },
  { name: 'Account Service',     url: '/accounts/health', port: 8083, type: 'java' },
  { name: 'Customer Service',    url: '/customers/health',port: 8084, type: 'java' },
  { name: 'Transaction Service', url: '/transactions/health', port: 8085, type: 'java' },
  { name: 'Loan Service',        url: '/loans/health',    port: 8086, type: 'java' },
]

const PYTHON_SERVICES: Omit<ServiceStatus, 'status'>[] = [
  { name: 'OCR / IA Service',   url: 'http://localhost:9001/',    port: 9001, type: 'python' },
  { name: 'Reporting Service',  url: 'http://localhost:9004/',    port: 9004, type: 'python' },
]

const NODE_SERVICES: Omit<ServiceStatus, 'status'>[] = [
  { name: 'Notification Service', url: 'http://localhost:9002/health', port: 9002, type: 'node' },
  { name: 'Audit Service',        url: 'http://localhost:9003/health', port: 9003, type: 'node' },
]

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    ...JAVA_SERVICES.map((s) => ({ ...s, status: 'checking' as const })),
    ...PYTHON_SERVICES.map((s) => ({ ...s, status: 'checking' as const })),
    ...NODE_SERVICES.map((s) => ({ ...s, status: 'checking' as const })),
  ])

  const update = (port: number, status: 'up' | 'down', detail?: string) =>
    setServices((prev) => prev.map((s) => s.port === port ? { ...s, status, detail } : s))

  useEffect(() => {
    // Java services — via API Gateway (same origin, no CORS issue)
    JAVA_SERVICES.forEach(async (svc) => {
      try {
        await api.get(svc.url)
        update(svc.port, 'up')
      } catch (err: any) {
        const code = err?.response?.status
        // 401/403/400 = service répond (juste auth requise) = UP
        if (code && code < 500) update(svc.port, 'up', `HTTP ${code}`)
        else update(svc.port, 'down', err?.message)
      }
    })

    // Python services — appel direct (peut échouer si CORS non configuré)
    PYTHON_SERVICES.forEach(async (svc) => {
      try {
        await fetch(svc.url, { method: 'GET', mode: 'no-cors' })
        update(svc.port, 'up')
      } catch {
        update(svc.port, 'down', 'Non accessible depuis le navigateur')
      }
    })

    // Node.js services — appel direct avec CORS activé
    NODE_SERVICES.forEach(async (svc) => {
      try {
        const res = await fetch(svc.url)
        const json = await res.json()
        update(svc.port, json.status === 'UP' ? 'up' : 'down')
      } catch {
        update(svc.port, 'down')
      }
    })
  }, [])

  const badge = (s: ServiceStatus) => {
    if (s.status === 'checking') return <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500">⏳ Vérification...</span>
    if (s.status === 'up')       return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">✓ Actif</span>
    return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">✗ Inactif</span>
  }

  const java   = services.filter((s) => s.type === 'java')
  const python = services.filter((s) => s.type === 'python')
  const node   = services.filter((s) => s.type === 'node')

  return (
    <div className="space-y-6">
      <Card title="Services Java (Spring Boot)">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Service</th>
              <th className="pb-2">Port</th>
              <th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {java.map((s) => (
              <tr key={s.port} className="border-b last:border-0">
                <td className="py-2 font-medium">{s.name}</td>
                <td className="py-2 text-slate-500">{s.port}</td>
                <td className="py-2">{badge(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Services Python">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Service</th>
              <th className="pb-2">Port</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {python.map((s) => (
              <tr key={s.port} className="border-b last:border-0">
                <td className="py-2 font-medium">{s.name}</td>
                <td className="py-2 text-slate-500">{s.port}</td>
                <td className="py-2">{badge(s)}</td>
                <td className="py-2 text-xs text-slate-400">{s.detail ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-3">
          Les services Python communiquent via RabbitMQ — le statut "Actif" confirme que le port répond.
          Pour tester l'OCR : soumettre un document (image JPG/PNG) depuis la page <strong>Documents</strong>.
        </p>
      </Card>

      <Card title="Services Node.js (NestJS)">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Service</th>
              <th className="pb-2">Port</th>
              <th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {node.map((s) => (
              <tr key={s.port} className="border-b last:border-0">
                <td className="py-2 font-medium">{s.name}</td>
                <td className="py-2 text-slate-500">{s.port}</td>
                <td className="py-2">{badge(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-3">
          Notification Service (9002) : consomme les événements RabbitMQ et simule l'envoi de SMS/email.
          Audit Service (9003) : capture tous les événements RabbitMQ et les persiste pour la traçabilité admin.
        </p>
      </Card>

      <Card title="Architecture des communications">
        <div className="text-sm text-slate-600 space-y-1 font-mono text-xs bg-slate-50 rounded p-3">
          <p>Frontend (5173) → API Gateway (8080)</p>
          <p>API Gateway → Auth (8081) | Operator (8082) | Account (8083)</p>
          <p>API Gateway → Customer (8084) | Transaction (8085) | Loan (8086)</p>
          <p>Java Services → RabbitMQ (5672) → OCR Python (9001)</p>
          <p>Java Services → RabbitMQ (5672) → Reporting Python (9004)</p>
          <p>Java Services → RabbitMQ (5672) → Notification Node.js (9002)</p>
          <p>Java Services → RabbitMQ (5672) → Audit Node.js (9003)</p>
          <p>Eureka Discovery (8761) | Config Server (8888)</p>
        </div>
      </Card>
    </div>
  )
}
