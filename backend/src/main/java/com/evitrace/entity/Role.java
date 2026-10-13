package com.evitrace.entity;

/**
 * User roles for role-based access control.
 * ADMIN     - full system access, user management
 * INVESTIGATOR - upload, verify, and manage evidence
 * VIEWER   - read-only access to evidence
 */
public enum Role {
    ADMIN,
    INVESTIGATOR,
    VIEWER
}
