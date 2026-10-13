package com.evitrace.service;

import com.evitrace.audit.AuditService;
import com.evitrace.dto.CaseResponse;
import com.evitrace.dto.CreateCaseRequest;
import com.evitrace.dto.UpdateCaseRequest;
import com.evitrace.entity.AuditAction;
import com.evitrace.entity.CaseEntity;
import com.evitrace.entity.CaseStatus;
import com.evitrace.entity.User;
import com.evitrace.exception.ResourceNotFoundException;
import com.evitrace.repository.CaseRepository;
import com.evitrace.repository.EvidenceRepository;
import com.evitrace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    private final CaseRepository caseRepository;
    private final EvidenceRepository evidenceRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    private static final AtomicLong CASE_SEQ = new AtomicLong(System.currentTimeMillis() % 10000);

    @Transactional
    public CaseResponse createCase(CreateCaseRequest request, String currentUsername) {
        User creator = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        User assignedInvestigator = null;
        if (request.getAssignedInvestigatorId() != null) {
            assignedInvestigator = userRepository.findById(request.getAssignedInvestigatorId())
                    .orElse(null);
        }

        String caseNumber = generateCaseNumber();

        CaseEntity caseEntity = CaseEntity.builder()
                .caseNumber(caseNumber)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(CaseStatus.ACTIVE)
                .createdBy(creator)
                .assignedInvestigator(assignedInvestigator)
                .build();

        CaseEntity saved = caseRepository.save(caseEntity);

        auditService.logAction(
                creator.getId(),
                creator.getUsername(),
                AuditAction.CASE_CREATED,
                "CASE",
                saved.getId(),
                "Created case: " + saved.getCaseNumber() + " - " + saved.getTitle()
        );

        return mapToResponse(saved);
    }

    public List<CaseResponse> getCases(String query, CaseStatus status) {
        List<CaseEntity> list = caseRepository.searchCases(
                (query != null && !query.isBlank()) ? query.trim() : null,
                status
        );
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public CaseResponse getCaseById(Long id) {
        CaseEntity caseEntity = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with ID: " + id));
        return mapToResponse(caseEntity);
    }

    @Transactional
    public CaseResponse updateCase(Long id, UpdateCaseRequest request, String currentUsername) {
        CaseEntity caseEntity = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with ID: " + id));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElse(null);

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            caseEntity.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            caseEntity.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            caseEntity.setStatus(request.getStatus());
        }
        if (request.getAssignedInvestigatorId() != null) {
            User investigator = userRepository.findById(request.getAssignedInvestigatorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Investigator not found with ID: " + request.getAssignedInvestigatorId()));
            caseEntity.setAssignedInvestigator(investigator);
        }

        CaseEntity updated = caseRepository.save(caseEntity);

        if (currentUser != null) {
            auditService.logAction(
                    currentUser.getId(),
                    currentUser.getUsername(),
                    AuditAction.CASE_UPDATED,
                    "CASE",
                    updated.getId(),
                    "Updated case: " + updated.getCaseNumber() + " (Status: " + updated.getStatus() + ")"
            );
        }

        return mapToResponse(updated);
    }

    @Transactional
    public CaseResponse assignInvestigator(Long id, Long investigatorId, String currentUsername) {
        CaseEntity caseEntity = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with ID: " + id));

        User investigator = null;
        if (investigatorId != null) {
            investigator = userRepository.findById(investigatorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Investigator not found with ID: " + investigatorId));
        }

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        caseEntity.setAssignedInvestigator(investigator);
        CaseEntity updated = caseRepository.save(caseEntity);

        if (currentUser != null) {
            String details = (investigator != null)
                    ? "Assigned lead investigator: @" + investigator.getUsername() + " to case " + updated.getCaseNumber()
                    : "Unassigned lead investigator from case " + updated.getCaseNumber();

            auditService.logAction(
                    currentUser.getId(),
                    currentUser.getUsername(),
                    AuditAction.CASE_ASSIGNED,
                    "CASE",
                    updated.getId(),
                    details
            );
        }

        return mapToResponse(updated);
    }

    @Transactional
    public CaseResponse closeCase(Long id, String currentUsername) {
        CaseEntity caseEntity = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with ID: " + id));

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        caseEntity.setStatus(CaseStatus.CLOSED);
        CaseEntity updated = caseRepository.save(caseEntity);

        if (currentUser != null) {
            auditService.logAction(
                    currentUser.getId(),
                    currentUser.getUsername(),
                    AuditAction.CASE_CLOSED,
                    "CASE",
                    updated.getId(),
                    "Closed case: " + updated.getCaseNumber()
            );
        }

        return mapToResponse(updated);
    }

    private String generateCaseNumber() {
        int year = Year.now().getValue();
        String candidate;
        do {
            long seq = CASE_SEQ.incrementAndGet();
            candidate = String.format("CASE-%d-%04d", year, seq % 10000);
        } while (caseRepository.existsByCaseNumber(candidate));
        return candidate;
    }

    public CaseResponse mapToResponse(CaseEntity entity) {
        long evidenceCount = evidenceRepository.findByCaseEntityId(entity.getId()).size();

        return CaseResponse.builder()
                .id(entity.getId())
                .caseNumber(entity.getCaseNumber())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .createdById(entity.getCreatedBy() != null ? entity.getCreatedBy().getId() : null)
                .createdByUsername(entity.getCreatedBy() != null ? entity.getCreatedBy().getUsername() : null)
                .assignedInvestigatorId(entity.getAssignedInvestigator() != null ? entity.getAssignedInvestigator().getId() : null)
                .assignedInvestigatorUsername(entity.getAssignedInvestigator() != null ? entity.getAssignedInvestigator().getUsername() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .evidenceCount(evidenceCount)
                .build();
    }
}
