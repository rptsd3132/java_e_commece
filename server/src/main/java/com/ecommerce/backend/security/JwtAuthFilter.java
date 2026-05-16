package com.ecommerce.backend.security;

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
 * This filter runs ONCE per HTTP request, before the request reaches any controller.
 *
 * How JWT authentication works step by step:
 * 1. User logs in → server creates a JWT token → sends it back to client
 * 2. Client stores the token (usually in localStorage)
 * 3. On every subsequent request, client sends: Authorization: Bearer <token>
 * 4. This filter intercepts the request, extracts the token, and validates it
 * 5. If valid, it tells Spring Security "this user is authenticated"
 * 6. The controller then processes the request with full knowledge of who the user is
 *
 * Think of this filter like a bouncer at a club:
 * - It checks everyone's ID (JWT token) before they enter
 * - If the ID is valid, it tells the staff inside who the person is
 * - If no ID is presented, the person can still enter public areas (public endpoints)
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    // Utility class that knows how to create, read, and validate JWT tokens
    @Autowired
    private JwtUtil jwtUtil;

    // Service that loads full user details from the database by email
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    /**
     * This method runs for every single incoming HTTP request.
     * It decides whether to authenticate the user or let the request pass through.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // ==================== STEP 1 ====================
        // Every request has headers. We look for one called "Authorization"
        // This is the standard header name for sending authentication tokens
        String authHeader = request.getHeader("Authorization");

        // ==================== STEP 2 ====================
        // If no token header exists, skip authentication for this request
        // This might be a public endpoint like /api/products that anyone can access
        // Or the user simply hasn't logged in yet
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // ==================== STEP 3 ====================
        // Extract the actual token by removing the "Bearer " prefix (7 characters)
        // The header looks like: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        // We only want the part after "Bearer "
        String token = authHeader.substring(7);

        // ==================== STEP 4 ====================
        // Extract the user's email from inside the JWT token
        // When the token was created, the email was stored as the "subject"
        // If the token is tampered with or expired, this will throw an exception
        String email = jwtUtil.extractEmail(token);

        // ==================== STEP 5 ====================
        // If we successfully extracted an email AND Spring Security doesn't already
        // know about this user (no existing authentication in the context),
        // then we need to validate the token and set up authentication
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Load the full user object from the database using the email from the token
            // This gives us the user's password, role, ban status, etc.
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            // Verify the token is valid: email matches AND token hasn't expired
            // If this returns false, the token is forged or expired
            if (jwtUtil.isTokenValid(token, userDetails)) {

                // Create an authentication object that Spring Security understands
                // This object contains the user's identity and their roles/permissions
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,           // The authenticated principal (user)
                                null,                  // Credentials not needed (token already proves identity)
                                userDetails.getAuthorities()  // List of roles like ROLE_CUSTOMER, ROLE_ADMIN
                        );

                // Attach additional details about this request (IP address, session ID, etc.)
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Tell Spring Security: this request is authenticated
                // From this point on, any @PreAuthorize or security checks in controllers
                // will know exactly who this user is and what roles they have
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // ==================== STEP 6 ====================
        // Always continue the filter chain, whether authentication succeeded or not
        // If the token was valid, the next filters/controllers see an authenticated user
        // If there was no token, the request still reaches the controller (which may reject it)
        filterChain.doFilter(request, response);
    }
}
