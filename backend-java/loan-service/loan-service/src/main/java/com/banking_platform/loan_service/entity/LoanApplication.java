package com.banking_platform.loan_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LoanApplication.java — Demande de prêt (racine d'agrégat)                     ║
 * ║                                                                              ║
 * ║  Représente une demande de prêt soumise par un client.                        ║
 * ║  Le workflow est : SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED            ║
 * ║                                                                              ║
 * ║  Si APPROVED, un Loan est créé avec un échéancier (RepaymentSchedule).       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "loan_applications")
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID customerId;  // Référence au client (dans customer-service)

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal requestedAmount;  // Montant demandé

    @Column(nullable = false)
    private String purpose;  // Objet du prêt (ex: "Achat immobilier")

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanApplicationStatus status = LoanApplicationStatus.SUBMITTED;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @Column
    private String decisionReason;  // Motif de la décision (approbation/rejet)

    @PrePersist
    public void prePersist() {
        this.submittedAt = LocalDateTime.now();
    }

    // Constructeur vide requis par JPA
    public LoanApplication() {}

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public LoanApplicationStatus getStatus() { return status; }
    public void setStatus(LoanApplicationStatus status) { this.status = status; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public String getDecisionReason() { return decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }
}
