package com.ecommerce.backend.dto.address;

import jakarta.validation.constraints.NotBlank;

// DTO used for both creating and updating addresses.
// Also used as the response format (fields match the entity).
public record AddressDto(
        Long id,
        String label,
        @NotBlank(message = "Street is required")
        String street,
        @NotBlank(message = "City is required")
        String city,
        @NotBlank(message = "State is required")
        String state,
        @NotBlank(message = "Zip code is required")
        String zipCode,
        String country,
        Boolean isDefault
) {}
