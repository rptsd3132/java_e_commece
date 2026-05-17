package com.ecommerce.backend.dto.wishlist;

import java.math.BigDecimal;

// Represents a single item in a user's wishlist response
public record WishlistItemResponse(
        Long productId,
        String productName,
        String productImageUrl,
        BigDecimal price,
        Double averageRating
) {}
