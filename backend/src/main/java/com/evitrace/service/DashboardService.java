package com.evitrace.service;

import com.evitrace.audit.AuditService;
import com.evitrace.dto.*;
import com.evitrace.entity.CaseStatus;
import com.evitrace.entity.EvidenceStatus;
import com.evitrace.entity.IntegrityStatus;
import com.evitrace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CaseRepository caseRepository;
    private final EvidenceRepository evidenceRepository;
    private final CustodyTransferRepository custodyTransferRepository;
    private final IntegrityCheckRepository integrityCheckRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;
    private final EvidenceService evidenceService;

    public DashboardStatsResponse getStats() {
        long totalCases = caseRepository.count();
        long activeCases = caseRepository.countByStatus(CaseStatus.ACTIVE) + caseRepository.countByStatus(CaseStatus.UNDER_INVESTIGATION);
        long closedCases = caseRepository.countByStatus(CaseStatus.CLOSED);

        long totalEvidence = evidenceRepository.count();
        long verifiedEvidence = integrityCheckRepository.countByStatus(IntegrityStatus.VERIFIED);
        long integrityIssues = evidenceRepository.countByStatus(EvidenceStatus.TAMPERED) + integrityCheckRepository.countByStatus(IntegrityStatus.MISMATCH);

        long totalAuditLogs = auditLogRepository.count();
        Map<String, Object> verification = auditService.verifyChain();
        boolean chainValid = Boolean.TRUE.equals(verification.get("valid"));

        return DashboardStatsResponse.builder()
                .totalCases(totalCases)
                .activeCases(activeCases)
                .closedCases(closedCases)
                .totalEvidence(totalEvidence)
                .verifiedEvidence(verifiedEvidence)
                .integrityIssues(integrityIssues)
                .totalAuditLogs(totalAuditLogs)
                .auditChainValid(chainValid)
                .build();
    }

    public Map<String, Object> getRecentActivity() {
        Map<String, Object> activity = new HashMap<>();

        List<EvidenceResponse> recentEvidence = evidenceRepository.findTop5ByOrderByUploadedDateDesc()
                .stream().map(evidenceService::mapToResponse).collect(Collectors.toList());

        List<CustodyTransferResponse> recentTransfers = custodyTransferRepository.findTop5ByOrderByTimestampDesc()
                .stream().map(evidenceService::mapCustodyToResponse).collect(Collectors.toList());

        List<AuditLogResponse> recentAudit = auditLogRepository.findTop10ByOrderByIdDesc()
                .stream().map(a -> AuditLogResponse.builder()
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

        activity.put("recentEvidence", recentEvidence);
        activity.put("recentTransfers", recentTransfers);
        activity.put("recentAuditLogs", recentAudit);
        return activity;
    }
}
