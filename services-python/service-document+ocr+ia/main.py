# Point d'entree du document-ocr-service
from fastapi import FastAPI
import pytesseract

from consumer import start_consumer
from routes import router
from config import PORT, TESSERACT_CMD

# Tesseract path resolution (Windows + env override)
# - Prefer env var TESSERACT_CMD (see config.py)
# - Otherwise try common Windows install locations
_candidate_paths = []
if TESSERACT_CMD:
    _candidate_paths.append(TESSERACT_CMD)

_candidate_paths.extend(
    [
        r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
        r"C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
    ]
)

import os
_user_profile = os.getenv("USERPROFILE")
if _user_profile:
    _candidate_paths.append(
        os.path.join(
            _user_profile,
            "AppData",
            "Local",
            "Programs",
            "Tesseract-OCR",
            "tesseract.exe",
        )
    )

_found = None
for p in _candidate_paths:
    if p and os.path.exists(p):
        _found = p
        break

if _found:
    pytesseract.pytesseract.tesseract_cmd = _found
else:
    # If tesseract is already on PATH, pytesseract can work without an explicit cmd.
    print("[OCR] Warning: Tesseract executable not found at configured paths; relying on system PATH.")


# Creation de l'application FastAPI
app = FastAPI(
    title="Document OCR Service",
    description="Service d'extraction OCR/IA des documents de la plateforme bancaire",
    version="1.0.0",
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

