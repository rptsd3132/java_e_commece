package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.wishlist.WishlistItemResponse;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.ProductImage;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.model.WishlistItem;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// Service layer for managing wishlist operations
// Handles adding, removing, and retrieving wishlist items
@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Retrieves the complete wishlist for a user.
     *
     * Step 1: Load all WishlistItems for this user from the database
     * Step 2: For each WishlistItem: build a WishlistItemResponse DTO
     *           with productId, productName, productImageUrl, price, averageRating
     * Step 3: Return the list of responses
     */
    public List<WishlistItemResponse> getWishlist(Long userId) {
        // Step 1: Load all WishlistItems for this user
        List<WishlistItem> wishlistItems = wishlistRepository.findByUserId(userId);

        // Step 2: For each WishlistItem, build a WishlistItemResponse DTO
        List<WishlistItemResponse> responses = new ArrayList<>();
        for (WishlistItem item : wishlistItems) {
            responses.add(toResponse(item));
        }

        // Step 3: Return the list
        return responses;
    }

    /**
     * Adds a product to the user's wishlist.
     *
     * Step 1: Load product, check it exists
     * Step 2: Check if already in wishlist — ignore if exists (idempotent)
     * Step 3: Create new WishlistItem and save
     *
     * The UNIQUE constraint in DB prevents duplicate wishlist rows.
     */
    @Transactional
    public WishlistItemResponse addToWishlist(Long userId, Long productId) {
        // Step 1: Load product, check it exists
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // Step 2: Check if already in wishlist — ignore if exists (idempotent)
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            // Already in wishlist — return existing item's response without creating a duplicate
            WishlistItem existing = wishlistRepository.findByUserIdAndProductId(userId, productId)
                    .orElse(null);
            if (existing != null) {
                return toResponse(existing);
            }
            return null;
        }

        // Step 3: Create new WishlistItem and save
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        WishlistItem newItem = WishlistItem.builder()
                .user(user)
                .product(product)
                .build();

        wishlistRepository.save(newItem);
        return toResponse(newItem);
    }

    /**
     * Removes a product from the user's wishlist.
     *
     * Step 1: Verify the product exists in the user's wishlist
     * Step 2: Delete the wishlist item
     */
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        // Step 1: Verify the product exists in the user's wishlist
        if (!wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new RuntimeException("Product not found in wishlist");
        }

        // Step 2: Delete the wishlist item
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    // ==================== PRIVATE HELPERS ====================

    // Extracts the primary (main) image URL from a product's image list
    // Returns the first image marked as primary, or the first image if none is marked
    // Returns null if the product has no images
    private String getPrimaryImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }

        // First, look for the image marked as primary
        for (ProductImage image : product.getImages()) {
            if (Boolean.TRUE.equals(image.getIsPrimary())) {
                return image.getImageUrl();
            }
        }

        // Fallback: return the first image URL
        return product.getImages().get(0).getImageUrl();
    }

    // Converts a WishlistItem entity to a WishlistItemResponse DTO
    private WishlistItemResponse toResponse(WishlistItem item) {
        Product product = item.getProduct();

        return new WishlistItemResponse(
                product.getId(),
                product.getName(),
                getPrimaryImageUrl(product),
                product.getPrice(),
                product.getAverageRating() != null ? product.getAverageRating().doubleValue() : null
        );
    }
}
