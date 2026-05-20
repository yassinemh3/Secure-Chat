package com.securechat.dto.response;

import com.securechat.enums.UserRole;

import java.time.Instant;
import java.util.UUID;

public record UserDto(
        UUID id,
        String username,
        String email,
        String displayName,
        String avatarUrl,
        UserRole role,
        boolean isActive,
        Instant createdAt
) {}
