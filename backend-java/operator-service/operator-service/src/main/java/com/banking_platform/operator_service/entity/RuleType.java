package com.banking_platform.operator_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RuleType.java — Enumeration des types de regles metier                        ║
 * ║                                                                              ║
 * ║  COMMISSION  : taux de commission pour transferts inter-operateurs         ║
 * ║  CEILING     : plafond de transaction (montant max)                         ║
 * ║  VALIDATION  : regle de validation (ex: KYC obligatoire avant transaction)  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public enum RuleType {
    COMMISSION,
    CEILING,
    VALIDATION
}
