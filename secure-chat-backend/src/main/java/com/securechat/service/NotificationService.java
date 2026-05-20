package com.securechat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securechat.dto.response.NotificationDto;
import com.securechat.entity.Notification;
import com.securechat.entity.User;
import com.securechat.exception.ResourceNotFoundException;
import com.securechat.exception.UnauthorizedException;
import com.securechat.repository.NotificationRepository;
import com.securechat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manages in-app notifications: creation, delivery over WebSocket,
 * retrieval, and mark-as-read.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;
    private final SimpMessagingTemplate  messagingTemplate;
    private final ObjectMapper           objectMapper;

    // ─── Create & Push ────────────────────────────────────────────────────────

    /**
     * Creates and persists a notification for {@code targetUserId}, then
     * pushes a DTO to the user's private STOMP queue so they receive it live.
     */
    @Transactional
    public NotificationDto notify(UUID targetUserId, String type, Map<String, Object> payload) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            payloadJson = "{}";
            log.warn("Failed to serialize notification payload: {}", e.getMessage());
        }

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .payload(payloadJson)
                .build();

        notification = notificationRepository.save(notification);
        NotificationDto dto = toDto(notification);

        // Push real-time notification via WebSocket (use DTO to avoid lazy-load issues)
        try {
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    "/queue/notifications",
                    dto
            );
        } catch (Exception e) {
            log.warn("Failed to push notification to user {}: {}", targetUserId, e.getMessage());
        }

        return dto;
    }

    // ─── Query ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NotificationDto> getUnread(UUID userId) {
        return notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getAll(UUID userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 50))
                .getContent()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // ─── Mark read ────────────────────────────────────────────────────────────

    @Transactional
    public void markRead(UUID notificationId, UUID requesterId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!n.getUser().getId().equals(requesterId)) {
            throw new UnauthorizedException("Cannot mark another user's notification as read");
        }

        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getUser().getId(),
                n.getType(),
                n.getPayload(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
