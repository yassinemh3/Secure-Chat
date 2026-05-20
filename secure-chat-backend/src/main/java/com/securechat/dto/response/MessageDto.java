package com.securechat.dto.response;

import com.securechat.enums.ContentType;

import java.time.Instant;
import java.util.UUID;

public record MessageDto(
        UUID id,
        UUID roomId,
        UserDto sender,
        String content,
        ContentType contentType,
        boolean isEncrypted,
        boolean isEdited,
        boolean isDeleted,
        UUID replyToId,
        Instant createdAt,
        Instant updatedAt
) {}
