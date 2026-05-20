package com.securechat.dto.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight DTO for notification responses.
 * Avoids serializing the full lazy-loaded {@code User} entity.
 */
public record NotificationDto(
        UUID    id,
        UUID    userId,
        String  type,
        String  payload,     // raw JSON string matching the JSONB column
        boolean isRead,
        Instant createdAt
) {}
