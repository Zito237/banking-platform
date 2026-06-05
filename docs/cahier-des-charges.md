# Cahier des Charges — Plateforme Bancaire Distribuée

> **Projet** : TP INF462 — Architecture Logicielle  
> **Université** : Université de Yaoundé I  
> **Examinateur** : Pr. Kimbi Xaveria  
> **Équipe** : 5 membres  
> **Date de soutenance** : 22 juin 2026

---

## 1. Présentation du projet

### 1.1 Contexte

Dans un écosystème financier africain en pleine mutation, plusieurs opérateurs (banques traditionnelles, microfinances, opérateurs de téléphonie mobile) coexistent mais peinent à offrir une expérience unifiée à leurs clients. Ce projet vise à concevoir et développer une **plateforme financière distribuée multi-opérateurs** où chaque acteur conserve ses propres règles métier tout en offrant à l'utilisateur final une expérience homogène, sécurisée et transparente.

### 1.2 Objectifs

- Concevoir une architecture microservices fondée sur une analyse DDD rigoureuse
- Permettre la coexistence de plusieurs opérateurs financiers dans un même écosystème
- Garantir la sécurité, la traçabilité et la résilience du système
- Démontrer la maîtrise des patterns architecturaux distribués (Gateway, Discovery, Circuit Breaker, Saga, etc.)
- Satisfaire la contrainte d'hétérogénéité technologique (Java, Python, Node.js)

### 1.3 Périmètre

Le système couvre l'ensemble du cycle de vie d'un client dans une plateforme financière multi-opérateurs, de l'inscription jusqu'au remboursement de prêts, en passant par la gestion des comptes, les transactions et l'analyse documentaire par IA.

---

## 2. Besoins fonctionnels

### 2.1 Liste des fonctionnalités obligatoires

| # | Fonctionnalité | Domaine métier | Priorité |
|---|---------------|----------------|----------|
| 1 | Inscription et gestion des clients | Customer | Critique |
| 2 | Gestion des comptes financiers | Account | Critique |
| 3 | Dépôts et retraits | Transaction | Critique |
| 4 | Transferts intra-opérateurs et inter-opérateurs | Transaction | Critique |
| 5 | Demandes de prêts | Loan | Critique |
| 6 | Analyse et validation des dossiers de prêt | Loan | Critique |
| 7 | Génération d'échéanciers de remboursement | Loan | Critique |
| 8 | Remboursement des prêts | Loan | Critique |
| 9 | Notifications liées aux opérations | Notification | Haute |
| 10 | Gestion des administrateurs et opérateurs | Operator / IAM | Haute |
| 11 | Rapports et statistiques | Reporting | Moyenne |
| 12 | Audit et traçabilité | Audit | Haute |
| 13 | Plusieurs mécanismes d'authentification | IAM / Security | Critique |
| 14 | Extraction de documents par OCR + IA | Document Processing | Haute |

### 2.2 Description détaillée des fonctionnalités

#### F1 — Inscription et gestion des clients
- Un utilisateur peut s'inscrire en tant que client en fournissant ses informations personnelles
- Le système vérifie l'unicité de l'identifiant national et de l'email
- Le statut KYC (Know Your Customer) est initialisé à `PENDING`
- Le client peut consulter et modifier son profil
- Le client peut soumettre des documents justificatifs (CNI, passeport, bulletin de paie, etc.)

#### F2 — Gestion des comptes financiers
- Un client peut ouvrir un ou plusieurs comptes (courant, épargne, portefeuille mobile)
- Chaque compte est associé à un opérateur et a un numéro unique
- Le solde est initialisé à zéro et la devise est le XAF (Franc CFA)
- Des plafonds de transaction peuvent être définis par opérateur
- Le statut du compte peut être ACTIF, BLOQUÉ ou CLOS

#### F3 — Dépôts et retraits
- Un client peut effectuer un dépôt sur l'un de ses comptes
- Un client peut effectuer un retrait (si le solde le permet)
- Chaque opération génère une transaction traçable avec une référence unique
- Les opérations sont protégées contre les accès concurrents (verrouillage optimiste)

