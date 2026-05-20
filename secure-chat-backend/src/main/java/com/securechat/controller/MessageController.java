package com.securechat.controller;

import com.securechat.dto.response.MessageDto;
import com.securechat.dto.response.PagedResponse;
import com.securechat.service.MessageService;
import com.securechat.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;

    /** Paginated message history for a room (newest first). */
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<PagedResponse<MessageDto>> getMessages(
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = resolveUserId(principal);
        return ResponseEntity.ok(messageService.getMessages(roomId, userId, page, size));
    }

    /** Edit a message's content (sender only). */
    @PutMapping("/messages/{id}")
    public ResponseEntity<MessageDto> editMessage(
            @PathVariable UUID id,
            @RequestParam String content,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(messageService.editMessage(id, content, resolveUserId(principal)));
    }

    /** Soft-delete a message (sender only). */
    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        messageService.deleteMessage(id, resolveUserId(principal));
        return ResponseEntity.noContent().build();
    }

    /** Full-text search across user's accessible rooms. */
    @GetMapping("/messages/search")
    public ResponseEntity<PagedResponse<MessageDto>> searchMessages(
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(
                messageService.searchMessages(resolveUserId(principal), q, page, size));
    }

    private UUID resolveUserId(UserDetails principal) {
        return userService.getByEmail(principal.getUsername()).id();
    }
}
