package com.ecommerce.backend.dto.order;

import jakarta.validation.constraints.NotNull;

public record PlaceOrderRequest(
        @NotNull(message = "Address is required")
        Long addressId,

        String couponCode
) {}
