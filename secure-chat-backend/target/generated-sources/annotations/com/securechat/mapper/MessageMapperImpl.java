package com.securechat.mapper;

import com.securechat.dto.response.MessageDto;
import com.securechat.dto.response.UserDto;
import com.securechat.entity.ChatRoom;
import com.securechat.entity.Message;
import com.securechat.enums.ContentType;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-20T19:55:47+0200",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.1 (Oracle Corporation)"
)
@Component
public class MessageMapperImpl implements MessageMapper {

    @Autowired
    private UserMapper userMapper;

    @Override
    public MessageDto toDto(Message message) {
        if ( message == null ) {
            return null;
        }

        UUID roomId = null;
        UUID replyToId = null;
        boolean isDeleted = false;
        boolean isEdited = false;
        boolean isEncrypted = false;
        UUID id = null;
        UserDto sender = null;
        String content = null;
        ContentType contentType = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        roomId = messageRoomId( message );
        replyToId = messageReplyToId( message );
        isDeleted = message.isDeleted();
        isEdited = message.isEdited();
        isEncrypted = message.isEncrypted();
        id = message.getId();
        sender = userMapper.toDto( message.getSender() );
        content = message.getContent();
        contentType = message.getContentType();
        createdAt = message.getCreatedAt();
        updatedAt = message.getUpdatedAt();

        MessageDto messageDto = new MessageDto( id, roomId, sender, content, contentType, isEncrypted, isEdited, isDeleted, replyToId, createdAt, updatedAt );

        return messageDto;
    }

    private UUID messageRoomId(Message message) {
        if ( message == null ) {
            return null;
        }
        ChatRoom room = message.getRoom();
        if ( room == null ) {
            return null;
        }
        UUID id = room.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private UUID messageReplyToId(Message message) {
        if ( message == null ) {
            return null;
        }
        Message replyTo = message.getReplyTo();
        if ( replyTo == null ) {
            return null;
        }
        UUID id = replyTo.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
