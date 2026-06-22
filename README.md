🏦 Plateforme Bancaire Distribuée Multi-Opérateurs
Projet : TP INF462 — Architecture Logicielle
Université : Université de Yaoundé I
Examinateur : Pr. Kimbi Xaveria
Équipe : 5 membres
Date de soutenance : 22 juin 2026
📋 Table des matières
Vue d'ensemble
Architecture
Stack technologique
Services
Prérequis
Démarrage rapide
Docker Compose
Kubernetes
Ordre de démarrage
Communication inter-services
Sécurité
Résilience
Observabilité
Tests
CI/CD
Équipe
Licence
Vue d'ensemble
Cette plateforme est une architecture microservices polyglotte conçue selon les principes du Domain-Driven Design (DDD). Elle permet à plusieurs opérateurs financiers (banques traditionnelles, microfinances, opérateurs de téléphonie mobile) de coexister dans un même écosystème numérique, tout en offrant à l'utilisateur final une expérience homogène, sécurisée et transparente.
Fonctionnalités principales
🔐 Authentification multi-mécanismes (JWT, rôles CLIENT/OPERATOR/ADMIN)
👤 Gestion des clients et KYC avec validation documentaire OCR/IA
💳 Gestion des comptes financiers (courant, épargne, portefeuille mobile)
💸 Dépôts, retraits et transferts (intra & inter-opérateurs)
📊 Demandes de prêts, échéanciers et remboursements
📧 Notifications email/SMS (simulées)
📈 Rapports et statistiques par opérateur
🔍 Audit et traçabilité complète des opérations
Architecture
plain
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
Patterns architecturaux
Table
Pattern	Implémentation	Justification
API Gateway	Spring Cloud Gateway	Point d'entrée unique, auth JWT, rate limiting
Service Discovery	Netflix Eureka	Résolution dynamique des services
Config Server	Spring Cloud Config	Configuration externalisée (Git backend)
Circuit Breaker	Resilience4j	Tolérance aux pannes inter-services
Saga (Orchestration)	transaction-service	Gestion des transactions distribuées inter-opérateurs
Database-per-service	PostgreSQL × 11	Isolation des données, autonomie
Pub/Sub	RabbitMQ (AMQP)	Communication asynchrone découplée
CQRS (implicite)	reporting-service	Lectures via projections d'événements
Stack technologique
Table
Couche	Technologie	Version
Langage cœur	Java	17 (LTS)
Framework cœur	Spring Boot	3.2.x
Écosystème distribué	Spring Cloud	2023.0.x
Service Discovery	Netflix Eureka	(Spring Cloud)
Config	Spring Cloud Config	(Spring Cloud)
Gateway	Spring Cloud Gateway	(Spring Cloud)
Résilience	Resilience4j	2.x
Appels inter-services	OpenFeign + Spring Cloud LoadBalancer	(Spring Cloud)
Sécurité	Spring Security + JWT (jjwt) + OAuth2	—
OCR / IA	Python 3.11 + FastAPI + Tesseract/EasyOCR + OpenCV	—
Reporting	Python 3.11 + FastAPI + pandas	—
Notifications / Audit	Node.js 20 + NestJS	—
Messaging	RabbitMQ	3.13
Bases relationnelles	PostgreSQL (DB-per-service)	16
Frontend	React 18 + Vite + TypeScript + TailwindCSS	—
Build Java	Maven (multi-module)	3.9
Conteneurisation	Docker + Docker Compose	—
Orchestration	Kubernetes (Minikube / Kind)	1.29+
Observabilité	Prometheus + Grafana + Zipkin + ELK/Loki	—
CI/CD	GitHub Actions	—
API docs	springdoc-openapi (Swagger) / FastAPI auto-docs	—
Services
Services métier Java (Spring Boot)
Table
Service	Port	Bounded Context	Description
auth-service	8081	IAM	Authentification JWT, rôles, inscription
customer-service	8084	Customer	Gestion clients, KYC, documents
account-service	8083	Account	Comptes, soldes, plafonds, statuts
transaction-service	8085	Transaction	Dépôts, retraits, transferts, Saga orchestrator
loan-service	8086	Loan	Prêts, échéanciers, remboursements
operator-service	8082	Operator	Règles métier, commissions, plafonds par opérateur
Services polyglottes
Table
Service	Port	Langage	Framework	Description
document-ocr-service	9001	Python	FastAPI	OCR Tesseract/EasyOCR, extraction CNI/passeport
reporting-service	9004	Python	FastAPI	Statistiques, tableaux de bord (pandas)
notification-service	9002	Node.js	NestJS	Email/SMS, consommateur d'événements
audit-service	9003	Node.js	NestJS	Journal immuable, traçabilité
Services d'infrastructure
Table
Service	Port	Technologie	Rôle
config-server	8888	Java / Spring Cloud Config	Configuration centralisée
discovery-server	8761	Java / Netflix Eureka	Registre de services
api-gateway	8080	Java / Spring Cloud Gateway	Routage, auth, rate limiting
RabbitMQ	5672 / 15672	Broker AMQP	Bus d'événements
Prérequis
Docker Compose (développement local)
Docker Engine ≥ 24.0
Docker Compose ≥ 2.20
8 Go RAM minimum (16 Go recommandé)
4 cœurs CPU
Kubernetes (production / démonstration)
Kubernetes ≥ 1.29 (Minikube, Kind, ou cluster cloud)
kubectl configuré
Ingress Controller (nginx) installé
16 Go RAM minimum
6 cœurs CPU
Outils optionnels
k9s — interface TUI pour Kubernetes
Lens — IDE pour Kubernetes
Postman — tests d'API
Démarrage rapide
Docker Compose
bash
# 1. Cloner le dépôt
git clone https://github.com/univ-yaounde/banking-platform.git
cd banking-platform

