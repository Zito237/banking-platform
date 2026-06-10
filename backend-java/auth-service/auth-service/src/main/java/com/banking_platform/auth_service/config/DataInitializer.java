package com.banking_platform.auth_service.config;

import com.banking_platform.auth_service.entity.Role;
import com.banking_platform.auth_service.entity.RoleName;
import com.banking_platform.auth_service.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initRoles(RoleRepository roleRepository) {
        return args -> {
            for (RoleName roleName : RoleName.values()) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = new Role();
                    role.setName(roleName);
                    roleRepository.save(role);
                    System.out.println("Role cree : " + roleName);
                }
            }
        };
    }
}
