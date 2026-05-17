package com.ecommerce.backend.dto.order;

import com.ecommerce.backend.model.enums.OrderStatus;
import com.ecommerce.backend.model.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        OrderStatus status,
        PaymentStatus paymentStatus,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        String couponCode,
        List<OrderItemResponse> items,
        String shipStreet,
        String shipCity,
        String shipState,
        String shipZip,
        String shipCountry,
        LocalDateTime placedAt
) {}
