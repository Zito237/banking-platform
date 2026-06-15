package com.banking_platform.operator_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  AuditLog.java — Entite Journal d'audit                                       ║
 * ║                                                                              ║
 * ║  Chaque ligne represente un evenement metier survenu sur la plateforme       ║
 * ║  (connexion, inscription, transaction, decision de pret, document...).       ║
 * ║  Alimente par les evenements RabbitMQ consommes sur "banking.events".        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String action;

    @Column(name = "user_id")
    private String userId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 1000)
    private String details;

    public AuditLog() {}

    public AuditLog(String action, String userId, LocalDateTime timestamp, String details) {
        this.action = action;
        this.userId = userId;
        this.timestamp = timestamp;
        this.details = details;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
