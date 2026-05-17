package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// Repository for managing cart items in the database
@Repository
public interface CartRepository extends JpaRepository<CartItem, Long> {

    // Load all cart items belonging to a specific user (their entire shopping cart)
    List<CartItem> findByUserId(Long userId);

    // Find a specific cart item by user and product — used to detect duplicates
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

    // Delete all cart items for a user — called after an order is placed to clear the cart
    void deleteByUserId(Long userId);
}
