package com.banking_platform.operator_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  BusinessRuleResponse.java — DTO de reponse pour une regle metier            ║
 * ║                                                                              ║
 * ║  Renvoye dans OperatorResponse.                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.UUID;

public class BusinessRuleResponse {

    private UUID id;
    private String ruleType;
    private String value;

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getRuleType() { return ruleType; }
    public void setRuleType(String ruleType) { this.ruleType = ruleType; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
