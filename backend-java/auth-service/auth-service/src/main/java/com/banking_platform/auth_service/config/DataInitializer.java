package com.banking_platform.auth_service.config;

import com.banking_platform.auth_service.entity.Role;
import com.banking_platform.auth_service.entity.RoleName;
import com.banking_platform.auth_service.entity.User;
import com.banking_platform.auth_service.repository.RoleRepository;
import com.banking_platform.auth_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initRoles(RoleRepository roleRepository, UserRepository userRepository,
                                 PasswordEncoder passwordEncoder) {
        return args -> {
            for (RoleName roleName : RoleName.values()) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = new Role();
                    role.setName(roleName);
                    roleRepository.save(role);
                    System.out.println("Role cree : " + roleName);
                }
            }

            // Compte administrateur par defaut, pour acceder a l'espace admin
            if (userRepository.findByUsername("admin").isEmpty()) {
                Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                        .orElseThrow(() -> new RuntimeException("Role ADMIN non trouve"));

                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@banking-platform.local");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setEnabled(true);
                admin.addRole(adminRole);
                userRepository.save(admin);
                System.out.println("Utilisateur admin cree (admin / admin123)");
            }

            // Compte operateur par defaut, pour acceder a l'espace operateur (demandes de pret, rapports)
            if (userRepository.findByUsername("operator").isEmpty()) {
                Role operatorRole = roleRepository.findByName(RoleName.OPERATOR)
                        .orElseThrow(() -> new RuntimeException("Role OPERATOR non trouve"));

                User operator = new User();
                operator.setUsername("operator");
                operator.setEmail("operator@banking-platform.local");
                operator.setPasswordHash(passwordEncoder.encode("operator123"));
                operator.setEnabled(true);
                operator.addRole(operatorRole);
                userRepository.save(operator);
                System.out.println("Utilisateur operator cree (operator / operator123)");
            }
        };
    }
}
