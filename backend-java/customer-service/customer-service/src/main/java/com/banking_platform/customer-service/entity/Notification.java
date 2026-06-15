package com.banking_platform.customer_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Notification.java — Entite Notification client                              ║
 * ║                                                                              ║
 * ║  Une notification est creee pour un client suite a un evenement metier      ║
 * ║  (decision de pret, document traite par l'OCR...).                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    private boolean read = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(UUID customerId, String message) {
        this.customerId = customerId;
        this.message = message;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
