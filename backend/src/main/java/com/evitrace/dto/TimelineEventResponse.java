package com.evitrace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TimelineEventResponse {
    private String eventType;       // UPLOAD, TRANSFER, INTEGRITY_CHECK, ACCESS
    private String title;
    private String description;
    private String actor;
    private String status;
    private LocalDateTime timestamp;
    private String hashOrMeta;
}
