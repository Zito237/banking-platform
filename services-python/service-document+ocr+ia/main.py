# Point d'entree du document-ocr-service
from fastapi import FastAPI
from consumer import start_consumer
from routes import router
from config import PORT
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Users\PC\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'

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
    print("[OCR] Demarrage du consommateur RabbitMQ...")
    start_consumer()
    print(f"[OCR] Service pret sur le port {PORT}")

@app.on_event("shutdown")
def shutdown_event():
    print("[OCR] Arret du service...")