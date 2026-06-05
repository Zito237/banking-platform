package com.banking_platform.operator_service;

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
