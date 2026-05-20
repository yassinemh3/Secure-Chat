package com.securechat.dto.response;

import com.securechat.enums.RoomType;

import java.time.Instant;
import java.util.UUID;

public record ChatRoomDto(
        UUID id,
        String name,
        String description,
        RoomType type,
        UserDto createdBy,
        long memberCount,
        Instant createdAt,
        Instant updatedAt
) {}
