package com.securechat.dto.request;

import com.securechat.enums.RoomType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateRoomRequest(
        @Size(max = 100, message = "Room name must be at most 100 characters")
        String name,

        @Size(max = 500, message = "Description must be at most 500 characters")
        String description,

        @NotNull(message = "Room type is required")
        RoomType type,

        /** Initial member UUIDs (excluding creator, who is added automatically as OWNER) */
        List<UUID> memberIds
) {}
