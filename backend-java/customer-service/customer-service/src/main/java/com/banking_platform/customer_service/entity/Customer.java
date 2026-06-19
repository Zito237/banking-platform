package com.banking_platform.customer_service.entity;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Customer.java — Entite Client (racine d'agregat Customer)                     ║
 * ║                                                                              ║
 * ║  Represente un client de la plateforme bancaire.                             ║
 * ║  Un client appartient a un operateur financier (operatorId).                   ║
 * ║  Le statut KYC est initialise a PENDING a l'inscription.                       ║
 * ║                                                                              ║
 * ║  Relation : Customer 1 --- * DocumentReference (composition)                 ║
 * ║  Si le client est supprime, ses documents le sont aussi.                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String dateOfBirth;  // Format : "YYYY-MM-DD"

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false, unique = true)
    private String nationalIdNumber;  // Numero de CNI ou passeport

    @Column(nullable = false)
    private UUID operatorId;  // L'operateur auquel appartient le client

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus kycStatus = KycStatus.PENDING;  // PENDING par defaut

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Composition : un client possede plusieurs documents
    // Cascade ALL = operations sur Customer repercutees sur DocumentReference
    // OrphanRemoval = suppression d'un document de la liste = suppression en base
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<DocumentReference> documents = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructeur vide requis par JPA
    public Customer() {}

    // Getters et Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getNationalIdNumber() { return nationalIdNumber; }
    public void setNationalIdNumber(String nationalIdNumber) { this.nationalIdNumber = nationalIdNumber; }

    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }

    public KycStatus getKycStatus() { return kycStatus; }
    public void setKycStatus(KycStatus kycStatus) { this.kycStatus = kycStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<DocumentReference> getDocuments() { return documents; }
    public void setDocuments(List<DocumentReference> documents) { this.documents = documents; }

    /**
     * Ajoute un document au client.
     * Met a jour la relation bidirectionnelle.
     */
    public void addDocument(DocumentReference document) {
        documents.add(document);
        document.setCustomer(this);
    }
}
