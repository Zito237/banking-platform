# Point d'entree du document-ocr-service
from fastapi import FastAPI
from consumer import start_consumer
from routes import router
from config import PORT

# Creation de l'application FastAPI
app = FastAPI(
    title="Document OCR Service",
    description="Service d'extraction OCR/IA des documents de la plateforme bancaire",
    version="1.0.0"
)

# Inclusion des routes
app.include_router(router, prefix="/api")


@app.on_event("startup")
def startup_event():
    # Demarre le consommateur RabbitMQ au lancement
    print("[OCR] Demarrage du consommateur RabbitMQ...")
    start_consumer()
    print(f"[OCR] Service pret sur le port {PORT}")


@app.on_event("shutdown")
def shutdown_event():
    # Nettoyage a l'arret
    print("[OCR] Arret du service...")
