# FinPay — Documentation technique et présentation du projet

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture mise en place](#2-architecture-mise-en-place)
3. [Cartographie des services](#3-cartographie-des-services)
4. [Détail de chaque service](#4-détail-de-chaque-service)
5. [Le frontend (interface utilisateur)](#5-le-frontend-interface-utilisateur)
6. [Flux de communication entre services](#6-flux-de-communication-entre-services)
7. [Rôles et droits d'accès](#7-rôles-et-droits-daccès)
8. [Glossaire des termes techniques](#8-glossaire-des-termes-techniques)
9. [Comment lancer le projet](#9-comment-lancer-le-projet)

---

## 1. Vue d'ensemble

**FinPay** est une plateforme bancaire numérique complète développée sous forme de **microservices**. Elle permet à des clients de gérer leurs comptes bancaires, effectuer des opérations financières (dépôt, retrait, transfert), souscrire et rembourser des prêts, et soumettre des documents d'identité via reconnaissance optique (OCR).

La plateforme est destinée à trois types d'utilisateurs :

| Rôle | Description |
|------|-------------|
| **ADMIN** | Administrateur système, gère opérateurs, comptes, conformité KYC et audit |
| **OPERATOR** | Agent bancaire, traite les demandes de prêt et consulte les rapports |
| **CLIENT** | Titulaire de compte, effectue ses opérations et gère ses prêts |

---

## 2. Architecture mise en place

### Type d'architecture : **Microservices** avec API Gateway

L'architecture microservices consiste à découper une application en **services indépendants**, chacun responsable d'un domaine métier précis, communicant entre eux via le réseau.

```
                        ┌─────────────────────────────────┐
                        │         FRONTEND React          │
                        │        (port 5173)              │
                        └──────────────┬──────────────────┘
                                       │ HTTP/REST
                        ┌──────────────▼──────────────────┐
                        │         API GATEWAY             │
                        │     Spring Cloud (port 8080)    │
                        │   Point d'entrée unique         │
                        └──┬───┬───┬───┬───┬───┬──────────┘
                           │   │   │   │   │   │
           ┌───────────────┘   │   │   │   │   └───────────────┐
           │               ┌───┘   │   │   └───────┐           │
           ▼               ▼       ▼   ▼           ▼           ▼
     ┌──────────┐  ┌──────────┐ ┌────┐ ┌────────┐ ┌────────┐ ┌─────────┐
     │  auth    │  │ account  │ │loan│ │customer│ │operator│ │transact.│
     │  :8081   │  │  :8083   │ │:8086│ │  :8084 │ │  :8082 │ │  :8085  │
     └──────────┘  └──────────┘ └────┘ └────────┘ └────────┘ └─────────┘

        ┌──────────────────────────────────────────────────┐
        │              MESSAGE BROKER (RabbitMQ)           │
        │         Communication asynchrone entre services │
        └──────────────────────────────────────────────────┘

     ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
     │ notif.   │  │  audit   │  │reporting │  │   OCR    │
     │  :9002   │  │  :9003   │  │  :9004   │  │  :9001   │
     │ NestJS   │  │ NestJS   │  │ FastAPI  │  │ FastAPI  │
     └──────────┘  └──────────┘  └──────────┘  └──────────┘

     ┌──────────────────────────────────────────────────┐
     │           INFRASTRUCTURE (Spring Cloud)          │
     │   Discovery Server (Eureka) :8761               │
     │   Config Server               :8888             │
     └──────────────────────────────────────────────────┘
```

### Pourquoi cette architecture ?

| Avantage | Explication |
|----------|-------------|
| **Indépendance** | Chaque service peut être modifié, redémarré ou mis à jour sans impacter les autres |
| **Scalabilité** | On peut dupliquer uniquement le service surchargé (ex. : transaction-service) |
| **Technologie libre** | Chaque service choisit son langage : Java, Node.js, Python |
| **Isolation des pannes** | La panne d'un service n'entraîne pas la chute de toute l'application |
| **Responsabilité unique** | Chaque service ne fait qu'une chose et la fait bien (principe SRP) |

### Technologies utilisées par couche

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite, Axios |
| Backend Java | Spring Boot 3.2, Spring Cloud, Spring Security, JPA/Hibernate |
| Backend Node.js | NestJS (TypeScript), JSON file storage |
| Backend Python | FastAPI, SQLite, Tesseract OCR, Pillow |
| Messagerie | RabbitMQ (broker de messages asynchrones) |
| Base de données | H2 (fichier, une BD par service Java), SQLite (reporting) |
| Authentification | JWT (JSON Web Token) |
| Service mesh | Eureka (découverte), Spring Cloud Gateway (routage) |

---

## 3. Cartographie des services

| # | Service | Port | Langage/Framework | Rôle principal |
|---|---------|------|-------------------|----------------|
| 1 | **discovery-server** | 8761 | Java / Spring Eureka | Annuaire de services |
| 2 | **config-server** | 8888 | Java / Spring Cloud Config | Configuration centralisée |
| 3 | **api-gateway** | 8080 | Java / Spring Cloud Gateway | Point d'entrée unique |
| 4 | **auth-service** | 8081 | Java / Spring Security | Authentification, JWT |
| 5 | **operator-service** | 8082 | Java / Spring Boot | Gestion des opérateurs |
| 6 | **account-service** | 8083 | Java / Spring Boot | Comptes bancaires |
| 7 | **customer-service** | 8084 | Java / Spring Boot | Profils clients, KYC |
| 8 | **transaction-service** | 8085 | Java / Spring Boot | Opérations financières |
| 9 | **loan-service** | 8086 | Java / Spring Boot | Prêts et remboursements |
| 10 | **notification-service** | 9002 | Node.js / NestJS | Notifications utilisateur |
| 11 | **audit-service** | 9003 | Node.js / NestJS | Journal d'audit |
| 12 | **reporting-service** | 9004 | Python / FastAPI | Statistiques et rapports |
| 13 | **ocr-service** | 9001 | Python / FastAPI + Tesseract | Lecture de documents d'identité |

---

## 4. Détail de chaque service

---

### 4.1 Discovery Server (Eureka) — port 8761

**Rôle :** Annuaire centralisé où tous les services s'enregistrent au démarrage.

Quand le `transaction-service` veut appeler l'`account-service`, il ne connaît pas son adresse IP. Il demande à Eureka : "où est `account-service` ?" et Eureka lui répond avec l'adresse dynamique.

- Interface web : `http://localhost:8761`
- Technologie : Spring Netflix Eureka Server
- Aucune base de données

---

### 4.2 Config Server — port 8888

**Rôle :** Fournit les fichiers de configuration à tous les services Java au démarrage, depuis le dossier `config-repo/`.

Sans config server, chaque service aurait son propre fichier de config. Avec lui, toute la configuration est centralisée et modifiable sans recompilation.

- Les configs sont dans : `config-repo/*.yml`
- Technologie : Spring Cloud Config Server

---

### 4.3 API Gateway — port 8080

**Rôle :** Porte d'entrée unique de toute la plateforme. Reçoit toutes les requêtes du frontend et les redirige vers le bon service backend.

Exemples de routage :
- `POST /auth/login` → auth-service:8081
- `GET /accounts/{id}` → account-service:8083
- `POST /transactions/repayment` → transaction-service:8085

**Fonctionnalités supplémentaires :**
- Vérification du token JWT sur chaque requête protégée
- Protection CORS (autorise uniquement les appels depuis le frontend)
- Circuit Breaker (coupe les appels si un service est indisponible)

---

### 4.4 Auth Service — port 8081

**Rôle :** Gère l'inscription, la connexion et la génération des tokens JWT.

**Endpoints principaux :**
- `POST /auth/register` — Créer un compte (CLIENT par défaut)
- `POST /auth/login` — Connexion, retourne un token JWT
- `POST /auth/operators` — Créer un compte OPERATOR (admin seulement)
- `GET /auth/me` — Retourne les infos de l'utilisateur connecté

**Base de données :** H2 fichier `data/auth/`

Stocke : `username`, `password` (haché en BCrypt), `role` (ADMIN/OPERATOR/CLIENT)

---

### 4.5 Operator Service — port 8082

**Rôle :** Gère les profils des opérateurs (agents bancaires) et leurs commissions sur les transferts inter-opérateurs.

**Endpoints principaux :**
- `POST /operators` — Créer un opérateur
- `GET /operators` — Lister les opérateurs
- `GET /operators/{id}/commission?amount=X` — Calculer la commission sur un transfert

**Base de données :** H2 fichier `data/operator/`

Stocke : nom, prénom, email, taux de commission (%)

---

### 4.6 Account Service — port 8083

**Rôle :** Gère les comptes bancaires (création, solde, débit, crédit).

**Types de comptes supportés :**
- `COURANT` — Compte courant classique
- `EPARGNE` — Compte épargne
- `PORTEFEUILLE` — Portefeuille électronique

**Endpoints principaux :**
- `POST /accounts` — Ouvrir un compte
- `GET /accounts/customer/{id}` — Comptes d'un client
- `POST /accounts/{id}/debit` — Débiter (retirer de l'argent)
- `POST /accounts/{id}/credit` — Créditer (ajouter de l'argent)

**Règles métier :**
- Refuse un débit si le solde est insuffisant (erreur 409 "Solde insuffisant")
- Le solde ne peut pas être négatif

**Base de données :** H2 fichier `data/account/`

---

### 4.7 Customer Service — port 8084

**Rôle :** Gère les profils clients (informations personnelles) et le processus KYC (vérification d'identité par document).

**Endpoints principaux :**
- `POST /customers` — Créer un profil client
- `GET /customers/{id}` — Consulter un profil
- `POST /documents` — Soumettre un document d'identité
- `POST /documents/{id}/process` — Enregistrer le résultat de l'OCR
- `GET /documents` — Lister tous les documents (admin)
- `PATCH /documents/{id}/verify` — Valider manuellement un document (admin)

**Statuts KYC d'un client :**
- `PENDING` — En attente de document
- `SUBMITTED` — Document soumis, en cours de vérification
- `VERIFIED` — Identité vérifiée

**Base de données :** H2 fichier `data/customer/`

---

### 4.8 Transaction Service — port 8085

**Rôle :** Exécute toutes les opérations financières et en conserve l'historique.

**Types de transactions :**
- `DEPOSIT` — Dépôt d'argent
- `WITHDRAWAL` — Retrait d'argent
- `TRANSFER_INTRA` — Transfert entre deux clients du même opérateur (sans frais)
- `TRANSFER_INTER` — Transfert entre deux opérateurs différents (avec commission)
- `REPAYMENT` — Remboursement d'une mensualité de prêt

**Endpoints principaux :**
- `POST /transactions/deposit`
- `POST /transactions/withdrawal`
- `POST /transactions/transfer`
- `POST /transactions/repayment`
- `GET /transactions/history/{accountId}`

**Pattern utilisé pour les transferts inter-opérateurs : SAGA compensatoire**
Si le débit réussit mais que le crédit échoue, le service effectue automatiquement un remboursement (compensation) pour annuler le débit.

**Communication :** Appelle account-service via **Feign** (HTTP synchrone) protégé par un **Circuit Breaker** (Resilience4j).

**Base de données :** H2 fichier `data/transaction/`

---

### 4.9 Loan Service — port 8086

**Rôle :** Gère le cycle de vie complet des prêts : demande, décision, échéancier, remboursement mensualité par mensualité.

**Cycle de vie d'un prêt :**
```
SUBMITTED → (opérateur décide) → APPROVED ou REJECTED
APPROVED → génération de l'échéancier → remboursements mensuels → PAID_OFF
```

**Endpoints principaux :**
- `POST /loans/applications` — Soumettre une demande de prêt
- `GET /loans/applications` — Lister les demandes (opérateur)
- `POST /loans/applications/{id}/decision` — Approuver/Rejeter
- `GET /loans/{loanId}/schedule` — Voir l'échéancier
- `POST /loans/{loanId}/repay` — Rembourser une mensualité

**Calcul de l'échéancier (amortissement linéaire) :**
- Part capital = Montant ÷ Durée (mois)
- Part intérêts = Montant × (taux annuel ÷ 12)
- Mensualité = Part capital + Part intérêts

**Base de données :** H2 fichier `data/loan/`

---

### 4.10 Notification Service — port 9002

**Rôle :** Écoute les événements publiés sur RabbitMQ et génère des notifications lisibles pour les utilisateurs.

**Événements écoutés :**
- Transaction complétée → notification de débit/crédit
- Transaction échouée → notification d'échec
- Prêt approuvé / rejeté → notification de décision

**Stockage :** Fichier JSON (pas de base de données relationnelle)

**Technologie :** NestJS (Node.js) + consumer AMQP

---

### 4.11 Audit Service — port 9003

**Rôle :** Enregistre toutes les actions importantes de la plateforme à des fins de traçabilité et conformité réglementaire.

**Chaque entrée d'audit contient :**
- `actor` — Qui a effectué l'action (ex : `client:uuid`, `system:loan-service`)
- `action` — Ce qui a été fait (ex : `TRANSACTION_COMPLETED`)
- `resource` — Le type de ressource concernée (transaction, loan, user…)
- `timestamp` — Date et heure précise

**Interface de consultation :** `http://localhost:9003/audit` (avec filtres et pagination)

**Technologie :** NestJS (Node.js) + stockage JSON fichier

---

### 4.12 Reporting Service — port 9004

**Rôle :** Agrège les données de transactions et de prêts pour produire des statistiques et graphiques.

**Données produites :**
- Volume total des transactions par type
- Frais collectés
- Nombre de transactions par période
- Statistiques des prêts (montant approuvé, taux moyen, durée moyenne)

**Endpoints :**
- `GET /api/report/transactions?from=&to=` — Statistiques transactions
- `GET /api/report/loans` — Statistiques prêts
- `POST /api/report/backfill` — Recalcule toutes les statistiques depuis zéro

**Technologie :** Python FastAPI + SQLite

---

### 4.13 OCR Service — port 9001

**Rôle :** Analyse une photo de document d'identité (CNI, passeport) et en extrait automatiquement les informations grâce à la reconnaissance optique de caractères.

**Informations extraites :**
- Nom et prénom
- Date de naissance
- Numéro de document
- Score de confiance (0–100 %) : indique la fiabilité de la lecture

**Fonctionnement :**
1. Le frontend envoie une image (JPG/PNG)
2. L'OCR service la prétraite (niveaux de gris, seuillage)
3. Tesseract analyse l'image et extrait le texte
4. Un parseur structure les données extraites
5. Le résultat (avec le score de confiance) est renvoyé au frontend

**Technologie :** Python FastAPI + Tesseract OCR + Pillow (traitement d'image)

---

## 5. Le frontend (interface utilisateur)

**Technologie :** React 18 + TypeScript + Tailwind CSS + Vite

**URL :** `http://localhost:5173`

**Routing conditionnel par rôle :**

### Espace CLIENT
| Page | Fonctionnalité |
|------|---------------|
| Profil | Informations personnelles |
| Comptes | Liste des comptes et soldes |
| Dépôt | Alimenter un compte |
| Retrait | Retirer de l'argent |
| Transfert | Envoyer de l'argent à un autre compte |
| Historique | Toutes les transactions passées |
| Prêts | Demander un prêt, voir l'échéancier |
| Remboursement | Payer une mensualité |
| Documents KYC | Soumettre un document d'identité via OCR |
| Notifications | Alertes sur les opérations |

### Espace ADMIN
| Page | Fonctionnalité |
|------|---------------|
| Opérateurs | Créer et gérer les agents bancaires |
| Utilisateurs | Liste de tous les comptes |
| Comptes | Vue globale des comptes bancaires |
| Documents KYC | Valider ou rejeter les documents soumis |
| Audit | Journal complet des actions (filtrable) |
| Rapports | Graphiques et statistiques globales |
| Services | Santé de tous les microservices |

### Espace OPERATOR
| Page | Fonctionnalité |
|------|---------------|
| Demandes de prêt | Approuver ou rejeter les demandes |
| Rapports | Statistiques filtrées par période |

---

## 6. Flux de communication entre services

### Communication synchrone (HTTP/Feign)

Utilisée quand la réponse est nécessaire immédiatement.

```
Frontend → Gateway → loan-service → transaction-service → account-service
                                             ↑
                                       (Feign client)
```

### Communication asynchrone (RabbitMQ)

Utilisée pour les événements non bloquants (notifications, audit).

```
transaction-service ──PUBLISH──► RabbitMQ ──CONSUME──► notification-service
loan-service        ──PUBLISH──► RabbitMQ ──CONSUME──► notification-service
                                           ──CONSUME──► audit-service
                                           ──CONSUME──► reporting-service
```

**Événements publiés :**
- `transaction.completed` — Transaction réussie
- `transaction.failed` — Transaction échouée
- `loan.approved` — Prêt approuvé
- `loan.rejected` — Prêt rejeté

### Flux OCR KYC (F14)

```
1. Client téléverse une photo       [Frontend]
2. Image envoyée directement au     [OCR Service :9001]
3. OCR retourne: nom, prénom,       [Frontend reçoit le résultat]
   date, numéro, confiance
4. Client valide et soumet          [Frontend]
5. Document créé en base            [customer-service :8084]
6. Résultat OCR enregistré          [customer-service :8084]
   (statut KYC → SUBMITTED)
7. Admin valide manuellement →      [customer-service :8084]
   statut KYC → VERIFIED
```

---

## 7. Rôles et droits d'accès

### Comptes de test

| Utilisateur | Mot de passe | Rôle |
|-------------|-------------|------|
| `admin` | `admin123` | ADMIN |
| `orange` | `123456` | OPERATOR |
| *(à créer)* | *(libre)* | CLIENT (via inscription) |

### Hiérarchie des droits

```
ADMIN
 ├─ Crée les OPERATOR
 ├─ Voit tous les comptes clients
 ├─ Valide les documents KYC
 ├─ Consulte le journal d'audit
 └─ Accède aux rapports globaux

OPERATOR
 ├─ Approuve / rejette les demandes de prêt
 └─ Consulte ses propres rapports

CLIENT
 ├─ Gère ses comptes
 ├─ Effectue des opérations
 ├─ Souscrit des prêts
 └─ Soumet ses documents KYC
```

---

## 8. Glossaire des termes techniques

### Architecture et infrastructure

| Terme | Signification |
|-------|--------------|
| **Microservices** | Architecture où l'application est découpée en petits services indépendants, chacun avec sa propre base de données et déployable séparément |
| **API Gateway** | Composant qui reçoit toutes les requêtes et les redirige vers le bon service backend. C'est le "gardien de la porte" |
| **Eureka (Service Discovery)** | Annuaire dynamique des services. Chaque service s'y enregistre et peut y chercher les adresses des autres |
| **Config Server** | Serveur centralisé qui distribue les fichiers de configuration à tous les services au démarrage |
| **Circuit Breaker** | Mécanisme qui coupe automatiquement les appels vers un service défaillant et retourne une réponse de secours, pour éviter les cascades de pannes |
| **Resilience4j** | Bibliothèque Java qui implémente le Circuit Breaker et les politiques de retry |
| **Load Balancer** | Répartiteur de charge qui distribue les requêtes entre plusieurs instances du même service |
| **CORS** | Cross-Origin Resource Sharing — règle de sécurité du navigateur qui contrôle quels domaines ont le droit d'appeler une API |

### Authentification et sécurité

| Terme | Signification |
|-------|--------------|
| **JWT** | JSON Web Token — identifiant numérique signé, émis après connexion. Contient les infos de l'utilisateur (rôle, ID) et évite d'aller consulter la base à chaque requête |
| **Bearer Token** | Mode d'envoi du JWT : il est mis dans le header HTTP `Authorization: Bearer <token>` |
| **BCrypt** | Algorithme de hachage des mots de passe. Le mot de passe en clair n'est jamais stocké en base |
| **RBAC** | Role-Based Access Control — contrôle d'accès basé sur les rôles (ADMIN, OPERATOR, CLIENT) |
| **Spring Security** | Framework Java qui protège les endpoints et vérifie les tokens JWT |

### Banque et conformité

| Terme | Signification |
|-------|--------------|
| **KYC** | Know Your Customer (Connaître son client) — procédure réglementaire obligatoire qui oblige les banques à vérifier l'identité de leurs clients avant de leur ouvrir un compte ou accorder un crédit |
| **AML** | Anti-Money Laundering (Lutte contre le blanchiment d'argent) — ensemble de contrôles pour détecter les transactions suspectes |
| **Audit trail** | Journal immuable et chronologique de toutes les actions effectuées sur la plateforme, obligatoire pour la traçabilité réglementaire |
| **Amortissement linéaire** | Mode de calcul des mensualités d'un prêt où la part capital reste constante chaque mois |
| **Échéancier** | Tableau des mensualités d'un prêt : date d'échéance, montant total, part capital, part intérêts |
| **Saga compensatoire** | Pattern de gestion des transactions distribuées : si une étape échoue, les étapes précédentes sont annulées automatiquement |

### Communication et messagerie

| Terme | Signification |
|-------|--------------|
| **RabbitMQ** | Broker de messages asynchrones. Un service publie un événement ("transaction réussie") et d'autres services le consomment indépendamment, sans couplage direct |
| **AMQP** | Protocol de messagerie utilisé par RabbitMQ |
| **Exchange** | Point de distribution dans RabbitMQ : reçoit les messages et les route vers les bonnes files (queues) |
| **Routing Key** | Clé de routage qui détermine quelle file reçoit quel type de message (ex : `transaction.completed`) |
| **Feign Client** | Client HTTP déclaratif de Spring Cloud : permet d'appeler un autre microservice comme s'il s'agissait d'une méthode Java locale |
| **REST/JSON** | Style d'API standard : les données sont échangées au format JSON via HTTP |

### Technologies frontales

| Terme | Signification |
|-------|--------------|
| **React** | Bibliothèque JavaScript pour construire des interfaces utilisateur sous forme de composants réutilisables |
| **TypeScript** | Surcouche de JavaScript avec typage statique — détecte les erreurs avant l'exécution |
| **Tailwind CSS** | Framework CSS utilitaire : on style directement dans le HTML avec des classes prédéfinies |
| **Vite** | Bundler ultra-rapide qui compile et recharge l'application frontend en développement |
| **Axios** | Bibliothèque HTTP pour faire des appels API depuis le frontend |
| **SPA** | Single Page Application — l'application charge une seule page HTML et navigue sans rechargement complet |

### Intelligence artificielle et OCR

| Terme | Signification |
|-------|--------------|
| **OCR** | Optical Character Recognition (Reconnaissance Optique de Caractères) — technologie qui lit du texte dans une image |
| **Tesseract** | Moteur OCR open-source de Google, intégré dans le service Python |
| **Prétraitement** | Transformation de l'image avant OCR : conversion en niveaux de gris, seuillage (binarisation) pour améliorer la lisibilité |
| **Score de confiance** | Pourcentage (0–100%) indiquant la fiabilité de la lecture OCR. En dessous de 70%, le document doit être relu manuellement |
| **FastAPI** | Framework Python moderne et rapide pour créer des API REST |

### Bases de données

| Terme | Signification |
|-------|--------------|
| **H2** | Base de données SQL embarquée en Java, utilisée en mode fichier (les données persistent entre les redémarrages) |
| **JPA/Hibernate** | ORM (Object-Relational Mapping) Java : traduit automatiquement les objets Java en tables SQL |
| **SQLite** | Base de données SQL légère sous forme de fichier, utilisée par le service reporting |
| **DDL auto** | `hibernate.ddl-auto=update` : Hibernate crée ou met à jour automatiquement les tables au démarrage |

---

## 9. Comment lancer le projet

### Prérequis

| Outil | Version recommandée |
|-------|-------------------|
| Java JDK | 17 ou 21 |
| Maven | 3.9+ |
| Node.js | 18+ |
| Python | 3.10+ |
| RabbitMQ | 3.x (doit être actif sur localhost:5672) |
| Tesseract OCR | 5.x (ajouté au PATH) |

### Étape 1 — Compiler les services Java

Pour chaque dossier dans `backend-java/*/`:
```bash
cd backend-java/<nom-service>/<nom-service>
mvn clean package -DskipTests
```

Ou pour tout compiler d'un coup (depuis la racine) :
```powershell
Get-ChildItem -Path backend-java -Recurse -Filter pom.xml -Depth 2 | ForEach-Object {
    Set-Location $_.DirectoryName
    mvn clean package -DskipTests
}
```

### Étape 2 — Installer les dépendances Python

```bash
cd services-python/service-document+ocr+ia
pip install -r requirements.txt

cd ../service_reporting
pip install -r requirements.txt
```

### Étape 3 — Installer les dépendances Node.js

```bash
cd services-node/notification-service
npm install && npm run build

cd ../audit-service
npm install && npm run build
```

### Étape 4 — Installer les dépendances frontend

```bash
cd frontend
npm install
```

### Étape 5 — Lancer tous les services

```powershell
.\start-all.ps1
```

Attendre environ 60 secondes que tous les services soient prêts.

### Étape 6 — Lancer le frontend

```bash
cd frontend
npm run dev
```

Ouvrir : **http://localhost:5173**

### Comptes de connexion

| Compte | Mot de passe | Accès |
|--------|-------------|-------|
| `admin` | `admin123` | Tableau de bord admin complet |
| `orange` | `123456` | Interface opérateur |
| *(s'inscrire)* | *(libre)* | Interface client |

### Ports de tous les services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |
| Auth Service | http://localhost:8081 |
| Operator Service | http://localhost:8082 |
| Account Service | http://localhost:8083 |
| Customer Service | http://localhost:8084 |
| Transaction Service | http://localhost:8085 |
| Loan Service | http://localhost:8086 |
| OCR Service | http://localhost:9001 |
| Notification Service | http://localhost:9002 |
| Audit Service | http://localhost:9003 |
| Reporting Service | http://localhost:9004 |

---

*Document généré pour la présentation du projet FinPay — Plateforme bancaire microservices.*
