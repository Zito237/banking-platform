package com.banking_platform.operator_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  OperatorRequest.java — DTO pour creer/modifier un operateur                   ║
 * ║                                                                              ║
 * ║  Contient les donnees envoyees par le client (administrateur)               ║
 * ║  pour creer un operateur avec ses regles metier.                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class OperatorRequest {

    @NotBlank(message = "Le nom de l'operateur est obligatoire")
    private String name;

    @NotBlank(message = "Le code de l'operateur est obligatoire")
    private String code;

    @NotBlank(message = "Le pays est obligatoire")
    private String country;

    @NotEmpty(message = "Au moins une regle metier est requise")
    @Valid  // Valide aussi les regles individuellement
    private List<BusinessRuleRequest> rules;

    // Getters et Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public List<BusinessRuleRequest> getRules() { return rules; }
    public void setRules(List<BusinessRuleRequest> rules) { this.rules = rules; }
}
