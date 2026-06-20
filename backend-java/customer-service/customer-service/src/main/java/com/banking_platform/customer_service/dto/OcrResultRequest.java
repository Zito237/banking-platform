package com.banking_platform.customer_service.dto;

public class OcrResultRequest {
    private float confidence;
    private String rawText;

    public float getConfidence() { return confidence; }
    public void setConfidence(float confidence) { this.confidence = confidence; }

    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }
}
