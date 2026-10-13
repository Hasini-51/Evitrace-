package com.evitrace.dto;

import com.evitrace.entity.IntegrityStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class IntegrityCheckResponse {
    private Long id;
    private Long evidenceId;
    private String evidenceFileName;
    private Long checkedById;
    private String checkedByUsername;
    private String expectedHash;
    private String actualHash;
    private IntegrityStatus status;
    private boolean matched;
    private String notes;
    private LocalDateTime checkDate;
    private String message;
}
