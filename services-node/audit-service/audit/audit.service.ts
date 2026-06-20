// Service d'audit : stockage JSON + consommateur RabbitMQ optionnel
import { Injectable, OnModuleInit } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { AuditLog } from '../schema/audit-log.schema'

const DATA_DIR = process.env.AUDIT_DATA_DIR || path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'audit-logs.json')
const MAX_LOGS = 2000
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672'
const EXCHANGE = 'banking.events'

@Injectable()
export class AuditService implements OnModuleInit {
  private logs: AuditLog[] = []

  constructor() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    } catch {}
    this.loadLogs()
  }

  private loadLogs() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        this.logs = JSON.parse(raw)
      }
    } catch {
      this.logs = []
    }
  }

  private saveLogs() {
    try {
      if (this.logs.length > MAX_LOGS) {
        this.logs = this.logs.slice(-MAX_LOGS)
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.logs, null, 2), 'utf-8')
    } catch (e: any) {
      console.warn('[AUDIT] Sauvegarde impossible :', e.message)
    }
  }

  onModuleInit() {
    console.log(`[AUDIT] ${this.logs.length} entrees chargees depuis ${DATA_FILE}`)
    this.connectRabbitMQ()
  }

  private async connectRabbitMQ() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const amqp = require('amqplib')
      const conn = await amqp.connect(RABBITMQ_URL)
      const channel = await conn.createChannel()

      await channel.assertExchange(EXCHANGE, 'topic', { durable: true })
      const { queue } = await channel.assertQueue('audit.queue.http', { durable: true })
      await channel.bindQueue(queue, EXCHANGE, '#')

      channel.consume(queue, (msg: any) => {
        if (!msg) return
        try {
          const data = JSON.parse(msg.content.toString())
          const routingKey: string = msg.fields.routingKey
          this.createLog(data, routingKey)
        } catch {}
        channel.ack(msg)
      })

      console.log('[AUDIT] Connecte a RabbitMQ — ecoute tous les evenements')

      conn.on('error', () => {
        console.warn('[AUDIT] Connexion RabbitMQ perdue, tentative dans 30s')
        setTimeout(() => this.connectRabbitMQ(), 30_000)
      })
    } catch (e: any) {
      console.warn('[AUDIT] RabbitMQ indisponible :', e.message, '— retry dans 30s')
      setTimeout(() => this.connectRabbitMQ(), 30_000)
    }
  }

  createLog(data: any, routingKey: string, actorOverride?: string): AuditLog {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      actor: actorOverride || this.extractActor(data, routingKey),
      action: routingKey.toUpperCase().replace(/\./g, '_'),
      resource: routingKey.split('.')[0] || 'system',
      payload: data,
      routingKey,
      timestamp: new Date().toISOString(),
    }
    this.logs.push(log)
    this.saveLogs()
    console.log(`[AUDIT] ${log.action} | ${log.actor} | ${log.resource}`)
    return log
  }

  findLogs(filters: {
    resource?: string
    actor?: string
    action?: string
    from?: string
    to?: string
    page?: number
    limit?: number
  }) {
    const { resource, actor, action, from, to, page = 1, limit = 20 } = filters

    let filtered = [...this.logs].reverse()

    if (resource) filtered = filtered.filter((l) => l.resource === resource)
    if (actor) filtered = filtered.filter((l) => l.actor.includes(actor))
    if (action) filtered = filtered.filter((l) => l.action.includes(action.toUpperCase()))
    if (from) filtered = filtered.filter((l) => new Date(l.timestamp) >= new Date(from))
    if (to) filtered = filtered.filter((l) => new Date(l.timestamp) <= new Date(to))

    const total = filtered.length
    const data = filtered.slice((page - 1) * limit, page * limit)

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }
  }

  private extractActor(data: any, routingKey: string): string {
    if (data?.customerId) return `client:${data.customerId}`
    if (data?.operatorId) return `operator:${data.operatorId}`
    if (data?.userId) return `user:${data.userId}`
    if (data?.actor) return data.actor
    return `system:${routingKey.split('.')[0]}`
  }
}
