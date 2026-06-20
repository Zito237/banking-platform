// Interface TypeScript pour les entrees d'audit (stockage JSON)
export interface AuditLog {
  id: string
  actor: string
  action: string
  resource: string
  payload?: Record<string, unknown>
  routingKey?: string
  timestamp: string
}
