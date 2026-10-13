package com.evitrace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "integrity_checks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrityCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checked_by", nullable = false)
    private User checkedBy;

    @Column(nullable = false, length = 64)
    private String expectedHash;

    @Column(nullable = false, length = 64)
    private String actualHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IntegrityStatus status;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime checkDate;

    @PrePersist
    protected void onCreate() {
        checkDate = LocalDateTime.now();
    }
}
