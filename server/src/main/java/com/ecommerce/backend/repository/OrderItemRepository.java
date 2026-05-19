package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Used to list all items in a specific order
    List<OrderItem> findByOrderId(Long orderId);

    // Used by sellers to view their sold items
    List<OrderItem> findBySellerId(Long sellerId);

    // Used to verify a customer bought a product before allowing a review
    boolean existsByOrderCustomerIdAndProductId(Long customerId, Long productId);

    // Sum of line_total for all items sold by this seller (total lifetime revenue)
    @Query("SELECT COALESCE(SUM(oi.lineTotal), 0) FROM OrderItem oi WHERE oi.seller.id = :sellerId")
    BigDecimal sumLineTotalBySellerId(@Param("sellerId") Long sellerId);

    // Sum of line_total for items sold by this seller within a date range (monthly revenue)
    @Query("SELECT COALESCE(SUM(oi.lineTotal), 0) FROM OrderItem oi WHERE oi.seller.id = :sellerId AND oi.order.placedAt >= :start AND oi.order.placedAt <= :end")
    BigDecimal sumLineTotalBySellerIdAndOrderPlacedAtBetween(
            @Param("sellerId") Long sellerId,
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end
    );

    // Find the 5 most recent order items for this seller (to derive recent orders)
    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order o JOIN FETCH o.customer WHERE oi.seller.id = :sellerId ORDER BY o.placedAt DESC")
    List<OrderItem> findTop5BySellerIdOrderByOrderPlacedAtDesc(@Param("sellerId") Long sellerId);
}
