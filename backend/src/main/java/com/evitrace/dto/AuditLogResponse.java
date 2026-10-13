package com.evitrace.dto;

import com.evitrace.entity.AuditAction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {
    private Long id;
    private Long userId;
    private String username;
    private AuditAction action;
    private String entityType;
    private Long entityId;
    private String details;
    private String previousHash;
    private String currentHash;
    private LocalDateTime timestamp;
}
