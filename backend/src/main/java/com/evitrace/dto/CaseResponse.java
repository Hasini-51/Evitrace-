package com.evitrace.dto;

import com.evitrace.entity.CaseStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CaseResponse {
    private Long id;
    private String caseNumber;
    private String title;
    private String description;
    private CaseStatus status;
    private Long createdById;
    private String createdByUsername;
    private Long assignedInvestigatorId;
    private String assignedInvestigatorUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long evidenceCount;
}
