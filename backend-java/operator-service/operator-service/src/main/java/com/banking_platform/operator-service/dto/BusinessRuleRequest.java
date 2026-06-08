package com.banking_platform.operator_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  BusinessRuleRequest.java — DTO pour une regle metier                        ║
 * ║                                                                              ║
 * ║  Utilise dans OperatorRequest pour creer les regles en meme temps           ║
 * ║  que l'operateur.                                                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BusinessRuleRequest {

    @NotNull(message = "Le type de regle est obligatoire")
    private String ruleType;  // COMMISSION, CEILING, VALIDATION

    @NotBlank(message = "La valeur de la regle est obligatoire")
    private String value;  // Ex: "1.5%", "500000", "true"

    // Getters et Setters
    public String getRuleType() { return ruleType; }
    public void setRuleType(String ruleType) { this.ruleType = ruleType; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
