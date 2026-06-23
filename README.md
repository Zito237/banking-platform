# Plateforme Bancaire Distribuée Multi-Opérateurs (FinPay)

Projet : **TP INF462 — Architecture Logicielle**  
Université : **Université de Yaoundé I**  
Examinateur : **Pr. Kimbi Xaveria**  
Équipe : **5 membres**  
Date de soutenance : **22 juin 2026**

---

## Vue d’ensemble

**FinPay** est une plateforme bancaire **microservices polyglotte** (Java + Python + Node.js) conçue selon les principes du **Domain-Driven Design (DDD)**. Elle permet à plusieurs opérateurs financiers de coexister dans un même écosystème, tout en offrant :
- une **authentification** basée sur **JWT** et des rôles (**CLIENT / OPERATOR / ADMIN**)
- une **gestion KYC** (OCR/IA) pour la validation documentaire
- une **gestion de comptes** et des **transactions** (dépôt, retrait, transfert intra & inter-opérateurs)
- des **prêts** (échéancier + remboursements)
- une **traçabilité complète** (audit) et des **notifications** (simulées)

Pour les détails fonctionnels complets (cahier des charges) :
- `docs/cahier-des-charges.md`

Pour l’analyse DDD et l’architecture :
- `docs/ddd-analysis.md`
- `docs/architecture.md`
- `docs/contracts.md`

---

## Architecture (aperçu)

- **Frontend React** (port `5173`)
- **API Gateway** (Spring Cloud Gateway, port `8080`) : routage + JWT + CORS + contrôle d’accès
- **Infrastructure** :
  - **config-server** (port `8888`)
  - **discovery-server / Eureka** (port `8761`)
  - **RabbitMQ** (AMQP `5672`, management `15672`)
- **Microservices métier** :
  - `auth-service` (8081)
  - `operator-service` (8082)
  - `account-service` (8083)
  - `customer-service` (8084)
  - `transaction-service` (8085)
  - `loan-service` (8086)
- **Services polyglottes** :
  - `document-ocr-service` (9001)
  - `reporting-service` (9004)
  - `notification-service` (9002)
  - `audit-service` (9003)

---

## Stack technologique (cible)

| Couche | Technologie |
|---|---|
| Java | Spring Boot 3.2.x, Spring Cloud (Eureka, Config, Gateway) |
| Sécurité | Spring Security + **JWT** |
| Résilience | Resilience4j (Circuit Breaker / Retry / Timeout) |
| Messaging | RabbitMQ |
| Bases | PostgreSQL (DB-per-service) — (démo locale peut varier selon compose) |
| OCR / IA | Python 3.11 + FastAPI + Tesseract/OpenCV |
| Reporting | Python 3.11 + FastAPI + pandas |
| Notifications / Audit | Node.js 20 + NestJS |
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Observabilité | Prometheus + Grafana + Zipkin + logs (ELK/Loki) |

---

## Services (ports)

| Service | Port |
|---|---:|
| `api-gateway` | 8080 |
| `discovery-server` | 8761 |
| `config-server` | 8888 |
| `auth-service` | 8081 |
| `operator-service` | 8082 |
| `account-service` | 8083 |
| `customer-service` | 8084 |
| `transaction-service` | 8085 |
| `loan-service` | 8086 |
| `document-ocr-service` | 9001 |
| `notification-service` | 9002 |
| `audit-service` | 9003 |
| `reporting-service` | 9004 |
| `frontend` | 5173 |
| RabbitMQ (management) | 15672 |

---

## Prérequis

### Docker Compose (développement local)
- Docker Engine ≥ 24.0
- Docker Compose ≥ 2.20
- RAM : 8 Go min (16 Go recommandé)
- CPU : 4 cœurs

### Kubernetes (démo / production)
- Kubernetes ≥ 1.29 (Minikube / Kind ou cluster cloud)
- `kubectl` configuré
- Ingress Controller nginx (selon votre environnement)
- RAM : 16 Go min, CPU : 6 cœurs

---

## Démarrage rapide (Docker Compose)

```bash
# 1) Cloner le dépôt
git clone https://github.com/Remise-Tp-INF462-2026/INF462-Groupe1-Sophia-Bertrand-Lea-Princesse-Soufayanou
cd banking-platform

# 2) Construire les images (si nécessaire)
docker-compose build

# 3) Lancer toute la plateforme
docker-compose up -d

# 4) Vérifier l'état
docker-compose ps

# 5) Logs d'un service
docker-compose logs -f transaction-service
```

Accès (si les ports sont exposés comme configuré) :
- Frontend : http://localhost:5173
- API Gateway : http://localhost:8080
- Eureka Dashboard : http://localhost:8761
- RabbitMQ UI : http://localhost:15672 (admin/admin123)
- Config Server : http://localhost:8888

Pour arrêter :
```bash
docker-compose down
```

Pour arrêter et supprimer les volumes (⚠️ données perdues) :
```bash
docker-compose down -v
```

---

## Démarrage rapide (Kubernetes)

Le dossier **`k8s/`** contient déjà des manifests numérotés (00–15).

```bash
# 1) Déployer tout le cluster
kubectl apply -f k8s/

# 2) Vérifier
kubectl get pods -n finpay
kubectl get svc -n finpay
kubectl get ingress -n finpay

# 3) Supprimer le déploiement
kubectl delete namespace finpay
```

Accès via Ingress (selon votre configuration) :
- Exemple d’host attendu dans la doc précédente : **`finpay.local`**

---

## Ordre de démarrage (important)

L’infrastructure doit être prête avant les services métier.

1. RabbitMQ + Bases PostgreSQL (compose / k8s infra)
2. `config-server` (8888)
3. `discovery-server` (8761)
4. `api-gateway` (8080)
5. Services métier : `auth`, `operator`, `account`, `customer`, `transaction`, `loan`
6. Services polyglottes : `document-ocr`, `reporting`, `notification`, `audit`
7. Frontend

---

## Communication entre services

- **Synchrone (REST/Feign)** : inter-services via Gateway + Feign + Eureka
- **Asynchrone (événements RabbitMQ)** : notifications, audit, reporting
- **Transferts inter-opérateurs** : pattern **Saga** (orchestration côté `transaction-service`)

Détails complets des événements et contrats : `docs/contracts.md`

---

## Sécurité, Résilience, Observabilité

- Sécurité : JWT + rôles RBAC, validé au niveau **API Gateway**
- Résilience : Resilience4j (circuit breaker / retry / timeout)
- Traçabilité : service `audit-service` (journal)
- Observabilité : Prometheus/Grafana/Zipkin + logs centralisés

Détails :
- `docs/architecture.md`

---

## Tests

### Tests unitaires
- Java (Maven) : `backend-java` → `mvn test`
- Python (pytest) : services OCR/Reporting
- Node.js (Jest) : notification/audit

### Tests d’intégration / Postman
La pipeline d’intégration et les commandes sont décrites dans la version précédente du README.

---

## CI/CD

Pipeline GitHub Actions : build → test → package → push d’images Docker (voir `.github/workflows/ci.yml`).

---

## Licence

Ce projet est réalisé dans le cadre du TP INF462 — Architecture Logicielle à l'Université de Yaoundé I sous la supervision du Pr. Kimbi Xaveria.

© 2026 — Équipe INF462. Tous droits réservés.

---

## Documentation API

- Services Java : Swagger à **`/swagger-ui.html`**
- Services Python (FastAPI) : auto-doc à **`/docs`**

