package com.banking_platform.operator_service;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  OperatorServiceApplication.java — Classe principale                         ║
 * ║                                                                              ║
 * ║  Point d'entree du service operateurs. S'enregistre dans Eureka.           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class OperatorServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OperatorServiceApplication.class, args);
    }

}
