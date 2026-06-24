# Endpoints REST du document-ocr-service
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from ocr_engine import extract_text

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/health")
def health_check():
    return {"status": "UP", "service": "document-ocr-service"}


@router.get("/files/{filename}")
def serve_file(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return FileResponse(path)


@router.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit etre une image (jpg, png, etc.)")

    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide")

    ext = os.path.splitext(file.filename or "img.png")[1] or ".png"
    saved_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, saved_name), "wb") as f:
        f.write(image_bytes)

    try:
        result = extract_text(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur OCR : {str(e)}")

    return {
        "documentName": file.filename,
        "savedFilename": saved_name,
        "fileUrl": f"http://localhost:9001/api/files/{saved_name}",
        "fields": result["fields"],
        "rawText": result["rawText"],
        "confidence": result["confidence"],
        "engine": result["engine"],
        "languages": result["languages"]
    }
