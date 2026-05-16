package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.auth.AuthResponse;
import com.ecommerce.backend.dto.auth.LoginRequest;
import com.ecommerce.backend.dto.auth.RegisterRequest;
import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.entity.UserRole;
import com.ecommerce.backend.entity.SellerStatus;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    /**
     * Register a new user (Customer or Seller).
     */
    public AuthResponse register(RegisterRequest request) {
        // Step 1: Check if email already exists
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already registered: " + request.email());
        }

        // Step 2: Build User object
        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.valueOf(request.role()));
        user.setEnabled(true);
        user.setBanned(false);

        if (UserRole.SELLER.equals(user.getRole())) {
            user.setSellerStatus(SellerStatus.PENDING);
            user.setStoreName(request.storeName());
        }

        // Step 3: Save user to database
        User savedUser = userRepository.save(user);

        // Step 4: Generate JWT token for the newly registered user
        String token = jwtUtil.generateToken(savedUser);

        // Step 5: Build and return AuthResponse with token + user details
        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getRole().name(),
                savedUser.getStoreName()
        );
    }

    /**
     * Authenticate an existing user and return a JWT token.
     */
    public AuthResponse login(LoginRequest request) {
        // Step 1: Authenticate credentials using Spring Security's AuthenticationManager
        // This delegates to DaoAuthenticationProvider which checks email + password
        // Throws BadCredentialsException if the password is wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        // Step 2: Load the user from the database
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.email()));

        // Step 3: Check if user account is banned
        if (user.isBanned()) {
            throw new RuntimeException("Account is banned. Contact support.");
        }

        // Step 4: Generate JWT token for the authenticated user
        String token = jwtUtil.generateToken(user);

        // Step 5: Build and return AuthResponse with token + user details
        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name(),
                user.getStoreName()
        );
    }
}
