package com.ecommerce.backend.dto.cart;

import java.math.BigDecimal;

// Represents a single line item in a user's shopping cart response
public record CartItemResponse(
        Long cartItemId,
        Long productId,
        String productName,
        String productImageUrl,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal lineTotal
) {}
