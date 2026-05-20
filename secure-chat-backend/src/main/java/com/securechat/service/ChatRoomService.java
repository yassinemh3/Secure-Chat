package com.securechat.service;

import com.securechat.dto.request.CreateRoomRequest;
import com.securechat.dto.response.ChatRoomDto;
import com.securechat.entity.ChatRoom;
import com.securechat.entity.RoomMembership;
import com.securechat.entity.User;
import com.securechat.enums.MemberRole;
import com.securechat.enums.RoomType;
import com.securechat.exception.ResourceNotFoundException;
import com.securechat.exception.RoomAccessException;
import com.securechat.mapper.ChatRoomMapper;
import com.securechat.repository.ChatRoomRepository;
import com.securechat.repository.RoomMembershipRepository;
import com.securechat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository roomRepository;
    private final RoomMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final ChatRoomMapper roomMapper;

    @Transactional
    public ChatRoomDto createRoom(CreateRoomRequest req, UUID creatorId) {
        User creator = getUser(creatorId);

        // For DIRECT chats: prevent duplicate DM rooms
        if (req.type() == RoomType.DIRECT && req.memberIds() != null && req.memberIds().size() == 1) {
            UUID otherId = req.memberIds().get(0);
            return roomRepository.findDirectRoom(creatorId, otherId)
                    .map(existing -> roomMapper.toDto(existing, membershipRepository.countByRoomId(existing.getId())))
                    .orElseGet(() -> createNewRoom(req, creator));
        }
        return createNewRoom(req, creator);
    }

    private ChatRoomDto createNewRoom(CreateRoomRequest req, User creator) {
        ChatRoom room = ChatRoom.builder()
                .name(req.name())
                .description(req.description())
                .type(req.type())
                .createdBy(creator)
                .build();
        room = roomRepository.save(room);

        // Add creator as OWNER
        addMember(room, creator, MemberRole.OWNER);

        // Add initial members as MEMBER
        if (req.memberIds() != null) {
            for (UUID memberId : req.memberIds()) {
                if (!memberId.equals(creator.getId())) {
                    addMember(room, getUser(memberId), MemberRole.MEMBER);
                }
            }
        }
        long count = membershipRepository.countByRoomId(room.getId());
        return roomMapper.toDto(room, count);
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDto> getRoomsForUser(UUID userId) {
        return roomRepository.findRoomsByUserId(userId)
                .stream()
                .map(r -> roomMapper.toDto(r, membershipRepository.countByRoomId(r.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChatRoomDto getRoomById(UUID roomId, UUID userId) {
        assertMember(roomId, userId);
        ChatRoom room = getRoom(roomId);
        return roomMapper.toDto(room, membershipRepository.countByRoomId(roomId));
    }

    @Transactional
    public void addMemberToRoom(UUID roomId, UUID requesterId, UUID newMemberId) {
        assertAdmin(roomId, requesterId);
        if (!membershipRepository.existsByRoomIdAndUserId(roomId, newMemberId)) {
            addMember(getRoom(roomId), getUser(newMemberId), MemberRole.MEMBER);
        }
    }

    @Transactional
    public void removeMemberFromRoom(UUID roomId, UUID requesterId, UUID targetUserId) {
        if (!requesterId.equals(targetUserId)) {
            assertAdmin(roomId, requesterId);
        }
        membershipRepository.deleteByRoomIdAndUserId(roomId, targetUserId);
    }

    @Transactional
    public void deleteRoom(UUID roomId, UUID requesterId) {
        assertOwner(roomId, requesterId);
        roomRepository.deleteById(roomId);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public void assertMember(UUID roomId, UUID userId) {
        if (!membershipRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new RoomAccessException("You are not a member of this room");
        }
    }

    private void assertAdmin(UUID roomId, UUID userId) {
        RoomMembership m = membershipRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RoomAccessException("Not a member"));
        if (m.getRole() == MemberRole.MEMBER) throw new RoomAccessException("Admin privileges required");
    }

    private void assertOwner(UUID roomId, UUID userId) {
        RoomMembership m = membershipRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RoomAccessException("Not a member"));
        if (m.getRole() != MemberRole.OWNER) throw new RoomAccessException("Owner privileges required");
    }

    private void addMember(ChatRoom room, User user, MemberRole role) {
        membershipRepository.save(
                RoomMembership.builder().room(room).user(user).role(role).build()
        );
    }

    public ChatRoom getRoomEntity(UUID id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", id));
    }

    private ChatRoom getRoom(UUID id) {
        return getRoomEntity(id);
    }

    private User getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }
}
