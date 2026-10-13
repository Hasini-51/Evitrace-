package com.evitrace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "custody_transfers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustodyTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_user", nullable = false)
    private User fromUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_user")
    private User toUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CustodyAction action;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(length = 500)
    private String reason;

    @Column(length = 200)
    private String location;

    @Column(length = 50)
    @Builder.Default
    private String status = "COMPLETED";

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
