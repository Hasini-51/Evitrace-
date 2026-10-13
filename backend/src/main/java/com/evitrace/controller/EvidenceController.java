package com.evitrace.controller;

import com.evitrace.dto.*;
import com.evitrace.entity.EvidenceStatus;
import com.evitrace.service.EvidenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
public class EvidenceController {

    private final EvidenceService evidenceService;

    @GetMapping
    public ResponseEntity<List<EvidenceResponse>> getEvidence(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long caseId,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) EvidenceStatus status
    ) {
        return ResponseEntity.ok(evidenceService.searchEvidence(query, caseId, fileType, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvidenceResponse> getEvidenceById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(evidenceService.getEvidenceById(id, auth.getName()));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR')")
    public ResponseEntity<EvidenceResponse> uploadEvidence(
            @RequestParam("caseId") Long caseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            Authentication auth
    ) throws IOException {
        EvidenceResponse response = evidenceService.uploadEvidence(caseId, file, description, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadEvidence(@PathVariable Long id, Authentication auth) throws FileNotFoundException {
        EvidenceResponse meta = evidenceService.getEvidenceById(id, auth.getName());
        Resource resource = evidenceService.downloadEvidenceFile(id, auth.getName());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.getFileType() != null ? meta.getFileType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEvidence(@PathVariable Long id, Authentication auth) {
        evidenceService.deleteEvidence(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR')")
    public ResponseEntity<IntegrityCheckResponse> verifyEvidence(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(evidenceService.verifyEvidenceIntegrity(id, auth.getName()));
    }

    @GetMapping("/{id}/integrity")
    public ResponseEntity<List<IntegrityCheckResponse>> getIntegrityHistory(@PathVariable Long id) {
        return ResponseEntity.ok(evidenceService.getIntegrityHistory(id));
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR')")
    public ResponseEntity<CustodyTransferResponse> transferCustody(
            @PathVariable Long id,
            @Valid @RequestBody TransferCustodyRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(evidenceService.transferCustody(id, request, auth.getName()));
    }

    @GetMapping("/{id}/custody")
    public ResponseEntity<List<CustodyTransferResponse>> getCustodyChain(@PathVariable Long id) {
        return ResponseEntity.ok(evidenceService.getCustodyChain(id));
    }

    @GetMapping("/{id}/provenance")
    public ResponseEntity<ProvenanceGraphResponse> getProvenance(@PathVariable Long id) {
        return ResponseEntity.ok(evidenceService.getEvidenceProvenance(id));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<TimelineEventResponse>> getTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(evidenceService.getEvidenceTimeline(id));
    }
}
