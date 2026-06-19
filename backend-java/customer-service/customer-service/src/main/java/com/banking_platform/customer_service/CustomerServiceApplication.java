package com.banking_platform.customer_service;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CustomerServiceApplication.java — Classe principale                           ║
 * ║                                                                              ║
 * ║  Point d'entree du service clients. S'enregistre dans Eureka.              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class CustomerServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CustomerServiceApplication.class, args);
    }

}
