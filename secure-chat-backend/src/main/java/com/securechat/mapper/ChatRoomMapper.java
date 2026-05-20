package com.securechat.mapper;

import com.securechat.dto.response.ChatRoomDto;
import com.securechat.entity.ChatRoom;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface ChatRoomMapper {

    @Mapping(target = "memberCount", source = "memberCount")
    ChatRoomDto toDto(ChatRoom room, long memberCount);
}
