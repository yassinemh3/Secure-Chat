package com.securechat.repository;

import com.securechat.entity.MessageReceipt;
import com.securechat.enums.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, UUID> {

    List<MessageReceipt> findByMessageId(UUID messageId);

    List<MessageReceipt> findByUserId(UUID userId);

    boolean existsByMessageIdAndUserId(UUID messageId, UUID userId);

    @Modifying
    @Query(value = """
            INSERT INTO message_receipts (id, message_id, user_id, status, timestamp)
            VALUES (gen_random_uuid(), :messageId, :userId, :status, NOW())
            ON CONFLICT (message_id, user_id) DO UPDATE SET status = :status, timestamp = NOW()
            """, nativeQuery = true)
    void upsertReceipt(@Param("messageId") UUID messageId,
                       @Param("userId")    UUID userId,
                       @Param("status")    String status);

    @Query("SELECT mr FROM MessageReceipt mr WHERE mr.message.id IN :messageIds AND mr.user.id = :userId")
    List<MessageReceipt> findByMessageIdsAndUserId(@Param("messageIds") List<UUID> messageIds,
                                                   @Param("userId")     UUID userId);
}
