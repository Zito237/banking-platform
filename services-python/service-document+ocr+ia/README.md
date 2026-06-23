# document-ocr-service

Service d'extraction OCR/IA des documents de la plateforme bancaire.

## Role

- Recoit des images (CNI, passeport, etc.) via HTTP POST
- Pretraite l'image (niveaux de gris + seuillage Otsu avec OpenCV)
- Extrait le texte avec Tesseract OCR (langues FR + EN)
- Consommateur RabbitMQ : ecoute `document.submitted`, publie `document.processed`

## Stack

- Python 3.11
- FastAPI
- OpenCV (headless)
- Tesseract OCR
- Pytesseract
- Pika (RabbitMQ)
- Pillow

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `POST /api/ocr` | Upload d'image + OCR (multipart/form-data) |

## Variables d'environnement

| Variable | Defaut | Description |
|----------|--------|-------------|
| `PORT` | 9001 | Port du service |
| `RABBITMQ_HOST` | localhost | Hote RabbitMQ |
| `RABBITMQ_PORT` | 5672 | Port RabbitMQ |
| `RABBITMQ_USER` | guest | Utilisateur RabbitMQ |
| `RABBITMQ_PASS` | guest | Mot de passe RabbitMQ |
| `RABBITMQ_EXCHANGE` | banking.events | Exchange topic |
| `RABBITMQ_CONSUMER_QUEUE` | document.ocr.queue | Queue de consommation |
| `TESSERACT_CMD` | /usr/bin/tesseract | Chemin de l'executable Tesseract |

## Lancement local

```bash
# Creer un environnement virtuel
python -m venv venv
source venv/bin/activate

# Installer les dependances
pip install -r requirements.txt

# IMPORTANT : installer Tesseract sur votre machine
# Ubuntu/Debian : sudo apt-get install tesseract-ocr tesseract-ocr-fra
# Windows : https://github.com/UB-Mannheim/tesseract/wiki
# Mac : brew install tesseract tesseract-lang

# Lancer le service
uvicorn app.main:app --host 0.0.0.0 --port 9001 --reload
```

## Test OCR (HTTP)

```bash
curl http://localhost:9001/api/health

curl -X POST http://localhost:9001/api/ocr \
  -F "file=@/chemin/vers/votre/cni.jpg"
```

## Docker

```bash
docker build -t document-ocr-service .
docker run -p 9001:9001 -e RABBITMQ_HOST=rabbitmq document-ocr-service
```

## Docker Compose (local complet)

```bash
docker-compose up --build
```
## manually 
 python -m uvicorn main:app --port 9001 --reload  for ocr
  python -m uvicorn main:app --port 9004 --reload for reporting
