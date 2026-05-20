package com.securechat.repository;

import com.securechat.entity.ChatRoom;
import com.securechat.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    /**
     * Rooms that the given user is a member of, ordered by latest activity.
     */
    @Query("SELECT r FROM ChatRoom r JOIN RoomMembership m ON m.room = r " +
           "WHERE m.user.id = :userId ORDER BY r.updatedAt DESC")
    List<ChatRoom> findRoomsByUserId(UUID userId);

    /**
     * Finds an existing DIRECT room between two users.
     */
    @Query("SELECT r FROM ChatRoom r JOIN RoomMembership m1 ON m1.room = r " +
           "JOIN RoomMembership m2 ON m2.room = r " +
           "WHERE r.type = 'DIRECT' AND m1.user.id = :userA AND m2.user.id = :userB")
    Optional<ChatRoom> findDirectRoom(UUID userA, UUID userB);

    List<ChatRoom> findByType(RoomType type);
}