# 2. Construire les images (si nécessaire)
docker-compose build

# 3. Lancer toute la plateforme
docker-compose up -d

# 4. Vérifier l'état des services
docker-compose ps

# 5. Consulter les logs
docker-compose logs -f transaction-service

# 6. Accéder aux interfaces
# - Frontend (Client)      → http://localhost:5173
# - API Gateway            → http://localhost:8080
# - Eureka Dashboard       → http://localhost:8761
# - RabbitMQ Management UI → http://localhost:15672 (admin/admin123)
# - Config Server          → http://localhost:8888

# 7. Arrêter la plateforme
docker-compose down

# 8. Arrêter et supprimer les volumes (⚠️ données perdues)
docker-compose down -v
Kubernetes
bash
# 1. Cloner le dépôt
git clone https://github.com/univ-yaounde/banking-platform.git
cd banking-platform

# 2. Créer le namespace
kubectl apply -f k8s/00-namespace/

# 3. Déployer l'infrastructure (RabbitMQ + PostgreSQL)
kubectl apply -f k8s/01-infra/

# 4. Déployer la configuration
kubectl apply -f k8s/02-config/
kubectl apply -f k8s/03-secrets/

# 5. Déployer les services d'infrastructure
kubectl apply -f k8s/04-config-server/
kubectl apply -f k8s/05-discovery-server/

# 6. Déployer la gateway (replicas=2)
kubectl apply -f k8s/06-api-gateway/

# 7. Déployer les services métier Java
kubectl apply -f k8s/07-auth-service/
kubectl apply -f k8s/08-operator-service/
kubectl apply -f k8s/09-account-service/    # replicas=2
kubectl apply -f k8s/10-customer-service/
kubectl apply -f k8s/11-transaction-service/
kubectl apply -f k8s/12-loan-service/

# 8. Déployer les services polyglottes
kubectl apply -f k8s/13-document-ocr/
kubectl apply -f k8s/14-reporting/
kubectl apply -f k8s/15-notification/
kubectl apply -f k8s/16-audit/

# 9. Déployer le frontend
kubectl apply -f k8s/17-frontend/

# 10. Déployer l'Ingress
kubectl apply -f k8s/18-ingress/

# 11. Vérifier le statut
echo "=== Pods ==="
kubectl get pods -n banking-platform

echo "=== Services ==="
kubectl get svc -n banking-platform

echo "=== Ingress ==="
kubectl get ingress -n banking-platform

