# Architecture de la Plateforme Bancaire Distribuée

> **Projet** : TP INF462 — Architecture Logicielle  
> **Université** : Université de Yaoundé I  
> **Examinateur** : Pr. Kimbi Xaveria  
> **Équipe** : 5 membres  
> **Date de soutenance** : 22 juin 2026

---

## 1. Vue d'ensemble architecturale

La plateforme est une architecture **microservices polyglotte** basée sur une analyse **Domain-Driven Design (DDD)**. Elle permet à plusieurs opérateurs financiers (banques, microfinances, opérateurs mobiles) de coexister dans un même écosystème numérique, tout en offrant une expérience utilisateur homogène, sécurisée et transparente.

### 1.1 Schéma d'architecture

```
                          ┌────────────────────┐
                          │   Frontend (React) │
                          │ Client/Operator/Admin│
                          └─────────┬──────────┘
                                    │ HTTPS / JWT
                          ┌─────────▼──────────┐
                          │    API GATEWAY      │  (Spring Cloud Gateway)
                          │  routage + authn    │
                          └─────────┬──────────┘
              ┌───────────┬─────────┼─────────┬───────────┬──────────┐
              │           │         │         │           │          │
        ┌─────▼───┐ ┌────▼────┐ ┌──▼─────┐ ┌─▼──────┐ ┌──▼─────┐ ┌──▼──────┐
        │  AUTH   │ │CUSTOMER │ │ACCOUNT │ │TRANSAC.│ │  LOAN  │ │OPERATOR │  (Java)
        └────┬────┘ └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────┬────┘
             │           │          │          │          │           │
        ┌────▼───┐  ┌────▼───┐ ┌────▼───┐ ┌────▼───┐ ┌────▼───┐  ┌────▼───┐
        │authDB  │  │custDB  │ │acctDB  │ │txnDB   │ │loanDB  │  │operDB  │ (DB-per-service)
        └────────┘  └────────┘ └────────┘ └────────┘ └────────┘  └────────┘

        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐
        │ DOCUMENT/OCR │   │  REPORTING   │   │ NOTIFICATION │   │  AUDIT   │
        │  (Python)    │   │  (Python)    │   │  (Node.js)   │   │(Node.js) │
        └──────┬───────┘   └──────────────┘   └──────┬───────┘   └────┬─────┘
               │                                      │                │
               └──────────────┬───────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  RabbitMQ (bus)   │  ← événements asynchrones
                    └───────────────────┘
```

### 1.2 Services transverses d'infrastructure

| Service | Technologie | Rôle |
|---------|-------------|------|
| **Config Server** | Java / Spring Cloud Config | Configuration centralisée (backend Git) |
| **Discovery Server (Eureka)** | Java / Netflix Eureka | Registre de services dynamique |
| **API Gateway** | Java / Spring Cloud Gateway | Point d'entrée unique (routage, JWT, CORS) |
| **Observabilité** | Prometheus + Grafana + Zipkin + ELK/Loki | Métriques, traces, logs |

---

## 2. Justification du découpage en microservices (DDD)

### 2.1 Analyse DDD : Sous-domaines et Bounded Contexts

| Sous-domaine | Type | Bounded Context | Service |
|-------------|------|-----------------|---------|
| Gestion des transactions et transferts | **Core** | Transaction | `transaction-service` |
| Gestion des prêts | **Core** | Loan | `loan-service` |
| Gestion des comptes | **Core** | Account | `account-service` |
| Gestion des clients / KYC | Supporting | Customer | `customer-service` |
| Référentiel opérateurs et règles métier | Supporting | Operator | `operator-service` |
| Traitement documentaire (OCR/IA) | Supporting | Document Processing | `document-ocr-service` |
| Notifications | Generic | Notification | `notification-service` |
| Audit & traçabilité | Generic | Audit | `audit-service` |
| Reporting & statistiques | Generic | Reporting | `reporting-service` |
| Authentification / IAM | Generic | IAM | `auth-service` |

### 2.2 Relations entre Bounded Contexts (Context Map)

