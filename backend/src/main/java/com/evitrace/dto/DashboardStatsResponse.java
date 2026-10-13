package com.evitrace.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalCases;
    private long activeCases;
    private long closedCases;
    private long totalEvidence;
    private long verifiedEvidence;
    private long integrityIssues;
    private long totalAuditLogs;
    private boolean auditChainValid;
}
