package com.securechat.dto.response;

import com.securechat.enums.MemberRole;

public record RoomMemberDto(
        UserDto user,
        MemberRole role
) {}
