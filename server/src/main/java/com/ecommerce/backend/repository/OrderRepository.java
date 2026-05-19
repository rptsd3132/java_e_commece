package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Used to list a customer's orders, newest first
    Page<Order> findByCustomerIdOrderByPlacedAtDesc(Long customerId, Pageable pageable);

    // Used to fetch a single order and verify ownership at the same time
    Optional<Order> findByIdAndCustomerId(Long id, Long customerId);

    // Used by sellers to view orders containing their products (traverses items->seller)
    Page<Order> findByItemsSellerIdOrderByPlacedAtDesc(Long sellerId, Pageable pageable);

    // Count distinct orders where the seller has at least one item (for dashboard totalOrders)
    @Query("SELECT COUNT(DISTINCT o) FROM Order o JOIN o.items i WHERE i.seller.id = :sellerId")
    long countDistinctByItemsSellerId(@Param("sellerId") Long sellerId);

    // Count distinct orders where seller has items AND status is in the given list (for pendingOrders)
    @Query("SELECT COUNT(DISTINCT o) FROM Order o JOIN o.items i WHERE i.seller.id = :sellerId AND o.status IN :statuses")
    long countDistinctByItemsSellerIdAndStatusIn(@Param("sellerId") Long sellerId, @Param("statuses") List<OrderStatus> statuses);
}