# 12. Accéder aux services (ajouter banking.local dans /etc/hosts)
# 127.0.0.1 banking.local
# - Frontend               → http://banking.local/
# - API Gateway            → http://banking.local/api
# - Eureka Dashboard       → http://banking.local/eureka
# - RabbitMQ Management UI → http://banking.local/rabbitmq

# 13. Supprimer tout le déploiement
kubectl delete namespace banking-platform
Ordre de démarrage
L'ordre est critique car les services métier dépendent de l'infrastructure :
plain
1.  RabbitMQ + Bases PostgreSQL   (docker-compose / k8s infra)
2.  config-server        (8888)    ← configuration centralisée
3.  discovery-server     (8761)    ← registre de services
4.  api-gateway          (8080)    ← point d'entrée
5.  auth-service         (8081)    ← authentification
6.  operator-service     (8082)    ← règles métier
7.  account-service      (8083)    ← comptes (replicas=2)
8.  customer-service     (8084)    ← clients
9.  transaction-service  (8085)    ← transactions (dépend de account + operator)
10. loan-service         (8086)    ← prêts (dépend de customer)
11. document-ocr         (9001)    ← OCR Python
    reporting            (9004)    ← stats Python
    notification         (9002)    ← notifications Node.js
    audit                (9003)    ← audit Node.js
12. frontend             (5173)    ← interface React
⚠️ Règle d'or : un service métier démarré avant config-server ou discovery-server échouera au démarrage.
Communication inter-services
Synchrone (REST/Feign)
Table
Appel	Pattern	Résilience
transaction-service → account-service	OpenFeign + Eureka	Circuit Breaker + Retry + Timeout
transaction-service → operator-service	OpenFeign + Eureka	Circuit Breaker + Retry + Timeout
loan-service → customer-service	OpenFeign + Eureka	Retry + Timeout
Asynchrone (RabbitMQ — événements)
Table
Événement	Producteur	Consommateurs
TransactionCompleted	transaction-service	notification, audit, reporting
TransactionFailed	transaction-service	notification, audit
DocumentSubmitted	customer-service	document-ocr-service
DocumentProcessed	document-ocr-service	customer-service, loan-service
LoanApproved / LoanRejected	loan-service	notification, audit, account-service
AccountOpened	account-service	notification, audit
RepaymentReceived	transaction-service	loan-service, notification
Saga — Transferts inter-opérateurs
Le transaction-service orchestre une Saga pour les transferts inter-opérateurs :
plain
Étape 1 : Débit compte source      → account-service
Étape 2 : Calcul commissions       → operator-service
Étape 3 : Crédit compte destination → account-service
Compensation (si échec) : Re-crédit compte source
Publication : TransactionCompleted ou TransactionFailed → RabbitMQ
Sécurité
Table
Mécanisme	Implémentation
Authentification	JWT (HS256) générés par auth-service, validés par la Gateway
Autorisation	RBAC — rôles : CLIENT, OPERATOR, ADMIN
Protection routes	/auth/login et /auth/register publics, JWT exigé ailleurs
Mots de passe	BCrypt (coût 12)
Secrets	Config Server + Kubernetes Secrets (aucun secret en clair)
CORS	Configuré à la Gateway (localhost:5173 en dev)
Concurrence	Verrouillage optimiste (@Version) sur les soldes
Audit	Journal immuable de tous les événements métier
Résilience
Table
Pattern	Implémentation	Service concerné
Circuit Breaker	Resilience4j	transaction-service → account-service, operator-service
Retry	Resilience4j	Appels Feign inter-services
Timeout	Resilience4j	Appels Feign inter-services
Saga (compensation)	Orchestrateur transaction-service	Transferts inter-opérateurs
Idempotence	reference unique par transaction	transaction-service
Dead Letter Queue	RabbitMQ	Messages non traités
Health Checks	Spring Boot Actuator + K8s probes	Tous les services
Observabilité
Table
Couche	Outil	Rôle
Métriques	Micrometer + Prometheus	JVM, HTTP, métriques custom
Dashboards	Grafana	Visualisation + alertes
Tracing	Zipkin	Traces distribuées (traceId)
Logs	ELK ou Grafana Loki	Centralisation et corrélation
Health	Spring Boot Actuator	/actuator/health, /actuator/info, /actuator/metrics
Endpoints Actuator (Java)
plain
GET /actuator/health/liveness   → Liveness probe (Kubernetes)
GET /actuator/health/readiness → Readiness probe (Kubernetes)
GET /actuator/health           → État global du service
GET /actuator/info             → Informations build
GET /actuator/metrics          → Métriques JVM/custom
Endpoints Health (Python/Node)
plain
GET /health → État du service (200 = OK)
Tests
Tests unitaires
bash
# Java (Maven)
cd backend-java
mvn test

