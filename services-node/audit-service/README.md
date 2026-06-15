# audit-service

Service d'audit et traçabilité de la plateforme bancaire distribuee.

## Role

- Consommateur RabbitMQ de l'exchange `banking.events` (topic)
- S'abonne a **TOUTES** les routing keys via le pattern `#`
- Enregistre chaque evenement dans MongoDB sous forme d'entree d'audit immuable
- Expose un endpoint REST pagine pour consulter les logs (admin)

## Evenements captures

Tous les evenements publies sur `banking.events` sont automatiquement journalises :

| Exemple de routing key | Action enregistree | Ressource |
|------------------------|-------------------|-----------|
| `transaction.completed` | `TRANSACTION_COMPLETED` | `transaction` |
| `loan.approved` | `LOAN_APPROVED` | `loan` |
| `account.opened` | `ACCOUNT_OPENED` | `account` |
| `document.processed` | `DOCUMENT_PROCESSED` | `document` |
| ... | ... | ... |

## Stack

- Node.js 20
- NestJS 10
- @nestjs/microservices (RabbitMQ)
- Mongoose (MongoDB)
- amqplib

## Architecture

```
src/
├── main.ts                    # Point d'entree NestJS (HTTP port 9003)
├── app.module.ts              # Module racine + connexion MongoDB
├── health/
│   └── health.controller.ts   # GET /health
└── audit/
    ├── audit.module.ts        # Module audit
    ├── audit.controller.ts    # GET /audit (liste paginee)
    ├── audit.service.ts       # Consommateur RabbitMQ + logique MongoDB
    └── schemas/
        └── audit-log.schema.ts # Schema MongoDB AuditLog
```

## Schema MongoDB (AuditLog)

```json
{
  "actor": "client:123e4567-e89b-12d3-a456-426614174000",
  "action": "TRANSACTION_COMPLETED",
  "resource": "transaction",
  "payload": { "id": "...", "amount": 50000, ... },
  "routingKey": "transaction.completed",
  "timestamp": "2024-06-15T10:30:00.000Z",
  "createdAt": "2024-06-15T10:30:00.000Z",
  "updatedAt": "2024-06-15T10:30:00.000Z"
}
```

## Variables d'environnement

| Variable | Defaut | Description |
|----------|--------|-------------|
| `PORT` | 9003 | Port HTTP du service |
| `MONGO_URI` | `mongodb://localhost:27017/audit` | URI de connexion MongoDB |
| `RABBITMQ_URL` | `amqp://localhost:5672` | URL de connexion RabbitMQ |
| `RABBITMQ_EXCHANGE` | `banking.events` | Exchange topic |

## Prerequis

- **MongoDB** en cours d'execution (local ou distant)
- **RabbitMQ** en cours d'execution

### Installer MongoDB (Ubuntu)

```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Lancement local

```bash
# Installer les dependances
npm install

# Lancer en mode developpement (avec rechargement auto)
npm run start:dev

# OU en production
npm run build
npm run start:prod
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Statut du service |
| `GET /audit?resource=&actor=&action=&from=&to=&page=&limit=` | Liste paginee des logs |

## Exemples de requetes

```bash
# Health check
curl http://localhost:9003/health

# Tous les logs (page 1, 20 par page)
curl http://localhost:9003/audit

# Filtrer par ressource
curl "http://localhost:9003/audit?resource=transaction"

# Filtrer par periode
curl "http://localhost:9003/audit?from=2024-06-01&to=2024-06-15"

# Filtrer par acteur + pagination
curl "http://localhost:9003/audit?actor=client:123&page=1&limit=10"
```

## Reponse paginee

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```
