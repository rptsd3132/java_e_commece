package com.ecommerce.backend.security;

import com.ecommerce.backend.service.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter
 *
 * HOW IT WORKS:
 * This filter runs ONCE for every HTTP request that hits your API.
 * Think of it as a security checkpoint at the entrance of a building.
 * Every person (request) must show their ID badge (JWT token) to get in.
 *
 * Spring Security has a chain of filters. This filter intercepts the request
 * before it reaches your controller, extracts the JWT, validates it, and tells
 * Spring Security "this user is authenticated" if the token is valid.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    /**
     * This method is called for EVERY incoming HTTP request.
     * It is the heart of JWT authentication in Spring Security.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Step 1: Get Authorization header from request
        // Every request has headers. We look for one called Authorization
        // This header is where the client sends the JWT token.
        // Format: "Authorization: Bearer <token>"
        String authHeader = request.getHeader("Authorization");

        // Step 2: Check if header exists AND starts with "Bearer "
        // If no token header, skip - this might be a public endpoint
        // Public endpoints (like /api/auth/login) don't need a token,
        // so we let them pass through to the next filter.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Step 3: Extract token = header.substring(7) -- removes "Bearer " prefix
        // The header looks like: "Bearer eyJhbGciOiJIUzI1NiIsIn..."
        // We only want the actual JWT part after "Bearer " (7 characters).
        String token = authHeader.substring(7);

        // Step 4: Extract email = jwtUtil.extractEmail(token)
        // The JWT contains the user's email encoded inside it.
        // We decode it to find out WHO is making this request.
        String email = jwtUtil.extractEmail(token);

        // Step 5: If email is not null AND SecurityContextHolder has no authentication yet:
        // This means: we found a valid email in the token, and Spring Security
        // hasn't already authenticated this request. Now we verify the token
        // is genuinely valid (not expired, not tampered with) and load the user.
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Load the user from the database using the email from the token
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            // Double-check: is this token actually valid?
            // This verifies the signature, checks expiration, etc.
            if (jwtUtil.isTokenValid(token, userDetails)) {
                // Create an authentication token that Spring Security understands.
                // This object holds the user's identity and their roles/authorities.
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null, // credentials are null because we trust the JWT
                                userDetails.getAuthorities()
                        );

                // Attach additional details about this request (IP address, session ID, etc.)
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Tell Spring Security: this request is authenticated
                // From this point on, Spring Security knows who the user is
                // and what roles they have. Your @PreAuthorize annotations
                // and security checks will use this information.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Step 6: filterChain.doFilter(request, response) -- always continue the chain
        // This passes the request to the NEXT filter in the chain.
        // If authentication succeeded, the next filters will see the authenticated user.
        // If authentication failed or was skipped, the request still continues
        // (your controller or another filter will handle the authorization check).
        filterChain.doFilter(request, response);
    }
}
