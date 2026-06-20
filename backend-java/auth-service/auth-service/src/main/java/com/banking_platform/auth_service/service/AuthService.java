package com.banking_platform.auth_service.service;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  AuthService.java — Service metier d'authentification                        ║
 * ║                                                                              ║
 * ║  Contient la logique metier pour :                                           ║
 * ║  • L'inscription (creation d'utilisateur avec hash BCrypt + role CLIENT)    ║
 * ║  • La connexion (verification des identifiants + generation JWT)            ║
 * ║  • La recuperation des infos utilisateur                                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import com.banking_platform.auth_service.dto.*;
import com.banking_platform.auth_service.entity.Role;
import com.banking_platform.auth_service.entity.RoleName;
import com.banking_platform.auth_service.entity.User;
import com.banking_platform.auth_service.messaging.AuthEventPublisher;
import com.banking_platform.auth_service.repository.RoleRepository;
import com.banking_platform.auth_service.repository.UserRepository;
import com.banking_platform.auth_service.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthEventPublisher authEventPublisher;

    // Injection par constructeur (bonne pratique Spring)
    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthEventPublisher authEventPublisher) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authEventPublisher = authEventPublisher;
    }

    /**
     * Inscrit un nouvel utilisateur.
     * Etapes :
     * 1. Verifie que le username et l'email n'existent pas deja
     * 2. Hash le mot de passe avec BCrypt
     * 3. Attribue le role CLIENT par defaut
     * 4. Sauvegarde l'utilisateur en base
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Verification des doublons
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Ce nom d'utilisateur est deja pris");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est deja utilise");
        }

        // Creation du nouvel utilisateur
        User user = new User();
        user.setUsername(request.getUsername());
        // Hash du mot de passe (JAMAIS en clair !)
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setEnabled(true);

        // Attribution du role CLIENT par defaut
        Role clientRole = roleRepository.findByName(RoleName.CLIENT)
                .orElseThrow(() -> new RuntimeException("Role CLIENT non trouve"));
        user.addRole(clientRole);

        // Sauvegarde
        userRepository.save(user);

        // Generation du JWT
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());
        String token = jwtUtil.generateToken(user.getUsername(), roleNames);

        authEventPublisher.publishRegister(user.getUsername());

        return new AuthResponse(token, user.getUsername(), "Inscription reussie");
    }

    /**
     * Connecte un utilisateur existant.
     * Etapes :
     * 1. Cherche l'utilisateur par username
     * 2. Verifie que le mot de passe correspond (BCrypt compare le hash)
     * 3. Genere un JWT signe
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Nom d'utilisateur ou mot de passe incorrect"));

        // Verification du mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Nom d'utilisateur ou mot de passe incorrect");
        }

        // Generation du JWT
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());
        String token = jwtUtil.generateToken(user.getUsername(), roleNames);

        authEventPublisher.publishLogin(user.getUsername());

        return new AuthResponse(token, user.getUsername(), "Connexion reussie");
    }

    /**
     * Cree un compte OPERATOR, rattache a un operateur (operator-service).
     * Reserve aux administrateurs (verifie dans le controller via X-User-Roles).
     */
    @Transactional
    public UserInfoResponse createOperatorAccount(CreateOperatorAccountRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Ce nom d'utilisateur est deja pris");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est deja utilise");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setEnabled(true);
        user.setOperatorId(request.getOperatorId());

        Role operatorRole = roleRepository.findByName(RoleName.OPERATOR)
                .orElseThrow(() -> new RuntimeException("Role OPERATOR non trouve"));
        user.addRole(operatorRole);

        userRepository.save(user);

        return getUserInfo(user.getUsername());
    }

    /**
     * Associe le profil client (customer-service) au compte de l'utilisateur connecte.
     */
    @Transactional
    public UserInfoResponse linkCustomer(String username, java.util.UUID customerId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        user.setLinkedCustomerId(customerId);
        userRepository.save(user);

        return getUserInfo(username);
    }

    /**
     * Liste tous les utilisateurs (pour l'administration).
     */
    public java.util.List<UserInfoResponse> listAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> {
                    UserInfoResponse r = new UserInfoResponse();
                    r.setId(u.getId());
                    r.setUsername(u.getUsername());
                    r.setEmail(u.getEmail());
                    r.setEnabled(u.isEnabled());
                    r.setOperatorId(u.getOperatorId());
                    r.setLinkedCustomerId(u.getLinkedCustomerId());
                    r.setRoles(u.getRoles().stream()
                            .map(role -> role.getName().name())
                            .collect(java.util.stream.Collectors.toSet()));
                    return r;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Active ou desactive un compte utilisateur.
     */
    @Transactional
    public UserInfoResponse toggleUserEnabled(java.util.UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        return getUserInfo(user.getUsername());
    }

    /**
     * Recupere les informations d'un utilisateur a partir de son username.
     */
    public UserInfoResponse getUserInfo(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        UserInfoResponse response = new UserInfoResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setEnabled(user.isEnabled());
        response.setOperatorId(user.getOperatorId());
        response.setLinkedCustomerId(user.getLinkedCustomerId());
        response.setRoles(user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet()));

        return response;
    }
}
