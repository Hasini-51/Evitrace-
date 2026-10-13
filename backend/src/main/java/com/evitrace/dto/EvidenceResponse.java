package com.evitrace.dto;

import com.evitrace.entity.EvidenceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EvidenceResponse {
    private Long id;
    private Long caseId;
    private String caseNumber;
    private String caseTitle;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String storagePath;
    private String sha256Hash;
    private Long uploadedById;
    private String uploadedByUsername;
    private String description;
    private EvidenceStatus status;
    private LocalDateTime uploadedDate;
    private String lastIntegrityStatus;
    private LocalDateTime lastVerifiedDate;
}
