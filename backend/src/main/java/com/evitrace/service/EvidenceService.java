package com.evitrace.service;

import com.evitrace.audit.AuditService;
import com.evitrace.dto.*;
import com.evitrace.entity.*;
import com.evitrace.exception.ResourceNotFoundException;
import com.evitrace.hashing.HashingService;
import com.evitrace.repository.*;
import com.evitrace.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final CustodyTransferRepository custodyTransferRepository;
    private final IntegrityCheckRepository integrityCheckRepository;
    private final AuditLogRepository auditLogRepository;
    private final HashingService hashingService;
    private final StorageService storageService;
    private final AuditService auditService;

    @Transactional
    public EvidenceResponse uploadEvidence(
            Long caseId,
            MultipartFile file,
            String description,
            String currentUsername
    ) throws IOException {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with ID: " + caseId));

        User uploader = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        // 1. Calculate SHA-256 fingerprint of the uploaded file
        String sha256 = hashingService.hashMultipartFile(file);

        // 2. Store the file securely on disk
        String storagePath = storageService.store(file, caseId);

        // 3. Save Evidence entity
        Evidence evidence = Evidence.builder()
                .caseEntity(caseEntity)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .fileSize(file.getSize())
                .storagePath(storagePath)
                .sha256Hash(sha256)
                .uploadedBy(uploader)
                .description(description)
                .status(EvidenceStatus.STORED)
                .build();

        Evidence saved = evidenceRepository.save(evidence);

        // 4. Record initial chain-of-custody entry
        CustodyTransfer initialTransfer = CustodyTransfer.builder()
                .evidence(saved)
                .fromUser(uploader)
                .toUser(uploader)
                .action(CustodyAction.UPLOADED)
                .timestamp(LocalDateTime.now())
                .reason("Initial evidence intake into EviTrace")
                .location("Digital Evidence Repository - Case #" + caseEntity.getCaseNumber())
                .status("VERIFIED")
                .build();
        custodyTransferRepository.save(initialTransfer);

        // 5. Record initial baseline integrity check
        IntegrityCheck initialCheck = IntegrityCheck.builder()
                .evidence(saved)
                .checkedBy(uploader)
                .expectedHash(sha256)
                .actualHash(sha256)
                .status(IntegrityStatus.VERIFIED)
                .notes("Baseline cryptographic signature recorded upon ingest")
                .checkDate(LocalDateTime.now())
                .build();
        integrityCheckRepository.save(initialCheck);

        // 6. Record tamper-evident audit log
        auditService.logAction(
                uploader.getId(),
                uploader.getUsername(),
                AuditAction.EVIDENCE_UPLOADED,
                "EVIDENCE",
                saved.getId(),
                String.format("Uploaded evidence '%s' (SHA-256: %s, Size: %d bytes) for Case %s",
                        saved.getFileName(), sha256, saved.getFileSize(), caseEntity.getCaseNumber())
        );

        return mapToResponse(saved);
    }

    public List<EvidenceResponse> searchEvidence(String query, Long caseId, String fileType, EvidenceStatus status) {
        List<Evidence> list = evidenceRepository.searchEvidence(
                (query != null && !query.isBlank()) ? query.trim() : null,
                caseId,
                (fileType != null && !fileType.isBlank()) ? fileType.trim() : null,
                status
        );
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<EvidenceResponse> getEvidenceByCase(Long caseId) {
        return evidenceRepository.findByCaseEntityId(caseId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public EvidenceResponse getEvidenceById(Long id, String currentUsername) {
        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with ID: " + id));

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        if (currentUser != null) {
            auditService.logAction(
                    currentUser.getId(),
                    currentUser.getUsername(),
                    AuditAction.EVIDENCE_ACCESSED,
                    "EVIDENCE",
                    evidence.getId(),
                    "Viewed evidence details for: " + evidence.getFileName()
            );
        }

        return mapToResponse(evidence);
    }

    public Resource downloadEvidenceFile(Long id, String currentUsername) throws FileNotFoundException {
        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with ID: " + id));

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        if (currentUser != null) {
            auditService.logAction(
                    currentUser.getId(),
                    currentUser.getUsername(),
                    AuditAction.EVIDENCE_DOWNLOADED,
                    "EVIDENCE",
                    evidence.getId(),
                    "Downloaded file: " + evidence.getFileName()
            );
        }

        return storageService.loadAsResource(evidence.getStoragePath());
    }

    @Transactional
    public IntegrityCheckResponse verifyEvidenceIntegrity(Long id, String currentUsername) {
        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with ID: " + id));

        User verifier = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        String expectedHash = evidence.getSha256Hash();
        String actualHash;
        try {
            Path filePath = Paths.get(evidence.getStoragePath());
            actualHash = hashingService.hashFile(filePath);
        } catch (Exception e) {
            log.error("Failed to read evidence file for integrity verification: {}", evidence.getStoragePath(), e);
            actualHash = "UNREADABLE_FILE_ERROR";
        }

        boolean matched = expectedHash.equalsIgnoreCase(actualHash);
        IntegrityStatus status = matched ? IntegrityStatus.VERIFIED : IntegrityStatus.MISMATCH;

        if (!matched) {
            evidence.setStatus(EvidenceStatus.TAMPERED);
            evidenceRepository.save(evidence);
        }

        String notes = matched
                ? "Cryptographic SHA-256 fingerprint verified successfully against physical storage."
                : "Integrity verification failed. The current file hash does not match the stored hash.";

        IntegrityCheck check = IntegrityCheck.builder()
                .evidence(evidence)
                .checkedBy(verifier)
                .expectedHash(expectedHash)
                .actualHash(actualHash)
                .status(status)
                .notes(notes)
                .checkDate(LocalDateTime.now())
                .build();
        IntegrityCheck savedCheck = integrityCheckRepository.save(check);

        // Tamper-evident audit log
        auditService.logAction(
                verifier.getId(),
                verifier.getUsername(),
                AuditAction.EVIDENCE_VERIFIED,
                "EVIDENCE",
                evidence.getId(),
                String.format("Integrity check result: %s (Expected: %s, Actual: %s)", status, expectedHash, actualHash)
        );

        return IntegrityCheckResponse.builder()
                .id(savedCheck.getId())
                .evidenceId(evidence.getId())
                .evidenceFileName(evidence.getFileName())
                .checkedById(verifier.getId())
                .checkedByUsername(verifier.getUsername())
                .expectedHash(expectedHash)
                .actualHash(actualHash)
                .status(status)
                .matched(matched)
                .notes(notes)
                .checkDate(savedCheck.getCheckDate())
                .message(matched ? "Evidence integrity verified successfully." : "Integrity verification failed. The current file hash does not match the stored hash.")
                .build();
    }

    public List<IntegrityCheckResponse> getIntegrityHistory(Long evidenceId) {
        return integrityCheckRepository.findByEvidenceIdOrderByCheckDateDesc(evidenceId)
                .stream().map(this::mapIntegrityCheckToResponse).collect(Collectors.toList());
    }

    @Transactional
    public CustodyTransferResponse transferCustody(Long evidenceId, TransferCustodyRequest request, String currentUsername) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with ID: " + evidenceId));

        User fromUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        User toUser = null;
        if (request.getToUserId() != null) {
            toUser = userRepository.findById(request.getToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found with ID: " + request.getToUserId()));
        }

        CustodyTransfer transfer = CustodyTransfer.builder()
                .evidence(evidence)
                .fromUser(fromUser)
                .toUser(toUser)
                .action(request.getAction())
                .timestamp(LocalDateTime.now())
                .reason(request.getReason())
                .location(request.getLocation() != null ? request.getLocation() : "Evidence Storage")
                .status("COMPLETED")
                .build();

        CustodyTransfer saved = custodyTransferRepository.save(transfer);

        auditService.logAction(
                fromUser.getId(),
                fromUser.getUsername(),
                AuditAction.EVIDENCE_TRANSFERRED,
                "EVIDENCE",
                evidence.getId(),
                String.format("Custody action '%s' performed by '%s' -> recipient: '%s'. Reason: %s",
                        request.getAction(),
                        fromUser.getUsername(),
                        toUser != null ? toUser.getUsername() : "N/A",
                        request.getReason() != null ? request.getReason() : "N/A")
        );

        return mapCustodyToResponse(saved);
    }

    public List<CustodyTransferResponse> getCustodyChain(Long evidenceId) {
        return custodyTransferRepository.findByEvidenceIdOrderByTimestampAsc(evidenceId)
                .stream().map(this::mapCustodyToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteEvidence(Long id, String currentUsername) {
        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with ID: " + id));

        User user = userRepository.findByUsername(currentUsername).orElse(null);

        storageService.delete(evidence.getStoragePath());
        evidenceRepository.delete(evidence);

        if (user != null) {
            auditService.logAction(
                    user.getId(),
                    user.getUsername(),
                    AuditAction.EVIDENCE_DELETED,
                    "EVIDENCE",
                    id,
                    "Deleted evidence: " + evidence.getFileName()
            );
        }
    }

    public ProvenanceGraphResponse getEvidenceProvenance(Long evidenceId) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with ID: " + evidenceId));

        List<ProvenanceGraphResponse.GraphNode> nodes = new ArrayList<>();
        List<ProvenanceGraphResponse.GraphEdge> edges = new ArrayList<>();

        // 1. Case Node
        CaseEntity caseEntity = evidence.getCaseEntity();
        String caseNodeId = "case-" + caseEntity.getId();
        nodes.add(ProvenanceGraphResponse.GraphNode.builder()
                .id(caseNodeId)
                .label("Case: " + caseEntity.getCaseNumber())
                .subtitle(caseEntity.getTitle())
                .type("CASE")
                .status(caseEntity.getStatus().name())
                .timestamp(caseEntity.getCreatedAt().toString())
                .build());

        // 2. Evidence Node
        String evidenceNodeId = "evidence-" + evidence.getId();
        nodes.add(ProvenanceGraphResponse.GraphNode.builder()
                .id(evidenceNodeId)
                .label(evidence.getFileName())
                .subtitle("SHA-256: " + evidence.getSha256Hash().substring(0, 16) + "...")
                .type("EVIDENCE")
                .status(evidence.getStatus().name())
                .timestamp(evidence.getUploadedDate().toString())
                .build());

        edges.add(ProvenanceGraphResponse.GraphEdge.builder()
                .id("edge-case-evidence")
                .source(caseNodeId)
                .target(evidenceNodeId)
                .label("CONTAINS_EVIDENCE")
                .build());

        // 3. Custody Transfer Nodes and Edges
        List<CustodyTransfer> transfers = custodyTransferRepository.findByEvidenceIdOrderByTimestampAsc(evidenceId);
        String previousNodeId = evidenceNodeId;

        for (int i = 0; i < transfers.size(); i++) {
            CustodyTransfer t = transfers.get(i);
            String transferNodeId = "custody-" + t.getId();

            String subtitle = String.format("%s ➔ %s",
                    t.getFromUser().getUsername(),
                    t.getToUser() != null ? t.getToUser().getUsername() : "Locker");

            nodes.add(ProvenanceGraphResponse.GraphNode.builder()
                    .id(transferNodeId)
                    .label(t.getAction().name())
                    .subtitle(subtitle)
                    .type("TRANSFER")
                    .status(t.getStatus())
                    .timestamp(t.getTimestamp().toString())
                    .build());

            edges.add(ProvenanceGraphResponse.GraphEdge.builder()
                    .id("edge-t-" + t.getId())
                    .source(previousNodeId)
                    .target(transferNodeId)
                    .label(t.getAction().name())
                    .build());

            previousNodeId = transferNodeId;
        }

        // 4. Latest Integrity Check Node
        List<IntegrityCheck> checks = integrityCheckRepository.findByEvidenceIdOrderByCheckDateDesc(evidenceId);
        if (!checks.isEmpty()) {
            IntegrityCheck latestCheck = checks.get(0);
            String checkNodeId = "check-" + latestCheck.getId();
            nodes.add(ProvenanceGraphResponse.GraphNode.builder()
                    .id(checkNodeId)
                    .label("Integrity: " + latestCheck.getStatus().name())
                    .subtitle("Verified by @" + latestCheck.getCheckedBy().getUsername())
                    .type("CHECK")
                    .status(latestCheck.getStatus().name())
                    .timestamp(latestCheck.getCheckDate().toString())
                    .build());

            edges.add(ProvenanceGraphResponse.GraphEdge.builder()
                    .id("edge-check-" + latestCheck.getId())
                    .source(evidenceNodeId)
                    .target(checkNodeId)
                    .label("SHA256_VERIFICATION")
                    .build());
        }

        return ProvenanceGraphResponse.builder()
                .nodes(nodes)
                .edges(edges)
                .build();
    }

    public List<TimelineEventResponse> getEvidenceTimeline(Long evidenceId) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with ID: " + evidenceId));

        List<TimelineEventResponse> events = new ArrayList<>();

        // 1. Initial Upload
        events.add(TimelineEventResponse.builder()
                .eventType("UPLOAD")
                .title("Evidence Ingested & Hashed")
                .description("File uploaded into secure storage with SHA-256 fingerprint generated.")
                .actor(evidence.getUploadedBy().getUsername())
                .status("SUCCESS")
                .timestamp(evidence.getUploadedDate())
                .hashOrMeta(evidence.getSha256Hash())
                .build());

        // 2. Custody Transfers
        List<CustodyTransfer> transfers = custodyTransferRepository.findByEvidenceIdOrderByTimestampAsc(evidenceId);
        for (CustodyTransfer t : transfers) {
            String desc = t.getReason() != null ? t.getReason() : ("Action: " + t.getAction().name());
            String toWhom = t.getToUser() != null ? (" to @" + t.getToUser().getUsername()) : "";
            events.add(TimelineEventResponse.builder()
                    .eventType("TRANSFER")
                    .title("Chain-of-Custody: " + t.getAction().name() + toWhom)
                    .description(desc + (t.getLocation() != null ? " [Location: " + t.getLocation() + "]" : ""))
                    .actor(t.getFromUser().getUsername())
                    .status(t.getStatus())
                    .timestamp(t.getTimestamp())
                    .hashOrMeta(t.getLocation())
                    .build());
        }

        // 3. Integrity Checks
        List<IntegrityCheck> checks = integrityCheckRepository.findByEvidenceIdOrderByCheckDateAsc(evidenceId);
        for (IntegrityCheck c : checks) {
            events.add(TimelineEventResponse.builder()
                    .eventType("INTEGRITY_CHECK")
                    .title("SHA-256 Integrity Verification: " + c.getStatus().name())
                    .description(c.getNotes())
                    .actor(c.getCheckedBy().getUsername())
                    .status(c.getStatus().name())
                    .timestamp(c.getCheckDate())
                    .hashOrMeta(c.getActualHash())
                    .build());
        }

        // 4. Audit events
        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityIdOrderByIdDesc("EVIDENCE", evidenceId);
        for (AuditLog a : auditLogs) {
            if (a.getAction() == AuditAction.EVIDENCE_DOWNLOADED || a.getAction() == AuditAction.EVIDENCE_ACCESSED) {
                events.add(TimelineEventResponse.builder()
                        .eventType("ACCESS")
                        .title("Evidence Accessed: " + a.getAction().name())
                        .description(a.getDetails())
                        .actor(a.getUsername())
                        .status("LOGGED")
                        .timestamp(a.getTimestamp())
                        .hashOrMeta("Audit #" + a.getId())
                        .build());
            }
        }

        // Sort descending by timestamp
        events.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return events;
    }

    public EvidenceResponse mapToResponse(Evidence evidence) {
        List<IntegrityCheck> checks = integrityCheckRepository.findByEvidenceIdOrderByCheckDateDesc(evidence.getId());
        String lastIntegrityStatus = checks.isEmpty() ? "UNCHECKED" : checks.get(0).getStatus().name();
        LocalDateTime lastVerifiedDate = checks.isEmpty() ? null : checks.get(0).getCheckDate();

        return EvidenceResponse.builder()
                .id(evidence.getId())
                .caseId(evidence.getCaseEntity().getId())
                .caseNumber(evidence.getCaseEntity().getCaseNumber())
                .caseTitle(evidence.getCaseEntity().getTitle())
                .fileName(evidence.getFileName())
                .fileType(evidence.getFileType())
                .fileSize(evidence.getFileSize())
                .storagePath(evidence.getStoragePath())
                .sha256Hash(evidence.getSha256Hash())
                .uploadedById(evidence.getUploadedBy().getId())
                .uploadedByUsername(evidence.getUploadedBy().getUsername())
                .description(evidence.getDescription())
                .status(evidence.getStatus())
                .uploadedDate(evidence.getUploadedDate())
                .lastIntegrityStatus(lastIntegrityStatus)
                .lastVerifiedDate(lastVerifiedDate)
                .build();
    }

    public CustodyTransferResponse mapCustodyToResponse(CustodyTransfer t) {
        return CustodyTransferResponse.builder()
                .id(t.getId())
                .evidenceId(t.getEvidence().getId())
                .evidenceFileName(t.getEvidence().getFileName())
                .fromUserId(t.getFromUser().getId())
                .fromUsername(t.getFromUser().getUsername())
                .toUserId(t.getToUser() != null ? t.getToUser().getId() : null)
                .toUsername(t.getToUser() != null ? t.getToUser().getUsername() : null)
                .action(t.getAction())
                .timestamp(t.getTimestamp())
                .reason(t.getReason())
                .location(t.getLocation())
                .status(t.getStatus())
                .build();
    }

    public IntegrityCheckResponse mapIntegrityCheckToResponse(IntegrityCheck check) {
        boolean matched = check.getStatus() == IntegrityStatus.VERIFIED;
        return IntegrityCheckResponse.builder()
                .id(check.getId())
                .evidenceId(check.getEvidence().getId())
                .evidenceFileName(check.getEvidence().getFileName())
                .checkedById(check.getCheckedBy().getId())
                .checkedByUsername(check.getCheckedBy().getUsername())
                .expectedHash(check.getExpectedHash())
                .actualHash(check.getActualHash())
                .status(check.getStatus())
                .matched(matched)
                .notes(check.getNotes())
                .checkDate(check.getCheckDate())
                .message(matched ? "Evidence integrity verified." : "Integrity mismatch detected!")
                .build();
    }
}
