package com.banking_platform.operator_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  OperatorStatus.java — Enumeration des statuts d'operateur                   ║
 * ║                                                                              ║
 * ║  ACTIVE    : l'operateur peut recevoir des transactions                      ║
 * ║  SUSPENDED : l'operateur est bloque (maintenance, litige...)                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

public enum OperatorStatus {
    ACTIVE,
    SUSPENDED
}
