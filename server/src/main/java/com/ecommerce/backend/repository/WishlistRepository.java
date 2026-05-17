package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// Repository for managing wishlist items in the database
@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {

    // Load all wishlist items belonging to a specific user (their entire wishlist)
    List<WishlistItem> findByUserId(Long userId);

    // Check if a specific product is already in a user's wishlist — used to prevent duplicates
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    // Find a specific wishlist item by user and product — used to return existing item response
    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);

    // Remove a specific product from a user's wishlist
    void deleteByUserIdAndProductId(Long userId, Long productId);
}
