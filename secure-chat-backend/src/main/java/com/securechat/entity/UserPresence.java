package com.securechat.entity;

import com.securechat.enums.PresenceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_presence")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserPresence {

    /** Same UUID as the user — one presence record per user */
    @Id
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition= "varchar(50)")
    @Builder.Default
    private PresenceStatus status = PresenceStatus.OFFLINE;

    @Column(name = "last_seen", nullable = false)
    @Builder.Default
    private Instant lastSeen = Instant.now();
}
