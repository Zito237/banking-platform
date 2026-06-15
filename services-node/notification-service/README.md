# notification-service

Service de notifications de la plateforme bancaire distribuee.

## Role

- Consommateur RabbitMQ de l'exchange `banking.events` (topic)
- Ecoute les evenements metiers et simule l'envoi de notifications (SMS/Email)
- Expose un endpoint HTTP `/health` pour Kubernetes

## Evenements ecoutes

| Routing Key | Action |
|-------------|--------|
| `transaction.completed` | Affiche : "Votre transaction {reference} a reussi" |
| `loan.approved` | Affiche : "Votre pret a ete approuve" |
| `account.opened` | Affiche : "Votre compte a ete ouvert" |

## Stack

- Node.js 20
- NestJS 10
- @nestjs/microservices (RabbitMQ)
- amqplib

## Architecture

```
src/
├── main.ts                    # Point d'entree NestJS
├── app.module.ts              # Module racine
├── health/
│   └── health.controller.ts   # GET /health
└── notification/
    ├── notification.module.ts # Module notification
    └── notification.service.ts # Consommateur RabbitMQ + logique
```

## Variables d'environnement

| Variable | Defaut | Description |
|----------|--------|-------------|
| `PORT` | 9002 | Port HTTP du service |
| `RABBITMQ_URL` | amqp://rabbitmq:5672 | URL de connexion RabbitMQ |
| `RABBITMQ_EXCHANGE` | banking.events | Exchange topic |

## Lancement local

```bash
# Installer les dependances
npm install

# Lancer en mode developpement (avec watch)
npm run start:dev

# Ou en production
npm run build
npm run start:prod
```

## Docker

```bash
# Build et lancer avec RabbitMQ
docker-compose up --build
```

## Test

```bash
# Health check
curl http://localhost:9002/health

# Publier un evenement test (via RabbitMQ Management UI sur http://localhost:15672)
# Exchange : banking.events
# Routing key : transaction.completed
# Payload : {"id":"txn-123","reference":"REF-2024-001","amount":50000,"customerId":"cust-456"}
```
