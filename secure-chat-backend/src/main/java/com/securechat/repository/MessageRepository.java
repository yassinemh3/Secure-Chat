package com.securechat.repository;

import com.securechat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    /**
     * Paginated message history for a room, excluding soft-deleted messages.
     */
    @Query("SELECT m FROM Message m WHERE m.room.id = :roomId AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<Message> findByRoomId(UUID roomId, Pageable pageable);

    /**
     * Full-text search across a user's accessible messages.
     */
    @Query("SELECT m FROM Message m JOIN RoomMembership mb ON mb.room = m.room " +
           "WHERE mb.user.id = :userId AND m.isDeleted = false " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Message> searchMessages(UUID userId, String query, Pageable pageable);

    long countByRoomIdAndIsDeletedFalse(UUID roomId);
}
