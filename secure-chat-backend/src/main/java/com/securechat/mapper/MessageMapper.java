package com.securechat.mapper;

import com.securechat.dto.response.MessageDto;
import com.securechat.entity.Message;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface MessageMapper {

    @Mapping(source = "room.id",         target = "roomId")
    @Mapping(source = "replyTo.id",      target = "replyToId")
    @Mapping(source = "deleted",         target = "isDeleted")
    @Mapping(source = "edited",          target = "isEdited")
    @Mapping(source = "encrypted",       target = "isEncrypted")
    MessageDto toDto(Message message);
}
