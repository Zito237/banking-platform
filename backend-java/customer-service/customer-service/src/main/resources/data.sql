ALTER TABLE customers ALTER COLUMN operator_id SET NULL;

-- Corriger les documents mal auto-validés (confidence < 0.7 mais verified=true)
UPDATE document_references SET verified = false WHERE ocr_confidence IS NOT NULL AND ocr_confidence < 0.7 AND verified = true;
