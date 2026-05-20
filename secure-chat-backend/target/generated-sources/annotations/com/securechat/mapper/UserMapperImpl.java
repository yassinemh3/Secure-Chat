package com.securechat.mapper;

import com.securechat.dto.response.UserDto;
import com.securechat.entity.User;
import com.securechat.enums.UserRole;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-20T19:55:47+0200",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.1 (Oracle Corporation)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserDto toDto(User user) {
        if ( user == null ) {
            return null;
        }

        boolean isActive = false;
        UUID id = null;
        String username = null;
        String email = null;
        String displayName = null;
        String avatarUrl = null;
        UserRole role = null;
        Instant createdAt = null;

        isActive = user.isActive();
        id = user.getId();
        username = user.getUsername();
        email = user.getEmail();
        displayName = user.getDisplayName();
        avatarUrl = user.getAvatarUrl();
        role = user.getRole();
        createdAt = user.getCreatedAt();

        UserDto userDto = new UserDto( id, username, email, displayName, avatarUrl, role, isActive, createdAt );

        return userDto;
    }
}
