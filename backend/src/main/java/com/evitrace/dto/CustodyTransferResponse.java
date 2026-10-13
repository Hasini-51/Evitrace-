package com.evitrace.dto;

import com.evitrace.entity.CustodyAction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CustodyTransferResponse {
    private Long id;
    private Long evidenceId;
    private String evidenceFileName;
    private Long fromUserId;
    private String fromUsername;
    private Long toUserId;
    private String toUsername;
    private CustodyAction action;
    private LocalDateTime timestamp;
    private String reason;
    private String location;
    private String status;
}
