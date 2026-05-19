package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.order.OrderResponse;
import com.ecommerce.backend.dto.order.OrderStatusUpdateRequest;
import com.ecommerce.backend.dto.order.SellerDashboardDto;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class SellerOrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerDashboardDto> getSellerDashboard(Authentication auth) {
        Long sellerId = getCurrentUserId(auth);
        return ResponseEntity.ok(orderService.getSellerDashboard(sellerId));
    }

    @GetMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Page<OrderResponse>> getSellerOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth
    ) {
        Long sellerId = getCurrentUserId(auth);
        Page<OrderResponse> orders = orderService.getSellerOrders(sellerId, page, size);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long orderId,
            Authentication auth
    ) {
        Long sellerId = getCurrentUserId(auth);
        OrderResponse order = orderService.getOrderByIdForSeller(orderId, sellerId);
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            Authentication auth
    ) {
        Long sellerId = getCurrentUserId(auth);
        OrderResponse updated = orderService.updateOrderStatus(orderId, sellerId, request.status());
        return ResponseEntity.ok(updated);
    }

    private Long getCurrentUserId(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return user.getId();
    }
}
