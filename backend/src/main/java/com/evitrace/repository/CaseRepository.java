package com.evitrace.repository;

import com.evitrace.entity.CaseEntity;
import com.evitrace.entity.CaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<CaseEntity, Long> {

    Optional<CaseEntity> findByCaseNumber(String caseNumber);

    boolean existsByCaseNumber(String caseNumber);

    List<CaseEntity> findByStatus(CaseStatus status);

    long countByStatus(CaseStatus status);

    @Query("SELECT c FROM CaseEntity c WHERE " +
           "(:query IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.caseNumber) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR c.status = :status) " +
           "ORDER BY c.createdAt DESC")
    List<CaseEntity> searchCases(@Param("query") String query, @Param("status") CaseStatus status);

    List<CaseEntity> findTop5ByOrderByCreatedAtDesc();
}
