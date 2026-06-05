package com.banking_platform.auth_service.controller;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  AuthController.java — Controller REST pour l'authentification               ║
 * ║                                                                              ║
 * ║  Expose les endpoints publics :                                              ║
 * ║  • POST /auth/register  → inscription                                        ║
 * ║  • POST /auth/login     → connexion (renvoie JWT)                           ║
 * ║  • GET  /auth/me        → infos utilisateur (besoin du JWT)                 ║
 * ║                                                                              ║
 * ║  La documentation Swagger est accessible sur /swagger-ui.html                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.auth_service.dto.*;
import com.banking_platform.auth_service.security.JwtUtil;
import com.banking_platform.auth_service.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * POST /auth/register
     * Cree un nouvel utilisateur avec le role CLIENT par defaut.
     * Renvoie un JWT pour que l'utilisateur soit immediatement connecte.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /auth/login
     * Verifie les identifiants et renvoie un JWT signe.
     * Le client doit stocker ce token et l'envoyer dans le header
     * Authorization: Bearer <token> pour chaque requete suivante.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /auth/me
     * Renvoie les informations de l'utilisateur connecte.
     * Le token JWT doit etre passe dans le header Authorization.
     */
    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {

        // Extrait le token du header "Bearer <token>"
        String token = authHeader.substring(7);

        // Valide le token et extrait le username
        String username = jwtUtil.extractUsername(token);

        // Recupere les infos utilisateur
        UserInfoResponse userInfo = authService.getUserInfo(username);
        return ResponseEntity.ok(userInfo);
    }
}
