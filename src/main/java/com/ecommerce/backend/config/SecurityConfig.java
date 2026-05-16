package com.ecommerce.backend.config;

import com.ecommerce.backend.security.JwtAuthFilter;
import com.ecommerce.backend.service.UserDetailsServiceImpl;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security Configuration
 *
 * WHAT IS THIS?
 * This is the central configuration file for Spring Security in your application.
 * Think of it as the rulebook for your building's security system. It defines:
 * - Who can enter which rooms (URL paths)
 * - How to verify someone's identity (authentication)
 * - How to encrypt passwords (BCrypt)
 * - How to handle cross-origin requests (CORS)
 *
 * KEY CONCEPTS:
 * - SecurityFilterChain: A chain of filters that every request passes through.
 *   Each filter checks something (authentication, authorization, CORS, etc.)
 * - Stateless: No server-side sessions. Every request must prove who it is
 *   using a JWT token. This is perfect for REST APIs and microservices.
 * - AuthenticationProvider: The component that actually checks if a username
 *   and password are correct during login.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    /**
     * Password Encoder
     *
     * WHY BCrypt?
     * BCrypt is a one-way hashing algorithm designed specifically for passwords.
     * It adds a random "salt" to each password, so even if two users have the
     * same password, their hashes will be different. This protects against
     * rainbow table attacks.
     *
     * IMPORTANT: Never store plain-text passwords. Always hash them with BCrypt.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Authentication Manager
     *
     * WHAT DOES THIS DO?
     * The AuthenticationManager is Spring Security's main interface for
     * authenticating users. When a user tries to log in, Spring calls
     * authenticate() on this manager, which delegates to the
     * AuthenticationProvider (defined below) to do the actual work.
     *
     * You need this bean if you want to programmatically authenticate users
     * (e.g., in your login endpoint).
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Authentication Provider
     *
     * HOW LOGIN WORKS:
     * When a user submits their email and password:
     * 1. DaoAuthenticationProvider loads the user from the database
     *    using UserDetailsServiceImpl (which you already have).
     * 2. It compares the submitted password with the stored hash using
     *    the BCryptPasswordEncoder.
     * 3. If they match, authentication succeeds. If not, it fails.
     *
     * "Dao" stands for Data Access Object - it means this provider uses
     * a database (via UserDetailsService) to look up users.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * Security Filter Chain
     *
     * THIS IS THE MOST IMPORTANT BEAN IN THIS FILE.
     * It defines the security rules for every URL in your application.
     *
     * Think of it like airport security:
     * - Some areas are public (no ticket needed) -> permitAll()
     * - Some areas require a boarding pass -> authenticated()
     * - The JWT filter checks your boarding pass before you enter
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Disable CSRF protection
                // Not needed for REST APIs with JWT
                // CSRF attacks rely on browser cookies, but we don't use cookies
                // for authentication. We use JWT tokens in the Authorization header,
                // which browsers don't send automatically.
                .csrf(csrf -> csrf.disable())

                // Configure CORS (Cross-Origin Resource Sharing)
                // This allows your React frontend (running on localhost:5173)
                // to make requests to your Spring Boot backend (running on
                // a different port, e.g., localhost:8080).
                // Without CORS, the browser would block these requests.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Disable session creation
                // JWT is stateless, no sessions
                // Traditional web apps store user info in server-side sessions.
                // With JWT, the token itself contains all the user info, so
                // the server doesn't need to remember anything between requests.
                // This makes your API scalable and easy to deploy across multiple servers.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Define which URLs are public and which require authentication
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - anyone can access these
                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/auth/**"
                        ).permitAll()
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/products/**"
                        ).permitAll()
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/categories"
                        ).permitAll()
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/products/*/reviews"
                        ).permitAll()

                        // All other endpoints require authentication
                        // If a request doesn't match any of the public paths above,
                        // the user must be logged in (have a valid JWT).
                        .anyRequest().authenticated()
                )

                // Add our JWT filter to the security chain
                // This filter runs BEFORE the default username/password filter
                // because we're using JWT tokens, not form-based login.
                // The JWT filter extracts and validates the token from the
                // Authorization header before Spring Security processes the request.
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    /**
     * CORS Configuration
     *
     * WHAT IS CORS?
     * CORS (Cross-Origin Resource Sharing) is a browser security feature.
     * By default, browsers block web pages from making requests to a different
     * domain/port than the one that served the page.
     *
     * Your React app runs on http://localhost:5173
     * Your Spring Boot API runs on http://localhost:8080
     * These are DIFFERENT origins, so the browser needs permission to connect them.
     *
     * This configuration tells the browser: "Yes, it's okay for localhost:5173
     * to make requests to this API."
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow requests from your React development server
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));

        // Allow these HTTP methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow all headers (Authorization, Content-Type, etc.)
        configuration.setAllowedHeaders(List.of("*"));

        // Allow cookies and credentials to be sent with requests
        // This is needed if you ever use cookies alongside JWT
        configuration.setAllowCredentials(true);

        // Apply this configuration to all URL paths
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
