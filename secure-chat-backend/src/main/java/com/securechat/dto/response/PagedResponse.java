package com.securechat.dto.response;

import java.util.List;

/**
 * Generic paginated response wrapper used for message history and other
 * paginated collections.
 */
public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {}
