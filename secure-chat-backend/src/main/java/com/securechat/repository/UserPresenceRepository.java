package com.securechat.repository;

import com.securechat.entity.UserPresence;
import com.securechat.enums.PresenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserPresenceRepository extends JpaRepository<UserPresence, UUID> {

    /**
     * Returns presence records for all members of a given room.
     */
    @Query("SELECT p FROM UserPresence p JOIN RoomMembership m ON m.user.id = p.userId " +
           "WHERE m.room.id = :roomId")
    List<UserPresence> findPresenceByRoomId(UUID roomId);

    List<UserPresence> findByStatus(PresenceStatus status);
}
