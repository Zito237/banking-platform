package com.banking_platform.auth_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CreateOperatorAccountRequest.java — DTO pour la creation d'un compte        ║
 * ║  operateur par un administrateur.                                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class CreateOperatorAccountRequest {

    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit faire entre 3 et 50 caracteres")
    private String username;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit faire au moins 6 caracteres")
    private String password;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit etre valide")
    private String email;

    @NotNull(message = "L'operateur est obligatoire")
    private UUID operatorId;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public UUID getOperatorId() { return operatorId; }
    public void setOperatorId(UUID operatorId) { this.operatorId = operatorId; }
}
