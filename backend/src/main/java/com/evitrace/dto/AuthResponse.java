package com.evitrace.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String tokenType;

    private Long userId;
    private String username;
    private String email;
    private String role;

    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;

    private String message;
}
