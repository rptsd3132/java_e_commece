package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.wishlist.WishlistItemResponse;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.WishlistService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Wishlist controller — all endpoints require authentication.
// Extracts userId from the authenticated user's email on every request.
@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "http://localhost:5173")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/wishlist — returns the authenticated user's complete wishlist.
     */
    @GetMapping
    public ResponseEntity<List<WishlistItemResponse>> getWishlist(Authentication auth) {
        Long userId = getCurrentUserId(auth);
        List<WishlistItemResponse> wishlist = wishlistService.getWishlist(userId);
        return ResponseEntity.ok(wishlist);
    }

    /**
     * POST /api/wishlist — adds a product to the user's wishlist.
     * Idempotent: if the product is already in the wishlist, returns existing item (no error).
     */
    @PostMapping
    public ResponseEntity<WishlistItemResponse> addToWishlist(
            @Valid @RequestBody AddToWishlistRequest request,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        WishlistItemResponse item = wishlistService.addToWishlist(userId, request.productId());
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    /**
     * DELETE /api/wishlist/{productId} — removes a product from the user's wishlist.
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable Long productId,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.noContent().build();
    }

    // Helper: extracts the current user's ID from the authenticated principal's email
    private Long getCurrentUserId(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return user.getId();
    }

    // ==================== REQUEST DTOs ====================

    // Request body for POST /api/wishlist
    record AddToWishlistRequest(
            @NotNull Long productId
    ) {}
}
