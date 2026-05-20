package com.securechat.controller;

import com.securechat.dto.request.CreateRoomRequest;
import com.securechat.dto.response.ChatRoomDto;
import com.securechat.dto.response.RoomMemberDto;
import com.securechat.dto.response.UserDto;
import com.securechat.service.ChatRoomService;
import com.securechat.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService roomService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ChatRoomDto> createRoom(
            @Valid @RequestBody CreateRoomRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = resolveUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomService.createRoom(req, userId));
    }

    @GetMapping
    public ResponseEntity<List<ChatRoomDto>> getMyRooms(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(roomService.getRoomsForUser(resolveUserId(principal)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatRoomDto> getRoom(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(roomService.getRoomById(id, resolveUserId(principal)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        roomService.deleteRoom(id, resolveUserId(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<RoomMemberDto>> getRoomMembers(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(roomService.getRoomMembers(id, resolveUserId(principal)));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Void> addMember(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @AuthenticationPrincipal UserDetails principal) {
        roomService.addMemberToRoom(id, resolveUserId(principal), userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails principal) {
        roomService.removeMemberFromRoom(id, resolveUserId(principal), userId);
        return ResponseEntity.noContent().build();
    }

    private UUID resolveUserId(UserDetails principal) {
        return userService.getByEmail(principal.getUsername()).id();
    }
}
