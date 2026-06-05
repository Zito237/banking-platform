package com.banking_platform.operator_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  BusinessRule.java — Entite Regle Metier (dans l'agregat Operator)           ║
 * ║                                                                              ║
 * ║  Represente une regle metier d'un operateur :                              ║
 * ║  • COMMISSION : taux de commission pour les transferts inter-operateurs      ║
 * ║  • CEILING    : plafond de transaction par type de compte                  ║
 * ║  • VALIDATION : regle de validation (ex: KYC obligatoire)                  ║
 * ║                                                                              ║
 * ║  La valeur est stockee en String pour etre flexible (ex: "1.5%", "500000")  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "business_rules")
public class BusinessRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;  // L'operateur proprietaire de cette regle

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RuleType ruleType;  // COMMISSION, CEILING, VALIDATION

    @Column(nullable = false)
    private String value;  // Valeur de la regle (ex: "1.5%", "500000", "true")

    // Constructeur vide requis par JPA
    public BusinessRule() {}

    public BusinessRule(RuleType ruleType, String value) {
        this.ruleType = ruleType;
        this.value = value;
    }

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Operator getOperator() { return operator; }
    public void setOperator(Operator operator) { this.operator = operator; }

    public RuleType getRuleType() { return ruleType; }
    public void setRuleType(RuleType ruleType) { this.ruleType = ruleType; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
