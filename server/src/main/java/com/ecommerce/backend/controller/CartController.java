package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.cart.CartItemResponse;
import com.ecommerce.backend.dto.cart.CartResponse;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.CartService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

// Cart controller — all endpoints require authentication.
// Extracts userId from the authenticated user's email on every request.
@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/cart — returns the authenticated user's complete shopping cart.
     */
    @GetMapping
    public ResponseEntity<CartResponse> getCart(Authentication auth) {
        Long userId = getCurrentUserId(auth);
        CartResponse cart = cartService.getCart(userId);
        return ResponseEntity.ok(cart);
    }

    /**
     * POST /api/cart — adds a product to the user's cart.
     * If the product is already in the cart, quantity is increased.
     */
    @PostMapping
    public ResponseEntity<CartItemResponse> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        CartItemResponse item = cartService.addToCart(userId, request.productId(), request.quantity());
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    /**
     * PUT /api/cart/{cartItemId} — updates the quantity of an existing cart item.
     */
    @PutMapping("/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateQuantity(
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateQuantityRequest request,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        CartItemResponse item = cartService.updateQuantity(userId, cartItemId, request.quantity());
        return ResponseEntity.ok(item);
    }

    /**
     * DELETE /api/cart/{cartItemId} — removes a single item from the user's cart.
     */
    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> removeFromCart(
            @PathVariable Long cartItemId,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        cartService.removeFromCart(userId, cartItemId);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/cart/clear — removes all items from the user's cart.
     * Typically called after an order is successfully placed.
     */
    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(Authentication auth) {
        Long userId = getCurrentUserId(auth);
        cartService.clearCart(userId);
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

    // Request body for POST /api/cart
    record AddToCartRequest(
            @NotNull Long productId,
            @NotNull @Min(1) Integer quantity
    ) {}

    // Request body for PUT /api/cart/{cartItemId}
    record UpdateQuantityRequest(
            @NotNull @Min(1) Integer quantity
    ) {}
}
