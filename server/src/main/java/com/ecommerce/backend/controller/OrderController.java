package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.order.OrderResponse;
import com.ecommerce.backend.dto.order.OrderStatusDto;
import com.ecommerce.backend.dto.order.PlaceOrderRequest;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<OrderResponse> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        OrderResponse order = orderService.placeOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<OrderResponse>> getCustomerOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        Page<OrderResponse> orders = orderService.getCustomerOrders(userId, page, size);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        OrderResponse order = orderService.getOrderById(userId, id);
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> cancelOrder(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        orderService.cancelOrder(userId, id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<OrderStatusDto>> getOrderTimeline(
            @PathVariable Long id
    ) {
        List<OrderStatusDto> timeline = orderService.getOrderTimeline(id);
        return ResponseEntity.ok(timeline);
    }

    private Long getCurrentUserId(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return user.getId();
    }
}