```
┌─────────────┐     Customer/Supplier      ┌─────────────────────┐
│  Customer   │ ──────────────────────────> │ Document Processing │
│  (Client)   │                           │   (Fournisseur)       │
└─────────────┘                           └─────────────────────┘

┌─────────────┐     Customer/Supplier      ┌─────────────┐
│ Transaction │ ──────────────────────────> │   Account   │
│   (Client)  │                           │ (Fournisseur) │
└─────────────┘                           └─────────────┘

┌─────────────┐       Conformist            ┌─────────────┐
│ Transaction │ ──────────────────────────> │   Operator  │
│             │  (se conforme aux règles)     │             │
└─────────────┘                           └─────────────┘

┌─────────────┐     Customer/Supplier      ┌─────────────────────┐
│    Loan     │ ──────────────────────────> │ Customer, Document  │
│             │                           │                     │
└─────────────┘                           └─────────────────────┘

┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Tous les  │   │   Tous les  │   │   Tous les  │   │   Tous les  │
│  services   │──>│ Notification│   │    Audit    │   │  Reporting  │
│             │   │             │   │             │   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
       │                  │                │                │
       └──────────────────┴────────────────┴────────────────┘
                          │
                    Published Language
                    (RabbitMQ — événements)

┌─────────────┐
│   Tous les  │     Open Host Service
│  services   │ ───────────────────────> IAM (JWT via Gateway)
│             │
└─────────────┘
```

---

## 3. Liste des microservices et justification technologique

### 3.1 Services métier

| Service | Bounded Context | Technologie | Justification du découpage |
|---------|----------------|-------------|---------------------------|
| `auth-service` | Identity & Access Management | **Java / Spring Security** | Authentification multi-mécanismes : responsabilité transverse et sensible, isolée pour la sécurité. Sert tous les services via JWT. |
| `customer-service` | Customer Management | **Java** | Cycle de vie client (inscription, KYC) : sous-domaine cœur distinct des comptes. |
| `account-service` | Account Management | **Java** | Compte = cycle de vie propre (ouverture, plafonds, statut). Solde = donnée critique à isoler. |
| `transaction-service` | Transactions & Transfers | **Java** | Dépôts/retraits/transferts : forte cohérence transactionnelle. Orchestrateur des Sagas inter-opérateurs. |
| `loan-service` | Loan Management | **Java** | Demande, validation, échéancier, remboursement : sous-domaine riche en règles métier. |
| `operator-service` | Operator Management | **Java** | Chaque opérateur a ses propres règles (commissions, plafonds, validations). |
| `document-ocr-service` | Document Processing | **Python / FastAPI** | OCR et IA s'appuient sur l'écosystème Python (Tesseract, EasyOCR, OpenCV, ML). Choix techniquement justifié + contrainte Python satisfaite. |
| `reporting-service` | Reporting & Analytics | **Python / FastAPI** | Analyse de données et statistiques naturelles en Python (pandas). Lecture seule via événements/projections. |
| `notification-service` | Notifications | **Node.js / NestJS** | Service I/O-bound (envoi e-mail/SMS). Modèle asynchrone non-bloquant de Node idéal. Consommateur d'événements. |
| `audit-service` | Audit & Traceability | **Node.js / NestJS** | Consommateur transverse d'événements ; journal immuable. Léger, orienté flux → Node.js. |

### 3.2 Services d'infrastructure

| Service | Technologie | Rôle |
|---------|-------------|------|
| `config-server` | Java / Spring Cloud Config | Configuration centralisée (backend Git) |
| `discovery-server` | Java / Eureka | Registre de services dynamique |
| `api-gateway` | Java / Spring Cloud Gateway | Point d'entrée unique : routage, auth JWT, rate limiting, CORS |
| **RabbitMQ** | Broker AMQP | Bus d'événements pour communication asynchrone |

### 3.3 Justification de la répartition polyglotte

| Langage | Services | Justification |
|---------|----------|---------------|
| **Java** | Cœur financier + infrastructure (9 services) | Écosystème Spring Cloud mature pour microservices (Eureka, Config, Gateway, Resilience4j). Typage fort adapté aux données financières. |
| **Python** | OCR/IA + Reporting (2 services) | Bibliothèques ML/OCR (Tesseract, OpenCV, pandas). FastAPI pour API auto-documentées. |
| **Node.js** | Notifications + Audit (2 services) | Modèle event-driven non-bloquant. Idéal pour consommateurs de messages et I/O intensifs. |

