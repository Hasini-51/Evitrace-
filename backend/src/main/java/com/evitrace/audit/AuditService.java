package com.evitrace.audit;

import com.evitrace.entity.AuditAction;
import com.evitrace.entity.AuditLog;
import com.evitrace.hashing.HashingService;
import com.evitrace.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    public static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    private final AuditLogRepository auditLogRepository;
    private final HashingService hashingService;

    @Transactional
    public synchronized AuditLog logAction(
            Long userId,
            String username,
            AuditAction action,
            String entityType,
            Long entityId,
            String details
    ) {
        String previousHash = GENESIS_HASH;
        Optional<AuditLog> latestLogOpt = auditLogRepository.findTopByOrderByIdDesc();
        if (latestLogOpt.isPresent()) {
            previousHash = latestLogOpt.get().getCurrentHash();
        }

        LocalDateTime now = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
        String currentHash = computeHash(previousHash, now, userId, username, action, entityType, entityId, details);

        AuditLog logEntry = AuditLog.builder()
                .userId(userId != null ? userId : 0L)
                .username(username != null ? username : "SYSTEM")
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .previousHash(previousHash)
                .currentHash(currentHash)
                .timestamp(now)
                .build();

        AuditLog saved = auditLogRepository.save(logEntry);
        log.info("Audit log #{} created [{}] by '{}' -> currentHash: {}...",
                saved.getId(), action, username, currentHash.substring(0, 12));
        return saved;
    }

    public String computeHash(
            String previousHash,
            LocalDateTime timestamp,
            Long userId,
            String username,
            AuditAction action,
            String entityType,
            Long entityId,
            String details
    ) {
        String tsStr = timestamp != null ? timestamp.truncatedTo(java.time.temporal.ChronoUnit.SECONDS).toString() : "";
        String payload = String.format("%s|%s|%d|%s|%s|%s|%s|%s",
                previousHash != null ? previousHash : GENESIS_HASH,
                tsStr,
                userId != null ? userId : 0L,
                username != null ? username : "",
                action != null ? action.name() : "",
                entityType != null ? entityType : "",
                entityId != null ? entityId.toString() : "",
                details != null ? details : ""
        );
        return hashingService.hashString(payload);
    }

    public Map<String, Object> verifyChain() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByIdAsc();
        Map<String, Object> result = new HashMap<>();

        if (logs.isEmpty()) {
            result.put("valid", true);
            result.put("totalRecords", 0);
            result.put("message", "Audit chain is empty. No records to verify.");
            return result;
        }

        String expectedPreviousHash = GENESIS_HASH;

        for (int i = 0; i < logs.size(); i++) {
            AuditLog current = logs.get(i);

            // 1. Verify previous hash pointer
            if (!current.getPreviousHash().equals(expectedPreviousHash)) {
                result.put("valid", false);
                result.put("totalRecords", logs.size());
                result.put("failedRecordIndex", i);
                result.put("failedRecordId", current.getId());
                result.put("reason", "PREVIOUS_HASH_MISMATCH");
                result.put("expectedPreviousHash", expectedPreviousHash);
                result.put("actualPreviousHash", current.getPreviousHash());
                result.put("message", "Tamper detected at record #" + current.getId() + ": Previous hash pointer is broken.");
                return result;
            }

            // 2. Recompute current hash
            String calculatedCurrentHash = computeHash(
                    current.getPreviousHash(),
                    current.getTimestamp(),
                    current.getUserId(),
                    current.getUsername(),
                    current.getAction(),
                    current.getEntityType(),
                    current.getEntityId(),
                    current.getDetails()
            );

            if (!calculatedCurrentHash.equalsIgnoreCase(current.getCurrentHash())) {
                result.put("valid", false);
                result.put("totalRecords", logs.size());
                result.put("failedRecordIndex", i);
                result.put("failedRecordId", current.getId());
                result.put("reason", "RECORD_DATA_TAMPERED");
                result.put("expectedHash", calculatedCurrentHash);
                result.put("actualHash", current.getCurrentHash());
                result.put("message", "Tamper detected at record #" + current.getId() + ": Record content was altered.");
                return result;
            }

            expectedPreviousHash = current.getCurrentHash();
        }

        result.put("valid", true);
        result.put("totalRecords", logs.size());
        result.put("genesisHash", GENESIS_HASH);
        result.put("latestHash", expectedPreviousHash);
        result.put("message", "Cryptographic audit chain verified successfully! All " + logs.size() + " records are tamper-evident and authentic.");
        return result;
    }
}
