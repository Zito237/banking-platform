package com.banking_platform.customer_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  DocumentReference.java — Entite Document (dans l'agregat Customer)          ║
 * ║                                                                              ║
 * ║  Represente un document justificatif soumis par un client.                   ║
 * ║  Le fichier est stocke sur un serveur de fichiers (URL) et reference ici.  ║
 * ║  Le champ 'verified' indique si l'OCR a valide le document.                 ║
 * ║                                                                              ║
 * ║  Quand un document est soumis :                                              ║
 * ║  1. Le fichier est stocke et une DocumentReference est creee                ║
 * ║  2. Un evenement DocumentSubmitted est publie sur RabbitMQ                  ║
 * ║  3. Le service OCR traite le document et publie DocumentProcessed           ║
 * ║  4. Ce service consomme DocumentProcessed et met a jour 'verified'          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.util.UUID;
import com.banking_platform.customer_service.entity.Customer;
import com.banking_platform.customer_service.entity.DocumentType;

@Entity
@Table(name = "document_references")
public class DocumentReference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;  // Le client proprietaire du document

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private com.banking_platform.customer_service.entity.DocumentType documentType;  // Type de document (CNI, passeport...)

    @Column(nullable = false, length = 2048)
    private String fileUrl;  // URL ou nom du fichier stocke

    @Column(nullable = false)
    private boolean verified = false;

    private Float ocrConfidence;

    // Constructeur vide requis par JPA
    public DocumentReference() {}

    public DocumentReference(DocumentType documentType, String fileUrl) {
        this.documentType = documentType;
        this.fileUrl = fileUrl;
    }

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public Float getOcrConfidence() { return ocrConfidence; }
    public void setOcrConfidence(Float ocrConfidence) { this.ocrConfidence = ocrConfidence; }
}