#### F4 — Transferts intra-opérateurs et inter-opérateurs
- **Intra-opérateur** : transfert entre deux comptes du même opérateur (simple, atomique)
- **Inter-opérateurs** : transfert entre comptes d'opérateurs différents (pattern Saga avec compensation)
- Calcul automatique des commissions selon les règles de l'opérateur
- Traçabilité complète via événements asynchrones

#### F5 — Demandes de prêts
- Un client peut soumettre une demande de prêt en précisant le montant et l'objet
- La demande passe par un workflow : `SOUMISE` → `EN ÉTUDE` → `APPROUVÉE` / `REJETÉE`
- Les documents justificatifs enrichissent le dossier de prêt (via OCR)

#### F6 — Analyse et validation des dossiers de prêt
- Un opérateur peut consulter les demandes de prêt de son périmètre
- L'opérateur peut approuver ou rejeter une demande avec un motif
- L'approbation déclenche la création du prêt et la génération de l'échéancier

#### F7 — Génération d'échéanciers de remboursement
- Calcul automatique des mensualités (capital + intérêts) sur la durée du prêt
- Chaque mensualité a une date d'échéance, un montant, une part capital et une part intérêts
- Suivi du statut de chaque mensualité : `EN ATTENTE`, `PAYÉE`, `EN RETARD`

#### F8 — Remboursement des prêts
- Le client peut rembourser une mensualité en cours
- Le paiement débite le compte du client et met à jour le statut de la mensualité
- Si toutes les mensualités sont payées, le prêt passe au statut `REMBOURSÉ`

#### F9 — Notifications liées aux opérations
- Le client est notifié par email/SMS (simulé en démo) lors des événements clés :
  - Transaction réussie / échouée
  - Prêt approuvé / rejeté
  - Ouverture de compte
  - Rappel de mensualité

#### F10 — Gestion des administrateurs et opérateurs
- L'administrateur peut créer, modifier, suspendre des opérateurs
- Chaque opérateur a des règles métier configurables (taux de commission, plafonds)
- L'administrateur peut consulter les rapports globaux et les journaux d'audit

#### F11 — Rapports et statistiques
- Volumes de transactions par opérateur et par période
- Nombre de prêts approuvés, montants totaux
- Tableaux de bord pour les opérateurs et l'administrateur

#### F12 — Audit et traçabilité
- Journal immuable de tous les événements métier
- Recherche filtrée par acteur, action, ressource, période
- Consultation réservée à l'administrateur

#### F13 — Plusieurs mécanismes d'authentification
- Authentification par nom d'utilisateur / mot de passe (JWT)
- Rôles distincts : CLIENT, OPERATEUR, ADMIN
- Chaque rôle a des permissions spécifiques sur les endpoints
- Validation du token JWT à l'API Gateway

#### F14 — Extraction de documents par OCR + IA
- Upload de documents image (CNI, passeport, etc.)
- Prétraitement de l'image (niveaux de gris, seuillage Otsu)
- Extraction OCR avec Tesseract (langues FR + EN)
- Renvoi des champs extraits avec score de confiance
- Alimentation automatique du KYC et du dossier de prêt

---

## 3. Besoins non fonctionnels

### 3.1 Performance

| Exigence | Valeur cible |
|----------|-------------|
| Temps de réponse API (p95) | < 500 ms |
| Temps de traitement OCR | < 5 secondes |
| Débit transactions | > 100 TPS par instance |
| Disponibilité | 99.9% (3 nœuds Kubernetes) |

### 3.2 Sécurité

| Exigence | Implémentation |
|----------|---------------|
| Authentification | JWT avec expiration et signature HMAC |
| Autorisation | RBAC (Role-Based Access Control) |
| Protection des données | Chiffrement des mots de passe (BCrypt) |
| Secrets | Config Server + Kubernetes Secrets |
| Isolation | Database-per-service |
| Audit | Journal immuable de tous les événements |

### 3.3 Résilience

| Exigence | Implémentation |
|----------|---------------|
| Tolérance aux pannes | Circuit Breaker (Resilience4j) |
| Compensation | Pattern Saga pour transactions distribuées |
| Redondance | Replicas Kubernetes (≥2 pour Gateway et Account) |
| Health checks | Liveness / Readiness probes |
| Graceful degradation | Fallbacks explicites sur appels inter-services |

