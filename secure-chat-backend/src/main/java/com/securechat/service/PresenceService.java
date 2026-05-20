package com.securechat.service;

import com.securechat.entity.UserPresence;
import com.securechat.enums.PresenceStatus;
import com.securechat.repository.UserPresenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Manages user online/offline/away presence and broadcasts changes
 * to room members via WebSocket.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final UserPresenceRepository presenceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void setOnline(UUID userId) {
        updatePresence(userId, PresenceStatus.ONLINE);
        broadcastPresence(userId, PresenceStatus.ONLINE);
    }

    @Transactional
    public void setOffline(UUID userId) {
        updatePresence(userId, PresenceStatus.OFFLINE);
        broadcastPresence(userId, PresenceStatus.OFFLINE);
    }

    @Transactional
    public void setAway(UUID userId) {
        updatePresence(userId, PresenceStatus.AWAY);
        broadcastPresence(userId, PresenceStatus.AWAY);
    }

    @Transactional(readOnly = true)
    public PresenceStatus getStatus(UUID userId) {
        return presenceRepository.findById(userId)
                .map(UserPresence::getStatus)
                .orElse(PresenceStatus.OFFLINE);
    }

    private void updatePresence(UUID userId, PresenceStatus status) {
        presenceRepository.findById(userId).ifPresentOrElse(
                p -> {
                    p.setStatus(status);
                    p.setLastSeen(Instant.now());
                    presenceRepository.save(p);
                },
                () -> log.warn("Presence record not found for user {}", userId)
        );
    }

    /**
     * Broadcasts a presence update to all of the user's room members via
     * the /topic/presence topic so they can update their UI in real time.
     */
    private void broadcastPresence(UUID userId, PresenceStatus status) {
        Map<String, Object> payload = Map.of(
                "userId", userId.toString(),
                "status", status.name(),
                "timestamp", Instant.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/presence", payload);
    }
}
