package com.ecommerce.backend.dto.cart;

import java.math.BigDecimal;
import java.util.List;

// Represents the complete shopping cart response for a user
public record CartResponse(
        List<CartItemResponse> items,
        BigDecimal subtotal,
        Integer totalItems
) {}
