package com.securechat.service;

import com.securechat.dto.response.UserDto;
import com.securechat.entity.User;
import com.securechat.exception.ResourceNotFoundException;
import com.securechat.mapper.UserMapper;
import com.securechat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserDto getById(UUID id) {
        return userMapper.toDto(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public UserDto getByEmail(String email) {
        return userMapper.toDto(
                userRepository.findByEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("User", email))
        );
    }

    @Transactional(readOnly = true)
    public List<UserDto> search(String query) {
        return userRepository.searchByUsernameOrDisplayName(query)
                .stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateProfile(UUID userId, String displayName, String avatarUrl) {
        User user = findOrThrow(userId);
        if (displayName != null) user.setDisplayName(displayName);
        if (avatarUrl   != null) user.setAvatarUrl(avatarUrl);
        return userMapper.toDto(userRepository.save(user));
    }

    private User findOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }
}
