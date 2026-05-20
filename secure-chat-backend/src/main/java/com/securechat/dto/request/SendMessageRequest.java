package com.securechat.dto.request;

import com.securechat.enums.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendMessageRequest(
        @NotNull(message = "Room ID is required")
        UUID roomId,

        @NotBlank(message = "Content is required")
        @Size(max = 10000, message = "Message content must not exceed 10,000 characters")
        String content,

        ContentType contentType,

        /** Optional: UUID of the message being replied to */
        UUID replyToId
) {}
