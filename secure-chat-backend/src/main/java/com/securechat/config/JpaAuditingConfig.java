package com.securechat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables JPA auditing so that @CreatedDate and @LastModifiedDate
 * annotations on entities (User, ChatRoom, Message, etc.) are
 * automatically populated by Spring Data.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
