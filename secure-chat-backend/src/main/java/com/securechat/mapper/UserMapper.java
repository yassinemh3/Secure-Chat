package com.securechat.mapper;

import com.securechat.dto.response.UserDto;
import com.securechat.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "active", target = "isActive")
    UserDto toDto(User user);
}
