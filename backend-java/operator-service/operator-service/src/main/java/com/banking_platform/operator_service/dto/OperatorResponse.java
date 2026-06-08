package com.banking_platform.operator_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  OperatorResponse.java — DTO de reponse pour un operateur                    ║
 * ║                                                                              ║
 * ║  Renvoye par les endpoints GET. Ne contient pas les donnees sensibles.     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.util.List;
import java.util.UUID;

public class OperatorResponse {

    private UUID id;
    private String name;
    private String code;
    private String country;
    private String status;
    private List<BusinessRuleResponse> rules;

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<BusinessRuleResponse> getRules() { return rules; }
    public void setRules(List<BusinessRuleResponse> rules) { this.rules = rules; }
}
