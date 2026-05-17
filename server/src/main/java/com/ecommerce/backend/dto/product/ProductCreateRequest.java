package com.ecommerce.backend.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record ProductCreateRequest(
        @NotBlank(message = "Product name is required")
        String name,

        String description,

        @NotNull(message = "Price is required")
        @Min(value = 0, message = "Price must be zero or greater")
        BigDecimal price,

        @NotNull(message = "Stock quantity is required")
        @Min(value = 0, message = "Stock quantity must be zero or greater")
        Integer stockQuantity,

        Long categoryId,

        String status,

        List<String> imageUrls
) {}
