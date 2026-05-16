package com.ecommerce.backend.config;

import com.ecommerce.backend.security.JwtAuthFilter;
import com.ecommerce.backend.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security Configuration — the central security setup for the entire application.
 *
 * Think of this file as the rulebook for your app's security:
 * - Which URLs are public and which require login
 * - How passwords are encrypted (BCrypt)
 * - How JWT tokens are validated on each request
 * - Whether sessions are used (we don't — JWT is stateless)
 * - Which origins (frontend URLs) are allowed to make requests (CORS)
 *
 * Key concepts:
 * - SecurityFilterChain: A chain of filters that every request passes through
 * - AuthenticationProvider: Tells Spring Security how to verify a user's credentials
 * - BCryptPasswordEncoder: Encrypts passwords so they're never stored as plain text
 * - SessionCreationPolicy.STATELESS: No server-side sessions; every request must prove identity via JWT
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // Service that loads user details from the database by email
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    // Filter that intercepts every request and validates JWT tokens
    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    /**
     * Password encoder that uses BCrypt hashing algorithm.
     *
     * BCrypt is a one-way encryption function designed specifically for passwords.
     * When a user registers, their plain-text password is hashed before saving to the database.
     * When they log in, their input password is hashed and compared to the stored hash.
     * Even if someone steals the database, they cannot reverse the hashes to get passwords.
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager is Spring Security's main entry point for authentication.
     * It coordinates the process of verifying a user's credentials (email + password).
     * We need this bean so our AuthController can call authenticationManager.authenticate() during login.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * AuthenticationProvider tells Spring Security HOW to authenticate a user.
     *
     * DaoAuthenticationProvider is the built-in provider that:
     * 1. Takes the user's email and password from the login request
     * 2. Uses userDetailsService to load the user from the database
     * 3. Uses passwordEncoder to compare the provided password with the stored hash
     * 4. Returns an authenticated user object if the passwords match
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);  // How to load user from database
        provider.setPasswordEncoder(passwordEncoder());      // How to verify the password
        return provider;
    }

    /**
     * SecurityFilterChain defines the security rules for every URL in the application.
     *
     * This is the most important method in this file. It answers:
     * - Which endpoints are public (no login required)?
     * - Which endpoints require authentication?
     * - How are JWT tokens validated on each request?
     * - Are sessions used? (No — we use stateless JWT)
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Disable CSRF protection — not needed for REST APIs with JWT tokens
                // CSRF attacks rely on browser cookies, but we send tokens in headers manually
                .csrf(csrf -> csrf.disable())

                // Configure CORS to allow requests from our React frontend
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Set session creation to STATELESS — no server-side session storage
                // JWT is stateless, meaning the server doesn't remember logged-in users
                // Every request must carry its own proof of identity (the JWT token)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Define which URLs are public and which require authentication
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints: anyone can access these without logging in
                        .requestMatchers(
                                "/api/auth/**",           // Register and login endpoints
                                "/api/products/**",       // Browse products publicly
                                "/api/categories",        // List all categories
                                "/api/products/*/reviews" // Read product reviews
                        ).permitAll()

                        // All other endpoints require the user to be authenticated
                        .anyRequest().authenticated()
                )

                // Register our custom authentication provider
                .authenticationProvider(authenticationProvider())

                // Insert our JWT filter BEFORE Spring's default username/password filter
                // This ensures JWT validation happens early in the request pipeline
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    /**
     * CORS (Cross-Origin Resource Sharing) configuration.
     *
     * Browsers block requests from one domain to another for security reasons.
     * Our React frontend runs on http://localhost:5173 and our backend on http://localhost:8080.
     * Since these are different origins, the browser will block requests unless we explicitly allow them.
     *
     * This configuration tells the backend: "It's okay to accept requests from the React dev server."
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow requests only from our React frontend's development server
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));

        // Allow these HTTP methods (read, create, update, delete, and preflight checks)
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow all headers (Authorization, Content-Type, etc.)
        configuration.setAllowedHeaders(List.of("*"));

        // Allow cookies and credentials to be sent with requests
        // This is needed so the browser sends the Authorization header with each request
        configuration.setAllowCredentials(true);

        // Apply this configuration to all URL paths in the application
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