# Python (pytest)
cd services-python/document-ocr-service
pytest

cd services-python/reporting-service
pytest

# Node.js (Jest)
cd services-node/notification-service
npm test

cd services-node/audit-service
npm test
Tests d'intégration
bash
# Lancer la plateforme en mode test
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Exécuter les tests Postman/newman
newman run tests/postman/banking-platform-collection.json
Tests de charge
bash
# k6 — simulation de transactions
k6 run tests/k6/transaction-load-test.js
CI/CD
Le pipeline GitHub Actions (.github/workflows/ci.yml) exécute :
plain
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Build     │ → │    Test     │ → │   Package   │ → │    Push     │
│  (Maven/    │    │  (JUnit/    │    │  (Docker    │    │  (Docker    │
│   npm/pip)  │    │  pytest)    │    │   images)   │    │   Hub/      │
│             │    │             │    │             │    │   Registry) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
Déclencheurs
Push sur main ou develop
Pull Request
Tag de release (v1.0.0)
Équipe
Table
Rôle	Membre	Responsabilité
Architecte	[Nom 1]	Conception DDD, architecture microservices
Backend Java	[Nom 2]	Services cœur (Auth, Account, Transaction, Loan)
Backend Polyglotte	[Nom 3]	Python (OCR, Reporting) + Node.js (Notification, Audit)
Frontend	[Nom 4]	React, intégration API, UX/UI
DevOps / Sécurité	[Nom 5]	Docker, Kubernetes, CI/CD, observabilité
Arborescence du projet
plain
banking-platform/
├── README.md                          # Ce fichier
├── docs/
│   ├── cahier-des-charges.md          # Spécifications fonctionnelles
│   ├── ddd-analysis.md                # Analyse Domain-Driven Design
│   ├── architecture.md                # Document d'architecture
│   └── contracts.md                   # Contrats API + événements
├── infra/
│   ├── docker-compose.yml             # Orchestration Docker (dev)
│   └── k8s/                           # Manifests Kubernetes
│       ├── 00-namespace/
│       ├── 01-infra/                  # RabbitMQ, PostgreSQL
│       ├── 02-config/                 # ConfigMaps
│       ├── 03-secrets/                # Secrets K8s
│       ├── 04-config-server/
│       ├── 05-discovery-server/
│       ├── 06-api-gateway/
│       ├── 07-auth-service/
│       ├── 08-operator-service/
│       ├── 09-account-service/
│       ├── 10-customer-service/
│       ├── 11-transaction-service/
│       ├── 12-loan-service/
│       ├── 13-document-ocr/
│       ├── 14-reporting/
│       ├── 15-notification/
│       ├── 16-audit/
│       ├── 17-frontend/
│       └── 18-ingress/
├── config-repo/                       # Backend Git du Config Server
├── backend-java/                      # Projet Maven multi-module
│   ├── pom.xml                        # POM parent
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
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── app/
│   │   └── tests/
│   └── reporting-service/
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── app/
│       └── tests/
├── services-node/
│   ├── notification-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   └── test/
│   └── audit-service/
│       ├── Dockerfile
│       ├── package.json
│       ├── src/
│       └── test/
├── frontend/                          # React + Vite + TypeScript
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   └── public/
└── .github/workflows/
    └── ci.yml                         # Pipeline CI/CD
Licence
Ce projet est réalisé dans le cadre du TP INF462 — Architecture Logicielle à l'Université de Yaoundé I sous la supervision du Pr. Kimbi Xaveria.
© 2026 — Équipe INF462. Tous droits réservés.
Pour toute question ou suggestion :
📚 Documentation API : Disponible via Swagger à /swagger-ui.html sur chaque service Java, ou /docs sur les services Python (FastAPI)