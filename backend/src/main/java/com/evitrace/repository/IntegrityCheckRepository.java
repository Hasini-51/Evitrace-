package com.evitrace.repository;

import com.evitrace.entity.IntegrityCheck;
import com.evitrace.entity.IntegrityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IntegrityCheckRepository extends JpaRepository<IntegrityCheck, Long> {

    List<IntegrityCheck> findByEvidenceIdOrderByCheckDateDesc(Long evidenceId);

    List<IntegrityCheck> findByEvidenceIdOrderByCheckDateAsc(Long evidenceId);

    long countByStatus(IntegrityStatus status);
}
