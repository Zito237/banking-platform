# Point d'entree du reporting-service
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from consumer import start_consumer
from routes import router
from config import PORT

# Creation de l'application FastAPI
app = FastAPI(
    title="Reporting Service",
    description="Service de rapports et statistiques de la plateforme bancaire",
    version="1.0.0"
)

# Autorise le frontend (Vite dev server) a appeler ce service directement
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(router, prefix="/api")


@app.on_event("startup")
def startup_event():
    # Initialisation au demarrage : base SQLite + consommateur RabbitMQ
    print("[REPORTING] Initialisation de la base SQLite...")
    init_db()
    print("[REPORTING] Demarrage du consommateur RabbitMQ...")
    start_consumer()
    print(f"[REPORTING] Service pret sur le port {PORT}")


@app.on_event("shutdown")
def shutdown_event():
    # Nettoyage a l'arret du service
    print("[REPORTING] Arret du service...")