### 3.4 Évolutivité (Scalabilité)

| Exigence | Implémentation |
|----------|---------------|
| Scalabilité horizontale | Kubernetes HPA (Horizontal Pod Autoscaler) |
| Scalabilité des données | DB-per-service, pas de base partagée |
| Découplage | Communication asynchrone par événements |
| Stateless | Services sans état session (state externalisé) |

### 3.5 Maintenabilité

| Exigence | Implémentation |
|----------|---------------|
| Documentation API | Swagger / OpenAPI auto-généré |
| Observabilité | Prometheus + Grafana + Zipkin + logs centralisés |
| CI/CD | Pipeline GitHub Actions (build → test → image) |
| Configuration | Config Server centralisé (Git backend) |
| Conteneurisation | Docker + Kubernetes |

### 3.6 Contraintes techniques

| Contrainte | Décision |
|------------|----------|
| Hétérogénéité langages | Java (cœur + infra) + Python (OCR + reporting) + Node.js (notification + audit) |
| Communication sync + async | REST/Feign (sync) + RabbitMQ (async) |
| Conteneurisation | Docker obligatoire, Kubernetes obligatoire |
| Database-per-service | PostgreSQL par microservice |
| Patterns architecturaux | Gateway, Discovery, Circuit Breaker, Saga, DTO, DAO, Pub/Sub |

---

## 4. Acteurs et cas d'utilisation

### 4.1 Acteurs

| Acteur | Description |
|--------|-------------|
| **Client** | Utilisateur final qui s'inscrit, gère ses comptes, effectue des transactions et demande des prêts |
| **Opérateur** | Employé d'un opérateur financier qui valide les prêts et consulte les rapports de son périmètre |
| **Administrateur** | Super-utilisateur qui gère les opérateurs, consulte les rapports globaux et les journaux d'audit |
| **Système OCR/IA** | Acteur secondaire qui extrait automatiquement les informations des documents soumis |

### 4.2 Cas d'utilisation par acteur

#### Client
- S'inscrire
- S'authentifier
- Soumettre des documents (CNI, passeport, etc.)
- Consulter ses comptes
- Effectuer un dépôt
- Effectuer un retrait
- Effectuer un transfert (intra / inter)
- Demander un prêt
- Consulter l'échéancier de son prêt
- Rembourser une mensualité
- Consulter ses notifications

#### Opérateur
- S'authentifier
- Définir / gérer les règles métier de son opérateur
- Analyser un dossier de prêt
- Valider / rejeter un prêt
- Consulter les rapports de son périmètre

#### Administrateur
- S'authentifier
- Gérer les opérateurs (CRUD)
- Gérer les utilisateurs
- Consulter les rapports globaux
- Consulter les journaux d'audit

#### Système OCR/IA
- Extraire les informations d'un document (inclus dans « Soumettre des documents »)

### 4.3 Relations entre cas d'utilisation

- **« Soumettre des documents »** *include* **« Extraire les informations (OCR) »**
- **« Demander un prêt »** *include* **« S'authentifier »**
- **« Effectuer un transfert »** *extend* **« Calculer les commissions »** (cas inter-opérateurs)
- **Généralisation** : Opérateur et Administrateur héritent de l'acteur abstrait « Utilisateur authentifié »

---

## 5. Règles métier

### 5.1 Règles de transaction

| Règle | Description |
|-------|-------------|
| R1 | Un retrait ne peut être effectué que si le solde du compte est suffisant |
| R2 | Un transfert inter-opérateurs déclenche le calcul de commission selon les règles de l'opérateur source |
| R3 | En cas d'échec d'une étape du transfert inter-opérateurs, une compensation est exécutée (re-crédit du compte source) |
| R4 | Chaque transaction a une référence unique pour garantir l'idempotence |
| R5 | Les opérations de crédit/débit sont protégées par verrouillage optimiste (`@Version`) |

### 5.2 Règles de prêt

| Règle | Description |
|-------|-------------|
| R6 | Une demande de prêt doit être approuvée par un opérateur avant déblocage |
| R7 | L'échéancier est généré automatiquement à l'approbation avec mensualités fixes (amortissement linéaire) |
| R8 | Le remboursement d'une mensualité débite le compte du client via le service de transaction |
| R9 | Si toutes les mensualités sont payées, le prêt passe au statut `PAID_OFF` |