> **Contrainte satisfaite** : Java + Python + Node.js tous présents, chaque choix justifié par la nature technique du service.

---

## 4. Communications entre services

### 4.1 Communication synchrone (requête/réponse)

| Aspect | Implémentation |
|--------|---------------|
| Client → Service | Frontend → API Gateway (REST/HTTP + JWT) |
| Service → Service (interne) | OpenFeign + Eureka (résolution de nom + load balancing côté client) |
| Résilience | Resilience4j (Circuit Breaker, Retry, Timeout) |
| Exemple | `transaction-service` appelle `account-service` pour vérifier/débiter un solde |

### 4.2 Communication asynchrone (événementielle — EDA)

Via **RabbitMQ** (exchange topic). Les services publient des événements métier et les consommateurs y réagissent sans couplage direct.

| Événement | Producteur | Consommateurs |
|-----------|-----------|---------------|
| `TransactionCompleted` | `transaction-service` | notification, audit, reporting |
| `DocumentSubmitted` | `customer-service` | `document-ocr-service` |
| `DocumentProcessed` | `document-ocr-service` | `customer-service`, `loan-service` |
| `LoanApproved` / `LoanRejected` | `loan-service` | notification, audit, `account-service` |
| `AccountOpened` | `account-service` | notification, audit |
| `RepaymentReceived` | `transaction-service` | `loan-service`, notification |

### 4.3 Transferts inter-opérateurs : Pattern Saga (orchestration)

Un transfert inter-opérateurs touche plusieurs services et plusieurs bases → transaction distribuée gérée par une **Saga par orchestration** dont l'orchestrateur est le `transaction-service` :

```
┌─────────────────┐
│  Client demande │
│    transfert    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   transaction-service       │
│      (Orchestrateur Saga)   │
└────────┬────────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    │         │        │        │
    ▼         ▼        ▼        ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│Étape 1│  │Étape 2│  │Étape 3│  │Comp.  │
│Débit  │  │Commis.│  │Crédit │  │(rollback)
│source │  │       │  │dest.  │  │       │
└──────┘  └──────┘  └──────┘  └──────┘
    │         │        │        │
    └────┬────┴────────┴────────┘
         │
         ▼
┌─────────────────────────────┐
│  TransactionCompleted       │
│  ou TransactionFailed       │
│  → RabbitMQ → Notification  │
│    Audit, Reporting         │
└─────────────────────────────┘
```

**Étapes détaillées :**
1. Débit du compte source (`account-service`)
2. Calcul des commissions (`operator-service`)
3. Crédit du compte destination (`account-service`)
4. Si une étape échoue → transactions de compensation (re-crédit du compte source)
5. Publication de `TransactionCompleted` ou `TransactionFailed`

> **Pattern architectural cité** : Saga (orchestration vs chorégraphie) — patron du cours.

---

## 5. Stack technologique

| Couche | Technologie | Version cible |
|--------|-------------|---------------|
| Langage cœur | Java | 17 (LTS) |
| Framework cœur | Spring Boot | 3.2.x |
| Écosystème distribué | Spring Cloud | 2023.0.x |
| Service Discovery | Netflix Eureka | (Spring Cloud) |
| Config | Spring Cloud Config | (Spring Cloud) |
| Gateway | Spring Cloud Gateway | (Spring Cloud) |
| Résilience | Resilience4j | 2.x |
| Appels inter-services | OpenFeign + Spring Cloud LoadBalancer | (Spring Cloud) |
| Sécurité | Spring Security + JWT (jjwt) + OAuth2 | — |
| OCR / IA | Python 3.11 + FastAPI + Tesseract/EasyOCR + OpenCV | — |
| Reporting | Python 3.11 + FastAPI + pandas | — |
| Notifications / Audit | Node.js 20 + NestJS | — |
| Messaging | RabbitMQ | 3.13 |
| Bases relationnelles | PostgreSQL (DB-per-service) | 16 |
| Base documentaire (optionnel) | MongoDB | 7 |
| Frontend | React 18 + Vite + TypeScript + TailwindCSS | — |
| Build Java | Maven (multi-module) | 3.9 |
| Conteneurisation | Docker + Docker Compose | — |
| Orchestration | Kubernetes (Minikube / Kind) | 1.29+ |
| Observabilité | Actuator + Micrometer + Prometheus + Grafana + Zipkin | — |
| Logs | ELK (Elasticsearch/Kibana) ou Grafana Loki | — |
| CI/CD | GitHub Actions | — |
| API docs | springdoc-openapi (Swagger) / FastAPI auto-docs | — |

