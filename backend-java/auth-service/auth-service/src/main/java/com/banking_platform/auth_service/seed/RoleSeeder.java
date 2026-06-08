package com.banking_platform.auth_service.seed;

import com.banking_platform.auth_service.entity.Role;
import com.banking_platform.auth_service.entity.RoleName;
import com.banking_platform.auth_service.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RoleSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public RoleSeeder(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {
        // Seed des rôles de base
        for (RoleName roleName : new RoleName[]{RoleName.CLIENT, RoleName.OPERATOR, RoleName.ADMIN}) {
            roleRepository.findByName(roleName)
                    .orElseGet(() -> roleRepository.save(new Role(roleName)));
        }
    }
}


