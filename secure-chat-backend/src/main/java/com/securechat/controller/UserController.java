package com.securechat.controller;

import com.securechat.dto.response.UserDto;
import com.securechat.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Get the authenticated user's own profile. */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(userService.getByEmail(principal.getUsername()));
    }

    /** Update the authenticated user's profile. */
    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) String displayName,
            @RequestParam(required = false) String avatarUrl) {
        UserDto me = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(userService.updateProfile(me.id(), displayName, avatarUrl));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> search(@RequestParam String q) {
        return ResponseEntity.ok(userService.search(q));
    }
}
