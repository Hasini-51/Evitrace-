package com.evitrace.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignCaseRequest {
    private Long investigatorId;
}
