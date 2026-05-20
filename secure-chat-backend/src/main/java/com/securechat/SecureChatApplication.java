package com.securechat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main entry point for the Secure-Chat Spring Boot application.
 * Enables async execution for notification dispatch.
 */
@SpringBootApplication
@EnableAsync
public class SecureChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureChatApplication.class, args);
    }
}
