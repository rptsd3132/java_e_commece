package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.product.ProductCreateRequest;
import com.ecommerce.backend.dto.product.ProductResponse;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private UserRepository userRepository;

    // Public endpoint - no login required. Supports search and filters.
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Page<ProductResponse> products = productService.getProducts(search, categoryId, minPrice, maxPrice, page, size);
        return ResponseEntity.ok(products);
    }

    // Public endpoint - returns one product's full details
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    // Only approved sellers can create products
    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductCreateRequest request,
            Authentication auth
    ) {
        Long sellerId = getCurrentUserId(auth);
        ProductResponse product = productService.createProduct(request, sellerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    // Only the product's seller or an admin can update it
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductCreateRequest request,
            Authentication auth
    ) {
        Long sellerId = getCurrentUserId(auth);
        ProductResponse product = productService.updateProduct(id, request, sellerId);
        return ResponseEntity.ok(product);
    }

    // Seller can delete own products, admin can delete any product
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id,
            Authentication auth
    ) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        productService.deleteProduct(id, user.getId(), user.getRole().name());
        return ResponseEntity.noContent().build();
    }

    // Seller views all their own products (any status)
    @GetMapping("/seller/products")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Page<ProductResponse>> getSellerProducts(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Long sellerId = getCurrentUserId(auth);
        Page<ProductResponse> products = productService.getSellerProducts(sellerId, page, size);
        return ResponseEntity.ok(products);
    }

    // Helper: extracts the current user's ID from the authenticated principal's email
    private Long getCurrentUserId(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return user.getId();
    }
}
