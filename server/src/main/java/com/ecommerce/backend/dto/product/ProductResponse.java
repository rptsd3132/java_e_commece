package com.ecommerce.backend.dto.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Integer stockQuantity,
        String status,
        Long sellerId,
        String sellerName,
        String storeName,
        Long categoryId,
        String categoryName,
        List<String> imageUrls,
        String primaryImageUrl,
        Double averageRating,
        Integer reviewCount,
        LocalDateTime createdAt
) {}
