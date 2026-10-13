package com.evitrace.dto;

import com.evitrace.entity.CustodyAction;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransferCustodyRequest {

    private Long toUserId;

    @NotNull(message = "Action is required")
    private CustodyAction action;

    private String reason;

    private String location;
}
