package com.banking_platform.customer_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CustomerResponse.java — DTO de reponse pour un client                     ║
 * ║                                                                              ║
 * ║  Renvoye par les endpoints GET. Contient les infos du client + documents.   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class CustomerResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String dateOfBirth;
    private String email;
    private String phone;
    private String address;
    private String nationalIdNumber;
    private UUID operatorId;
    private String kycStatus;
    private LocalDateTime createdAt;
    private List<DocumentResponse> documents;

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

    public String getKycStatus() { return kycStatus; }
    public void setKycStatus(String kycStatus) { this.kycStatus = kycStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<DocumentResponse> getDocuments() { return documents; }
    public void setDocuments(List<DocumentResponse> documents) { this.documents = documents; }
}
