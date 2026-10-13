package com.evitrace.repository;

import com.evitrace.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByIdDesc();

    List<AuditLog> findAllByOrderByIdAsc();

    Optional<AuditLog> findTopByOrderByIdDesc();

    List<AuditLog> findTop10ByOrderByIdDesc();

    List<AuditLog> findByEntityTypeAndEntityIdOrderByIdDesc(String entityType, Long entityId);
}
