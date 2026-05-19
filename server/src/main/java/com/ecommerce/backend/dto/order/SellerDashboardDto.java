package com.ecommerce.backend.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * SellerDashboardDto — response payload for GET /api/seller/dashboard
 *
 * Contains aggregated stats and the 5 most recent orders for the logged-in seller.
 *
 * Fields:
 *   totalOrders       — distinct order count where seller has at least one item
 *   pendingOrders     — count where status is PENDING or CONFIRMED
 *   totalProducts     — total products owned by this seller
 *   revenueThisMonth  — SUM of order_items.line_total for current calendar month
 *   revenueTotal      — SUM of order_items.line_total for all time
 *   recentOrders      — last 5 orders (id, customerName, total, status, date)
 */
public record SellerDashboardDto(
        long totalOrders,
        long pendingOrders,
        long totalProducts,
        BigDecimal revenueThisMonth,
        BigDecimal revenueTotal,
        List<RecentOrderDto> recentOrders
) {

    /**
     * RecentOrderDto — lightweight summary of one order for the dashboard table.
     *
     * Fields:
     *   id            — order primary key
     *   customerName  — customer's full name (firstName + lastName)
     *   total         — seller's share of this order (SUM of line_total for this seller's items)
     *   status        — order status enum value
     *   date          — when the order was placed
     */
    public record RecentOrderDto(
            Long id,
            String customerName,
            BigDecimal total,
            String status,
            LocalDateTime date
    ) {}
}
