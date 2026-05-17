package com.ecommerce.backend.dto.order;

import com.ecommerce.backend.model.enums.OrderStatus;

import java.time.LocalDateTime;

public record OrderStatusDto(
        OrderStatus status,
        String note,
        LocalDateTime changedAt
) {}
