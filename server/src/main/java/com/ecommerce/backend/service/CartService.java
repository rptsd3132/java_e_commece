package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.cart.CartItemResponse;
import com.ecommerce.backend.dto.cart.CartResponse;
import com.ecommerce.backend.model.CartItem;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.ProductImage;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.model.enums.ProductStatus;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

// Service layer for managing shopping cart operations
// Handles add-to-cart, quantity updates, removal, and cart retrieval
@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Retrieves the complete shopping cart for a user.
     *
     * Step 1: Load all CartItems for this user from the database
     * Step 2: For each CartItem: build a CartItemResponse DTO
     *           - lineTotal = product.price × quantity
     * Step 3: subtotal = sum of all lineTotals
     * Step 4: Return CartResponse with items list, subtotal, and total item count
     */
    public CartResponse getCart(Long userId) {
        // Step 1: Load all CartItems for this user
        List<CartItem> cartItems = cartRepository.findByUserId(userId);

        // Step 2: For each CartItem, build a CartItemResponse DTO
        List<CartItemResponse> itemResponses = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            BigDecimal unitPrice = product.getPrice();
            Integer quantity = cartItem.getQuantity();
            // lineTotal = product.price × quantity
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

            // Extract the primary image URL from the product's image list
            String productImageUrl = getPrimaryImageUrl(product);

            CartItemResponse response = new CartItemResponse(
                    cartItem.getId(),
                    product.getId(),
                    product.getName(),
                    productImageUrl,
                    unitPrice,
                    quantity,
                    lineTotal
            );
            itemResponses.add(response);
        }

        // Step 3: subtotal = sum of all lineTotals
        BigDecimal subtotal = itemResponses.stream()
                .map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total number of individual items (sum of quantities, not number of rows)
        Integer totalItems = itemResponses.stream()
                .mapToInt(CartItemResponse::quantity)
                .sum();

        // Step 4: Return CartResponse
        return new CartResponse(itemResponses, subtotal, totalItems);
    }

    /**
     * Adds a product to the user's cart or increases quantity if already present.
     *
     * Step 1: Load product, check it exists and status=ACTIVE
     * Step 2: Check stock: if product.stockQuantity < quantity → throw "Not enough stock"
     * Step 3: Check if item already in cart (findByUserIdAndProductId)
     *           - If YES: update quantity = existing.quantity + requested.quantity
     *                     Check: updated quantity <= stock
     *           - If NO: create new CartItem
     * Step 4: Save and return CartItemResponse
     *
     * The UNIQUE constraint in DB prevents duplicate cart rows.
     */
    @Transactional
    public CartItemResponse addToCart(Long userId, Long productId, Integer quantity) {
        // Step 1: Load product, check it exists and status=ACTIVE
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new RuntimeException("Product is not available for purchase");
        }

        // Step 2: Check stock: if product.stockQuantity < quantity → throw "Not enough stock"
        if (product.getStockQuantity() < quantity) {
            throw new RuntimeException("Not enough stock. Available: " + product.getStockQuantity());
        }

        // Step 3: Check if item already in cart (findByUserIdAndProductId)
        CartItem existingItem = cartRepository.findByUserIdAndProductId(userId, productId).orElse(null);

        if (existingItem != null) {
            // Item already in cart — increase the quantity
            int updatedQuantity = existingItem.getQuantity() + quantity;

            // Check: updated quantity <= stock
            if (product.getStockQuantity() < updatedQuantity) {
                throw new RuntimeException("Not enough stock. Available: " + product.getStockQuantity()
                        + ", already in cart: " + existingItem.getQuantity());
            }

            existingItem.setQuantity(updatedQuantity);
            cartRepository.save(existingItem);
            return toCartItemResponse(existingItem);
        } else {
            // Item not in cart — create new CartItem
            // The UNIQUE constraint in DB prevents duplicate cart rows

            // Load the user entity to set the relationship
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            CartItem newItem = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(quantity)
                    .build();

            cartRepository.save(newItem);
            return toCartItemResponse(newItem);
        }
    }

    /**
     * Updates the quantity of an existing cart item.
     *
     * Step 1: Load cartItem, verify it belongs to this user
     * Step 2: Check newQuantity <= product.stockQuantity
     * Step 3: Update and save
     */
    @Transactional
    public CartItemResponse updateQuantity(Long userId, Long cartItemId, Integer newQuantity) {
        // Step 1: Load cartItem, verify it belongs to this user
        CartItem cartItem = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartItemId));

        if (!cartItem.getUser().getId().equals(userId)) {
            throw new RuntimeException("Cart item does not belong to this user");
        }

        if (newQuantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        // Step 2: Check newQuantity <= product.stockQuantity
        Product product = cartItem.getProduct();
        if (product.getStockQuantity() < newQuantity) {
            throw new RuntimeException("Not enough stock. Available: " + product.getStockQuantity());
        }

        // Step 3: Update and save
        cartItem.setQuantity(newQuantity);
        cartRepository.save(cartItem);

        return toCartItemResponse(cartItem);
    }

    /**
     * Removes a specific item from the user's cart.
     * Verifies ownership before deletion.
     */
    @Transactional
    public void removeFromCart(Long userId, Long cartItemId) {
        // Load cart item and verify it belongs to this user
        CartItem cartItem = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartItemId));

        if (!cartItem.getUser().getId().equals(userId)) {
            throw new RuntimeException("Cart item does not belong to this user");
        }

        // Delete the cart item
        cartRepository.delete(cartItem);
    }

    /**
     * Clears all items from the user's cart.
     * Typically called after an order is successfully placed.
     */
    @Transactional
    public void clearCart(Long userId) {
        // Delete all cart items for this user
        cartRepository.deleteByUserId(userId);
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

    // Converts a CartItem entity to a CartItemResponse DTO
    // lineTotal = product.price × quantity
    private CartItemResponse toCartItemResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();
        BigDecimal unitPrice = product.getPrice();
        Integer quantity = cartItem.getQuantity();
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

        return new CartItemResponse(
                cartItem.getId(),
                product.getId(),
                product.getName(),
                getPrimaryImageUrl(product),
                unitPrice,
                quantity,
                lineTotal
        );
    }
}
