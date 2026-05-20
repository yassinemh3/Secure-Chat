package com.securechat.repository;

import com.securechat.entity.RoomMembership;
import com.securechat.enums.MemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomMembershipRepository extends JpaRepository<RoomMembership, UUID> {

    List<RoomMembership> findByRoomId(UUID roomId);

    Optional<RoomMembership> findByRoomIdAndUserId(UUID roomId, UUID userId);

    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);

    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);

    List<RoomMembership> findByUserIdAndRole(UUID userId, MemberRole role);

    long countByRoomId(UUID roomId);
}
