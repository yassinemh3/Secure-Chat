package com.securechat.controller;

import com.securechat.dto.response.NotificationDto;
import com.securechat.service.NotificationService;
import com.securechat.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST endpoints for in-app notifications.
 *
 * GET  /api/v1/notifications           → list unread notifications
 * GET  /api/v1/notifications/count     → unread count (for badge)
 * PUT  /api/v1/notifications/{id}/read → mark one as read
 * PUT  /api/v1/notifications/read-all  → mark all as read
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService         userService;

    /** Returns the current user's unread notifications (most recent first). */
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getUnread(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.getUnread(resolveUserId(principal)));
    }

    /** Returns count of unread notifications (for badge display). */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> countUnread(
            @AuthenticationPrincipal UserDetails principal) {
        long count = notificationService.countUnread(resolveUserId(principal));
        return ResponseEntity.ok(Map.of("unread", count));
    }

    /** Marks a single notification as read. */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        notificationService.markRead(id, resolveUserId(principal));
        return ResponseEntity.noContent().build();
    }

    /** Marks all of the current user's notifications as read. */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal UserDetails principal) {
        notificationService.markAllRead(resolveUserId(principal));
        return ResponseEntity.noContent().build();
    }

    private UUID resolveUserId(UserDetails principal) {
        return userService.getByEmail(principal.getUsername()).id();
    }
}
