package com.ecommerce.backend.dto.auth;

public record AuthResponse(
        String token,
        Long userId,
        String email,
        String firstName,
        String lastName,
        String role,
        String storeName
) {}
