# Services Python

## Aperçu

Ce dossier contient plusieurs services Python. Actuellement visibles :

- `service_reporting/`
- `service-document+ocr+ia/`

Chaque service a ses propres fichiers (config, routes, main) et son propre mécanisme de démarrage.

## Démarrage (recommandation)

### 1) Créer un environnement virtuel (par service)
Exemple (dans un terminal) :

```bash
python -m venv .venv
. .venv\Scripts\activate
```

### 2) Installer les dépendances du service
Par exemple pour `service_reporting` :

```bash
cd service_reporting
pip install -r requirements.txt
```

### 3) Lancer le service

Selon l’entrée de chaque service (souvent `main.py`) :

```bash
python main.py
```

## Exemple Uvicorn (FastAPI)

Si le service est une application ASGI/FastAPI avec un objet `app` dans `main.py` :

```bash
python -m uvicorn main:app --port 9000 --reload
```


## Structure

- `service_reporting/`
  - `main.py`
  - `routes.py`
  - `consumer.py`
  - `config.py`
  - `database.py`

- `service-document+ocr+ia/`
  - `main.py`
  - `routes.py`
  - `consumer.py`
  - `ocr_engine.py`
  - `config.py`

## Dépannage

- Vérifier les variables d’environnement nécessaires (connexions BDD, broker RabbitMQ, URLs, etc.).
- Vérifier que les dépendances `requirements.txt` correspondent à la version Python installée.

