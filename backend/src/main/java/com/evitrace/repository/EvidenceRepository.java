package com.evitrace.repository;

import com.evitrace.entity.Evidence;
import com.evitrace.entity.EvidenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long> {

    List<Evidence> findByCaseEntityId(Long caseId);

    long countByStatus(EvidenceStatus status);

    @Query("SELECT e FROM Evidence e WHERE " +
           "(:query IS NULL OR LOWER(e.fileName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:caseId IS NULL OR e.caseEntity.id = :caseId) AND " +
           "(:fileType IS NULL OR LOWER(e.fileType) LIKE LOWER(CONCAT('%', :fileType, '%'))) AND " +
           "(:status IS NULL OR e.status = :status) " +
           "ORDER BY e.uploadedDate DESC")
    List<Evidence> searchEvidence(
            @Param("query") String query,
            @Param("caseId") Long caseId,
            @Param("fileType") String fileType,
            @Param("status") EvidenceStatus status
    );

    List<Evidence> findTop5ByOrderByUploadedDateDesc();
}
