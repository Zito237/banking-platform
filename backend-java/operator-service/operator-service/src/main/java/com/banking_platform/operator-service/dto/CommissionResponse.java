package com.banking_platform.operator_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CommissionResponse.java — DTO pour le taux de commission                    ║
 * ║                                                                              ║
 * ║  Renvoye par GET /operators/{id}/commission.                                ║
 * ║  Utilise par transaction-service pour calculer les frais.                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.UUID;

public class CommissionResponse {

    private UUID operatorId;
    private String operatorName;
    private String operatorCode;
    private double commissionRate;  // Taux en pourcentage (ex: 1.5 = 1.5%)
    private String commissionValue; // Valeur brute (ex: "1.5%")

    // Getters et Setters
    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }

    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }

    public String getOperatorCode() { return operatorCode; }
    public void setOperatorCode(String operatorCode) { this.operatorCode = operatorCode; }

    public double getCommissionRate() { return commissionRate; }
    public void setCommissionRate(double commissionRate) { this.commissionRate = commissionRate; }

    public String getCommissionValue() { return commissionValue; }
    public void setCommissionValue(String commissionValue) { this.commissionValue = commissionValue; }
}
