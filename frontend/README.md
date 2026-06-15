# Frontend (React + Vite)

## Développement

1. Aller dans le dossier frontend
   ```bash
   cd frontend
   ```
2. Installer les dépendances
   ```bash
   npm install
   ```
3. Lancer le dev server
   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
npm run preview
```

## Configuration Backend (API Gateway)

Le frontend appelle l’API via Axios avec `import.meta.env.VITE_API_URL`.

### Option A — Configuration locale (recommandé pour le dev)
Créer (ou modifier) le fichier :

- `frontend/.env`

Exemple :

```env
VITE_API_URL=http://localhost:8080
```

> Assure-toi que l’API Gateway expose bien les routes `/auth/**`.

### Option B — Runtime via `config-repo` (à mettre en place)

Le dépôt `config-repo/` configure les services côté backend (Spring Cloud Config),
mais React/Vite ne lit pas automatiquement ces fichiers au runtime.

Pour brancher `VITE_API_URL` sur `config-repo` sans `.env` local, il faut mettre en place
une **approche runtime**, par exemple :
- un endpoint backend `/config` renvoyant `apiUrl`
- ou un fichier statique généré à l’exécution (`/config.js`) chargé par `index.html`

Cette approche n’est pas encore implémentée.

## Dépannage — 404 sur `/auth/login`

Si `POST /auth/login` renvoie `404` depuis le navigateur :
- vérifier que `VITE_API_URL` pointe bien vers l’API Gateway (ex: `http://localhost:8080`)
- vérifier que l’API Gateway a bien une route `Path=/auth/**` vers `auth-service`
- vérifier que l’auth-service expose bien `POST /auth/login`.

## Scripts

- `npm run dev` : lance Vite
- `npm run build` : build prod
- `npm run preview` : prévisualisation build