---

## 6. Arborescence du dépôt

```
banking-platform/
├── README.md
├── docs/
│   ├── cahier-des-charges.md
│   ├── ddd-analysis.md
│   ├── contracts.md          # contrats API + événements (figés Jour 2)
│   └── architecture.md       # ce fichier
├── infra/
│   ├── docker-compose.yml     # dev local (DBs, RabbitMQ, observabilité)
│   └── k8s/                   # manifests Kubernetes
├── config-repo/               # backend Git du Config Server
├── backend-java/              # projet Maven multi-module
│   ├── pom.xml                # POM parent
│   ├── config-server/
│   ├── discovery-server/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── customer-service/
│   ├── account-service/
│   ├── transaction-service/
│   ├── loan-service/
│   └── operator-service/
├── services-python/
│   ├── document-ocr-service/
│   └── reporting-service/
├── services-node/
│   ├── notification-service/
│   └── audit-service/
├── frontend/                  # React + Vite
└── .github/workflows/ci.yml
```

---

## 7. Ordre de démarrage des services

```
1.  RabbitMQ + Bases PostgreSQL   (docker-compose)
2.  config-server        (8888)
3.  discovery-server     (8761)
4.  api-gateway          (8080)
5.  auth-service         (8081)
6.  operator-service     (8082)
7.  account-service      (8083)
8.  customer-service     (8084)
9.  transaction-service  (8085)
10. loan-service         (8086)
11. document-ocr (9001), notification (9002), audit (9003), reporting (9004)
12. frontend             (5173)
```

> ⚠️ **Règle d'or** : un service métier démarré avant config-server ou Eureka échouera.

---

## 8. Stratégie de sécurité

| Mécanisme | Implémentation |
|-----------|---------------|
| Authentification | JWT (JSON Web Tokens) générés par `auth-service`, validés par la Gateway |
| Autorisation | Rôles (CLIENT, OPERATOR, ADMIN) avec contrôle d'accès par endpoint |
| Protection des routes | Gateway filtre les chemins `/auth/login` et `/auth/register` (publics), exige JWT pour tout le reste |
| Secrets | Config Server + Kubernetes Secrets (aucun secret en clair dans le code) |
| CORS | Configuré à la Gateway pour autoriser le frontend (`localhost:5173`) |
| Concurrence | Verrouillage optimiste (`@Version`) sur les soldes |

---

## 9. Stratégie de résilience

| Pattern | Implémentation | Service concerné |
|---------|---------------|------------------|
| Circuit Breaker | Resilience4j | `transaction-service` → `account-service`, `operator-service` |
| Retry | Resilience4j | Appels Feign inter-services |
| Timeout | Resilience4j | Appels Feign inter-services |
| Saga (compensation) | Orchestrateur `transaction-service` | Transferts inter-opérateurs |
| Idempotence | `reference` unique par transaction | `transaction-service` |
| Dead Letter Queue | RabbitMQ | Messages non traités |
| Health Checks | Spring Boot Actuator + K8s probes | Tous les services |

---

## 10. Observabilité

| Couche | Outil | Rôle |
|--------|-------|------|
| Métriques | Micrometer + Prometheus | Collecte des métriques JVM, HTTP, custom |
| Dashboards | Grafana | Visualisation des métriques et alertes |
| Tracing distribué | Zipkin | Traces inter-services (traceId) |
| Logs | ELK ou Grafana Loki | Centralisation et corrélation des logs |
| Health | Spring Boot Actuator | `/actuator/health`, `/actuator/info`, `/actuator/metrics` |

---

*Document généré à partir de l'analyse du Guide d'Exécution INF462 — Juin 2026*
