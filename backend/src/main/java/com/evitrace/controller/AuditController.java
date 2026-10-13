package com.evitrace.controller;

import com.evitrace.audit.AuditService;
import com.evitrace.dto.AuditLogResponse;
import com.evitrace.entity.AuditLog;
import com.evitrace.exception.ResourceNotFoundException;
import com.evitrace.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByIdDesc();
        List<AuditLogResponse> response = logs.stream().map(a -> AuditLogResponse.builder()
                .id(a.getId())
                .userId(a.getUserId())
                .username(a.getUsername())
                .action(a.getAction())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .details(a.getDetails())
                .previousHash(a.getPreviousHash())
                .currentHash(a.getCurrentHash())
                .timestamp(a.getTimestamp())
                .build()
        ).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyAuditChain() {
        return ResponseEntity.ok(auditService.verifyChain());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditLogResponse> getAuditLogById(@PathVariable Long id) {
        AuditLog a = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit log not found with ID: " + id));

        return ResponseEntity.ok(AuditLogResponse.builder()
                .id(a.getId())
                .userId(a.getUserId())
                .username(a.getUsername())
                .action(a.getAction())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .details(a.getDetails())
                .previousHash(a.getPreviousHash())
                .currentHash(a.getCurrentHash())
                .timestamp(a.getTimestamp())
                .build());
    }
}
