package com.evitrace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCaseRequest {

    @NotBlank(message = "Case title is required")
    private String title;

    private String description;

    private Long assignedInvestigatorId;
}
