package com.securechat.controller;

import com.securechat.dto.request.SendMessageRequest;
import com.securechat.dto.response.MessageDto;
import com.securechat.repository.UserRepository;
import com.securechat.service.MessageService;
import com.securechat.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * STOMP WebSocket controller.
 * Handles real-time events: chat messages, typing indicators, and presence.
 *
 * <p>Client subscriptions:</p>
 * <ul>
 *   <li>{@code /topic/room.{roomId}}   — broadcast messages in a room</li>
 *   <li>{@code /user/queue/errors}     — private error queue</li>
 *   <li>{@code /topic/presence}        — presence updates</li>
 * </ul>
 *
 * <p>Client sends to:</p>
 * <ul>
 *   <li>{@code /app/chat.send}         — send a message</li>
 *   <li>{@code /app/chat.typing}       — typing indicator</li>
 * </ul>
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final UserRepository userRepository;
    private final PresenceService presenceService;

    // ─── Message Handling ────────────────────────────────────────────────────

    /**
     * Receives a chat message, persists it, then broadcasts to the room topic.
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest req, Principal principal) {
        UUID senderId = resolveUserId(principal);
        try {
            MessageDto message = messageService.sendMessage(req, senderId);
            // Broadcast to all subscribers of this room's topic
            messagingTemplate.convertAndSend(
                    "/topic/room." + req.roomId(),
                    message
            );
        } catch (Exception e) {
            log.error("Error sending WebSocket message: {}", e.getMessage());
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    Map.of("error", e.getMessage())
            );
        }
    }

    // ─── Typing Indicator ────────────────────────────────────────────────────

    /**
     * Relays typing indicator to room members (excluding the sender).
     * Payload: { roomId, typing }
     */
    @MessageMapping("/chat.typing")
    public void typingIndicator(
            @Payload Map<String, Object> payload,
            Principal principal) {
        String roomId = payload.get("roomId").toString();
        boolean isTyping = Boolean.parseBoolean(payload.get("typing").toString());

        messagingTemplate.convertAndSend(
                "/topic/room." + roomId + ".typing",
                Map.of(
                        "userId", resolveUserId(principal).toString(),
                        "typing", isTyping
                )
        );
    }

    // ─── Presence Events ────────────────────────────────────────────────────

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getUser() != null) {
            UUID userId = resolveUserId(accessor.getUser());
            presenceService.setOnline(userId);
            log.info("User {} connected via WebSocket", userId);
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getUser() != null) {
            UUID userId = resolveUserId(accessor.getUser());
            presenceService.setOffline(userId);
            log.info("User {} disconnected from WebSocket", userId);
        }
    }

    // ─── Helper ─────────────────────────────────────────────────────────────

    private UUID resolveUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + principal.getName()))
                .getId();
    }
}
