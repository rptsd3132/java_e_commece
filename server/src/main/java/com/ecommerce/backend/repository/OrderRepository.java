package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Used to list a customer's orders, newest first
    Page<Order> findByCustomerIdOrderByPlacedAtDesc(Long customerId, Pageable pageable);

    // Used to fetch a single order and verify ownership at the same time
    Optional<Order> findByIdAndCustomerId(Long id, Long customerId);

    // Used by sellers to view orders containing their products (traverses items->seller)
    Page<Order> findByItemsSellerIdOrderByPlacedAtDesc(Long sellerId, Pageable pageable);
}
