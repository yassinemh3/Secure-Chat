package com.securechat.service;

import com.securechat.dto.request.LoginRequest;
import com.securechat.dto.request.RegisterRequest;
import com.securechat.dto.response.AuthResponse;
import com.securechat.dto.response.UserDto;
import com.securechat.entity.RefreshToken;
import com.securechat.entity.User;
import com.securechat.entity.UserPresence;
import com.securechat.enums.PresenceStatus;
import com.securechat.exception.ResourceNotFoundException;
import com.securechat.exception.UnauthorizedException;
import com.securechat.mapper.UserMapper;
import com.securechat.repository.RefreshTokenRepository;
import com.securechat.repository.UserPresenceRepository;
import com.securechat.repository.UserRepository;
import com.securechat.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Handles user registration, login, token refresh, and logout.
 * Refresh tokens are stored as HttpOnly cookies and rotated on each use.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserPresenceRepository presenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;
    private final UserMapper userMapper;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    // ─── Register ───────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest req, HttpServletResponse response) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (userRepository.existsByUsername(req.username())) {
            throw new IllegalArgumentException("Username already taken");
        }

        User user = User.builder()
                .username(req.username())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .displayName(req.displayName() != null ? req.displayName() : req.username())
                .build();
        user = userRepository.save(user);

        // Initialise presence record
        presenceRepository.save(UserPresence.builder().user(user).status(PresenceStatus.OFFLINE).build());

        return issueTokens(user, response);
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest req, HttpServletResponse response) {
        // Spring Security handles credential validation; throws BadCredentialsException on failure
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password())
        );

        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ResourceNotFoundException("User", req.email()));

        return issueTokens(user, response);
    }

    // ─── Token Refresh ───────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refreshToken(String rawRefreshToken, HttpServletResponse response) {
        RefreshToken stored = refreshTokenRepository.findByToken(rawRefreshToken)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (!stored.isValid()) {
            throw new UnauthorizedException("Refresh token expired or revoked");
        }

        // Rotate: revoke old, issue new
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(stored.getUser(), response);
    }

    // ─── Logout ──────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String rawRefreshToken, UUID userId, HttpServletResponse response) {
        // Revoke the specific token if provided, otherwise revoke all
        if (rawRefreshToken != null) {
            refreshTokenRepository.findByToken(rawRefreshToken)
                    .ifPresent(t -> { t.setRevoked(true); refreshTokenRepository.save(t); });
        } else {
            refreshTokenRepository.revokeAllByUserId(userId);
        }
        clearRefreshCookie(response);
    }

    /** Resolves a user's UUID from their email (used by controllers needing the ID). */
    @Transactional(readOnly = true)
    public UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(null);
    }

    // ─── Internal Helpers ────────────────────────────────────────────────────

    private AuthResponse issueTokens(User user, HttpServletResponse response) {
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtTokenProvider.generateAccessToken(details, user.getId());

        // Create and persist refresh token
        String refreshTokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenValue)
                .user(user)
                .expiresAt(Instant.now().plusMillis(refreshTokenExpirationMs))
                .build();
        refreshTokenRepository.save(refreshToken);

        // Send refresh token as HttpOnly, SameSite=Strict cookie
        setRefreshCookie(response, refreshTokenValue);

        UserDto userDto = userMapper.toDto(user);
        return new AuthResponse(accessToken, accessTokenExpirationMs / 1000, userDto);
    }

    private void setRefreshCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refresh_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);          // Set to true in production (HTTPS)
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge((int) (refreshTokenExpirationMs / 1000));
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
