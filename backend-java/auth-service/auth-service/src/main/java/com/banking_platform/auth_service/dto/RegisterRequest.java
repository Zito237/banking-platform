package com.banking_platform.auth_service.dto;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  RegisterRequest.java — DTO pour l'inscription                               ║
 * ║                                                                              ║
 * ║  Contient les donnees envoyees par le client lors de l'inscription.         ║
 * ║  Les annotations @NotBlank, @Size, @Email valident automatiquement          ║
 * ║  les champs avant que le controller ne traite la requete.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit faire entre 3 et 50 caracteres")
    private String username;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit faire au moins 6 caracteres")
    private String password;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit etre valide")
    private String email;

    // Getters et Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
