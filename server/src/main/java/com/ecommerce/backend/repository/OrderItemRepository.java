package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Used to list all items in a specific order
    List<OrderItem> findByOrderId(Long orderId);

    // Used by sellers to view their sold items
    List<OrderItem> findBySellerId(Long sellerId);

    // Used to verify a customer bought a product before allowing a review
    boolean existsByOrderCustomerIdAndProductId(Long customerId, Long productId);
}
