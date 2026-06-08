# Moteur OCR : pretraitement + extraction
import cv2
import numpy as np
from PIL import Image
import pytesseract
from config import TESSERACT_CMD

# Indique a pytesseract ou trouver l'executable tesseract
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    # Etape 1 : lit l'image depuis les bytes (format brut)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Impossible de lire l'image")

    # Etape 2 : conversion en niveaux de gris (1 canal au lieu de 3)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Etape 3 : seuillage d'Otsu (binarisation automatique)
    # Cela separe le texte (noir) du fond (blanc) automatiquement
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Etape 4 : suppression du bruit (filtre median)
    denoised = cv2.medianBlur(thresh, 3)

    return denoised


def extract_text(image_bytes: bytes) -> dict:
    # Fait tout le pipeline OCR et retourne le texte + metadonnees
    processed = preprocess_image(image_bytes)

    # Configuration de Tesseract
    # --psm 6 : suppose un bloc de texte uniforme
    # -l fra+eng : francais et anglais
    custom_config = r'--oem 3 --psm 6'

    text = pytesseract.image_to_string(
        processed,
        lang='fra+eng',
        config=custom_config
    )

    # Donnees brutes (bounding boxes) pour calculer la confiance
    data = pytesseract.image_to_data(
        processed,
        lang='fra+eng',
        config=custom_config,
        output_type=pytesseract.Output.DICT
    )

    # Calcule la confiance moyenne (ignore les valeurs -1 qui signifient "pas de texte")
    confidences = [c for c in data['conf'] if int(c) > 0]
    avg_confidence = round(sum(confidences) / len(confidences), 2) if confidences else 0.0

    # Extraction de champs simples (heuristique basique)
    fields = extract_fields(text)

    return {
        "rawText": text.strip(),
        "fields": fields,
        "confidence": avg_confidence,
        "engine": "tesseract-ocr-5.x",
        "languages": ["fra", "eng"]
    }


def extract_fields(text: str) -> dict:
    # Heuristique simple pour extraire des champs courants d'une CNI/passeport
    # C'est un exemple basique — en production, on utiliserait un modele NLP
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    fields = {}

    # Recherche de patterns simples
    import re

    # Nom (ligne apres "NOM" ou "Nom")
    for i, line in enumerate(lines):
        if re.search(r'\b(NOM|Nom|NAME)\b', line, re.IGNORECASE):
            if i + 1 < len(lines):
                fields["nom"] = lines[i + 1]

    # Prenom
    for i, line in enumerate(lines):
        if re.search(r'\b(PRENOM|Pr\xc3\xa9nom|Pr\xc3\xa9nom|GIVEN NAMES)\b', line, re.IGNORECASE):
            if i + 1 < len(lines):
                fields["prenom"] = lines[i + 1]

    # Date de naissance
    date_match = re.search(r'(\d{2}[/-]\d{2}[/-]\d{4})', text)
    if date_match:
        fields["dateNaissance"] = date_match.group(1)

    # Numero de document (CNI)
    doc_match = re.search(r'\b\d{9,12}\b', text)
    if doc_match:
        fields["numeroDocument"] = doc_match.group(0)

    return fields
