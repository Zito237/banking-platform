# Endpoints REST du document-ocr-service
from fastapi import APIRouter, UploadFile, File, HTTPException
from ocr_engine import extract_text

router = APIRouter()


@router.get("/health")
def health_check():
    # Endpoint de sante pour Kubernetes et Eureka
    return {"status": "UP", "service": "document-ocr-service"}


@router.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    # Recoit une image, fait le pretraitement + OCR, retourne le JSON
    # Verifie le type MIME
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit etre une image (jpg, png, etc.)")

    # Lit le contenu de l'image en memoire
    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide")

    # Lance l'OCR
    try:
        result = extract_text(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur OCR : {str(e)}")

    return {
        "documentName": file.filename,
        "fields": result["fields"],
        "rawText": result["rawText"],
        "confidence": result["confidence"],
        "engine": result["engine"],
        "languages": result["languages"]
    }
