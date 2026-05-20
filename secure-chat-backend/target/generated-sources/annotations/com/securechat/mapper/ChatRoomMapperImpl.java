package com.securechat.mapper;

import com.securechat.dto.response.ChatRoomDto;
import com.securechat.dto.response.UserDto;
import com.securechat.entity.ChatRoom;
import com.securechat.enums.RoomType;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-20T19:55:48+0200",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.1 (Oracle Corporation)"
)
@Component
public class ChatRoomMapperImpl implements ChatRoomMapper {

    @Autowired
    private UserMapper userMapper;

    @Override
    public ChatRoomDto toDto(ChatRoom room, long memberCount) {
        if ( room == null ) {
            return null;
        }

        UUID id = null;
        String name = null;
        String description = null;
        RoomType type = null;
        UserDto createdBy = null;
        Instant createdAt = null;
        Instant updatedAt = null;
        if ( room != null ) {
            id = room.getId();
            name = room.getName();
            description = room.getDescription();
            type = room.getType();
            createdBy = userMapper.toDto( room.getCreatedBy() );
            createdAt = room.getCreatedAt();
            updatedAt = room.getUpdatedAt();
        }
        long memberCount1 = 0L;
        memberCount1 = memberCount;

        ChatRoomDto chatRoomDto = new ChatRoomDto( id, name, description, type, createdBy, memberCount1, createdAt, updatedAt );

        return chatRoomDto;
    }
}