### 5.3 Règles d'opérateur

| Règle | Description |
|-------|-------------|
| R10 | Chaque opérateur a un taux de commission configurable pour les transferts inter-opérateurs |
| R11 | Chaque opérateur a des plafonds de transaction configurables par type de compte |
| R12 | Un opérateur suspendu ne peut plus recevoir de nouvelles transactions |

### 5.4 Règles de sécurité

| Règle | Description |
|-------|-------------|
| R13 | Toutes les routes (sauf `/auth/login` et `/auth/register`) exigent un JWT valide |
| R14 | Un CLIENT ne peut accéder qu'à ses propres comptes et transactions |
| R15 | Un OPÉRATEUR ne peut consulter que les données de son opérateur |
| R16 | Un ADMIN a accès à toutes les ressources |
| R17 | Aucun secret (mot de passe DB, clé JWT) ne doit figurer en clair dans le code |

---

## 6. Interfaces utilisateur

### 6.1 Espace Client
- Page de connexion / inscription
- Tableau de bord (solde, dernières transactions)
- Formulaire de dépôt / retrait / transfert
- Formulaire de demande de prêt
- Upload de documents (drag & drop)
- Vue de l'échéancier
- Centre de notifications

### 6.2 Espace Opérateur
- Tableau de bord des demandes de prêt en attente
- Écran de décision (approuver / rejeter avec motif)
- Consultation des rapports de son périmètre
- Gestion des règles métier

### 6.3 Espace Administrateur
- Gestion des opérateurs (CRUD)
- Gestion des utilisateurs
- Rapports globaux (graphiques, tableaux)
- Journal d'audit (filtrage, recherche)
- Vue d'ensemble du système (Eureka, métriques)

---

## 7. Livrables attendus

| # | Livrable | Format |
|---|----------|--------|
| 1 | Cahier des charges fonctionnel et non fonctionnel | Markdown |
| 2 | Étude DDD complète (sous-domaines, bounded contexts, agrégats, événements) | Markdown + diagrammes |
| 3 | Proposition d'architecture microservices justifiée | Markdown + diagrammes |
| 4 | Diagrammes UML (classes, cas d'utilisation, séquence, composants/déploiement) | PlantUML / draw.io |
| 5 | Code source complet | GitHub |
| 6 | Documentation technique + APIs | Swagger / OpenAPI |
| 7 | Fichiers Docker (un Dockerfile par service) | Docker |
| 8 | Fichiers Kubernetes (Deployments, Services, ConfigMaps, Secrets, Ingress) | YAML |
| 9 | Documentation CI/CD | Markdown |
| 10 | Démonstration fonctionnelle | Vidéo / Live |
| 11 | Rapport technique (choix, difficultés, compromis, perspectives) | PDF / Markdown |

---

## 8. Planning de réalisation (7 jours intensifs)

| Jour | Objectif | Livrables |
|------|----------|-----------|
| **Jour 1** | Analyse métier, DDD & cadrage | Cahier des charges, DDD analysis, context map, dépôt GitHub |
| **Jour 2** | Socle d'infrastructure | Config Server, Eureka, Gateway, CI pipeline, RabbitMQ |
| **Jour 3** | Services métier cœur Java | Auth, Customer, Account (CRUD + JWT + DB-per-service) |
| **Jour 4** | Transactions, Prêts & messagerie | Transaction (Saga), Loan, Operator, RabbitMQ events |
| **Jour 5** | Services polyglottes | OCR Python, Reporting Python, Notification Node, Audit Node |
| **Jour 6** | Frontend, intégration, sécurité | React UI (3 espaces), intégration bout-en-bout, tests |
| **Jour 7** | Conteneurisation, K8s, observabilité, démo | Docker, Kubernetes, Grafana, rapport, slides |

> **Tampon** : les jours restants avant le 22 juin sont réservés aux tests, corrections, répétitions et finalisation du rapport.

---

*Document généré à partir de l'analyse du Guide d'Exécution INF462 — Juin 2026*
