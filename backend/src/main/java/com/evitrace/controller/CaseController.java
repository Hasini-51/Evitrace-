package com.evitrace.controller;

import com.evitrace.dto.AssignCaseRequest;
import com.evitrace.dto.CaseResponse;
import com.evitrace.dto.CreateCaseRequest;
import com.evitrace.dto.UpdateCaseRequest;
import com.evitrace.entity.CaseStatus;
import com.evitrace.service.CaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService caseService;

    @GetMapping
    public ResponseEntity<List<CaseResponse>> getCases(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) CaseStatus status
    ) {
        return ResponseEntity.ok(caseService.getCases(query, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseResponse> getCaseById(@PathVariable Long id) {
        return ResponseEntity.ok(caseService.getCaseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR')")
    public ResponseEntity<CaseResponse> createCase(
            @Valid @RequestBody CreateCaseRequest request,
            Authentication auth
    ) {
        CaseResponse created = caseService.createCase(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR')")
    public ResponseEntity<CaseResponse> updateCase(
            @PathVariable Long id,
            @RequestBody UpdateCaseRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(caseService.updateCase(id, request, auth.getName()));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR')")
    public ResponseEntity<CaseResponse> assignInvestigator(
            @PathVariable Long id,
            @Valid @RequestBody AssignCaseRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(caseService.assignInvestigator(id, request.getInvestigatorId(), auth.getName()));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR')")
    public ResponseEntity<CaseResponse> closeCase(
            @PathVariable Long id,
            Authentication auth
    ) {
        return ResponseEntity.ok(caseService.closeCase(id, auth.getName()));
    }
}
