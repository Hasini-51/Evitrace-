package com.evitrace.config;

import com.evitrace.audit.AuditService;
import com.evitrace.entity.*;
import com.evitrace.hashing.HashingService;
import com.evitrace.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final EvidenceRepository evidenceRepository;
    private final CustodyTransferRepository custodyTransferRepository;
    private final IntegrityCheckRepository integrityCheckRepository;
    private final PasswordEncoder passwordEncoder;
    private final HashingService hashingService;
    private final AuditService auditService;

    @Value("${app.file.upload-dir:./uploads}")
    private String baseUploadDir;

    @Override
    public void run(String... args) {
        User admin = seedUserIfNotExists("admin", "admin@evitrace.io", "Password@123", Role.ADMIN);
        User investigator = seedUserIfNotExists("investigator", "investigator@evitrace.io", "Password@123", Role.INVESTIGATOR);
        User viewer = seedUserIfNotExists("viewer", "viewer@evitrace.io", "Password@123", Role.VIEWER);

        seedUserIfNotExists("Honey", "Honey@evitrace.io", "Honey@V51", Role.ADMIN);
        seedUserIfNotExists("Riya", "Riya@evitrace.io", "Riya@cop", Role.INVESTIGATOR);
        seedUserIfNotExists("Vaishu", "Vaishu@evitrace.io", "Vaishu@2007", Role.VIEWER);

        seedSampleDataIfEmpty(admin, investigator);
    }

    private User seedUserIfNotExists(String username, String email, String rawPassword, Role role) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .enabled(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            User saved = userRepository.save(user);
            log.info("Seeded initial account -> username: {}, role: {}", username, role);
            return saved;
        });
    }

    private void seedSampleDataIfEmpty(User admin, User investigator) {
        if (caseRepository.count() == 0) {
            CaseEntity sampleCase = CaseEntity.builder()
                    .caseNumber("CASE-2026-0001")
                    .title("Operation Cybershield: Corporate Server Intrusion")
                    .description("Forensic investigation into unauthorized lateral movement and exfiltration in financial sector infrastructure.")
                    .status(CaseStatus.UNDER_INVESTIGATION)
                    .createdBy(admin)
                    .assignedInvestigator(investigator)
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .updatedAt(LocalDateTime.now().minusHours(4))
                    .build();
            CaseEntity savedCase = caseRepository.save(sampleCase);

            auditService.logAction(
                    admin.getId(),
                    admin.getUsername(),
                    AuditAction.CASE_CREATED,
                    "CASE",
                    savedCase.getId(),
                    "Initialized baseline case: " + savedCase.getCaseNumber()
            );

            // Create sample evidence file
            try {
                Path caseDir = Paths.get(baseUploadDir).resolve("cases").resolve(String.valueOf(savedCase.getId()));
                Files.createDirectories(caseDir);

                String sampleContent = "EVITRACE FORENSIC EVIDENCE DUMP\n" +
                        "TIMESTAMP: 2026-09-22T08:30:00Z\n" +
                        "DEVICE: Server-SRV-FIN-09\n" +
                        "NETWORK_INTERFACE: eth0 (10.240.12.88)\n" +
                        "MALICIOUS_PROCESS_ID: 8841\n" +
                        "DIGITAL_SIGNATURE: VERIFIED_TAMPER_RESISTANT\n";

                Path sampleFilePath = caseDir.resolve("evidence_network_dump.log");
                Files.writeString(sampleFilePath, sampleContent, StandardCharsets.UTF_8);

                String hash = hashingService.hashFile(sampleFilePath);

                Evidence sampleEvidence = Evidence.builder()
                        .caseEntity(savedCase)
                        .fileName("evidence_network_dump.log")
                        .fileType("text/plain")
                        .fileSize(Files.size(sampleFilePath))
                        .storagePath(sampleFilePath.toAbsolutePath().toString())
                        .sha256Hash(hash)
                        .uploadedBy(investigator)
                        .description("Raw forensic network packet telemetry and process memory snapshot.")
                        .status(EvidenceStatus.STORED)
                        .uploadedDate(LocalDateTime.now().minusDays(1))
                        .build();

                Evidence savedEvidence = evidenceRepository.save(sampleEvidence);

                // Initial custody intake
                CustodyTransfer transfer1 = CustodyTransfer.builder()
                        .evidence(savedEvidence)
                        .fromUser(investigator)
                        .toUser(investigator)
                        .action(CustodyAction.UPLOADED)
                        .timestamp(LocalDateTime.now().minusDays(1))
                        .reason("Extracted from field forensic kit and uploaded into EviTrace locker.")
                        .location("Cyber Crime Forensic Lab #4")
                        .status("COMPLETED")
                        .build();
                custodyTransferRepository.save(transfer1);

                // Custody transfer to admin for review
                CustodyTransfer transfer2 = CustodyTransfer.builder()
                        .evidence(savedEvidence)
                        .fromUser(investigator)
                        .toUser(admin)
                        .action(CustodyAction.TRANSFERRED)
                        .timestamp(LocalDateTime.now().minusHours(6))
                        .reason("Submitted for forensic supervisor chain verification and legal signoff.")
                        .location("Central Digital Evidence Vault")
                        .status("COMPLETED")
                        .build();
                custodyTransferRepository.save(transfer2);

                // Baseline Integrity check
                IntegrityCheck check = IntegrityCheck.builder()
                        .evidence(savedEvidence)
                        .checkedBy(admin)
                        .expectedHash(hash)
                        .actualHash(hash)
                        .status(IntegrityStatus.VERIFIED)
                        .notes("Automated cryptographic verification passed with exact SHA-256 match.")
                        .checkDate(LocalDateTime.now().minusHours(5))
                        .build();
                integrityCheckRepository.save(check);

                auditService.logAction(
                        investigator.getId(),
                        investigator.getUsername(),
                        AuditAction.EVIDENCE_UPLOADED,
                        "EVIDENCE",
                        savedEvidence.getId(),
                        "Ingested sample evidence: " + savedEvidence.getFileName() + " (SHA-256: " + hash + ")"
                );

                auditService.logAction(
                        investigator.getId(),
                        investigator.getUsername(),
                        AuditAction.EVIDENCE_TRANSFERRED,
                        "EVIDENCE",
                        savedEvidence.getId(),
                        "Transferred custody to @" + admin.getUsername()
                );

                auditService.logAction(
                        admin.getId(),
                        admin.getUsername(),
                        AuditAction.EVIDENCE_VERIFIED,
                        "EVIDENCE",
                        savedEvidence.getId(),
                        "Cryptographic SHA-256 verification passed: " + hash
                );

                log.info("Seeded initial case and sample evidence item with hash {}", hash);
            } catch (Exception e) {
                log.warn("Could not seed sample evidence file", e);
            }
        }
    }
}
