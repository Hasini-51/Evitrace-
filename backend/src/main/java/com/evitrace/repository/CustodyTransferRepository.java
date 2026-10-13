package com.evitrace.repository;

import com.evitrace.entity.CustodyTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustodyTransferRepository extends JpaRepository<CustodyTransfer, Long> {

    List<CustodyTransfer> findByEvidenceIdOrderByTimestampDesc(Long evidenceId);

    List<CustodyTransfer> findByEvidenceIdOrderByTimestampAsc(Long evidenceId);

    List<CustodyTransfer> findTop5ByOrderByTimestampDesc();
}
