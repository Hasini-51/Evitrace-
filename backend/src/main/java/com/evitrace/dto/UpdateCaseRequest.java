package com.evitrace.dto;

import com.evitrace.entity.CaseStatus;
import lombok.Data;

@Data
public class UpdateCaseRequest {
    private String title;
    private String description;
    private CaseStatus status;
    private Long assignedInvestigatorId;
}
