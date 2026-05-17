package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.address.AddressDto;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Address controller — all endpoints require authentication.
// Extracts userId from the authenticated user's email on every request.
@RestController
@RequestMapping("/api/addresses")
@CrossOrigin(origins = "http://localhost:5173")
public class AddressController {

    @Autowired
    private AddressService addressService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/addresses — returns all shipping addresses for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<AddressDto>> getUserAddresses(Authentication auth) {
        Long userId = getCurrentUserId(auth);
        List<AddressDto> addresses = addressService.getUserAddresses(userId);
        return ResponseEntity.ok(addresses);
    }

    /**
     * POST /api/addresses — creates a new shipping address for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<AddressDto> addAddress(
            @Valid @RequestBody AddressDto dto,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        AddressDto created = addressService.addAddress(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/addresses/{id} — updates an existing shipping address.
     * Verifies the address belongs to the authenticated user.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AddressDto> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressDto dto,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        AddressDto updated = addressService.updateAddress(userId, id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/addresses/{id} — deletes a shipping address.
     * If it was the default, the first remaining address becomes the new default.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        addressService.deleteAddress(userId, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/addresses/{id}/default — sets a specific address as the user's default.
     * All other addresses for this user are set to isDefault=false.
     */
    @PutMapping("/{id}/default")
    public ResponseEntity<AddressDto> setDefaultAddress(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getCurrentUserId(auth);
        AddressDto defaultAddress = addressService.setDefaultAddress(userId, id);
        return ResponseEntity.ok(defaultAddress);
    }

    // Helper: extracts the current user's ID from the authenticated principal's email
    private Long getCurrentUserId(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return user.getId();
    }
}
