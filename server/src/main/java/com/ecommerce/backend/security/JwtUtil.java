package com.ecommerce.backend.security;

import com.ecommerce.backend.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.stream.Collectors;

/**
 * JWT (JSON Web Token) is a compact, URL-safe way to represent claims between two parties.
 * In this app, after a user logs in, the server creates a JWT and sends it to the client.
 * The client stores the token and sends it back with every API request in the Authorization header.
 * The server then verifies the token to confirm the user's identity without hitting the database.
 *
 * Think of a JWT like a tamper-proof ID card:
 * - The "subject" is the user's email (who they claim to be)
 * - The "role" claim is their permission level (CUSTOMER, SELLER, or ADMIN)
 * - The "expiration" is when the card becomes invalid
 * - The "signature" proves the server issued it and nobody forged it
 */
@Component
public class JwtUtil {

    // The secret key string loaded from application.properties (must be at least 32 characters for HS256)
    @Value("${jwt.secret}")
    private String secret;

    // How long the token stays valid in milliseconds (86400000 = 24 hours)
    @Value("${jwt.expiration}")
    private Long expiration;

    // HMAC-SHA key used to sign and verify JWT tokens
    // Converts the secret string into a cryptographic key that HS256 algorithm requires
    private Key getSigningKey() {
        byte[] keyBytes = secret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Creates a new JWT token for a logged-in user
    // This token is returned to the client after successful login
    public String generateToken(UserDetails userDetails) {
        // Extract the user's role from their authorities (e.g. "ROLE_CUSTOMER" -> "CUSTOMER")
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return Jwts.builder()
                .setSubject(userDetails.getUsername())               // Store email as the token's subject
                .claim("role", role)                                 // Store the user's role as a custom claim
                .setIssuedAt(new Date())                             // Record when this token was created
                .setExpiration(new Date(System.currentTimeMillis() + expiration))  // Set when this token expires
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // Sign the token with our secret key
                .compact();                                          // Build and return the final JWT string
    }

    // Gets the user's email from inside the token
    // The email was stored as the "subject" when the token was created
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // Extracts the "role" claim from the token
    // This tells us whether the user is a CUSTOMER, SELLER, or ADMIN
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // Verifies the token belongs to this user and hasn't expired
    // Returns true only if the email matches AND the token is still within its validity period
    public boolean isTokenValid(String token, UserDetails userDetails) {
        String tokenEmail = extractEmail(token);                          // Get email stored inside the token
        boolean emailMatches = tokenEmail.equals(userDetails.getUsername()); // Check it matches the current user
        boolean notExpired = extractAllClaims(token)
                .getExpiration()
                .after(new Date());                                       // Check the token hasn't passed its expiry date
        return emailMatches && notExpired;                                // Both conditions must be true
    }

    // Parses the JWT token and returns all the claims (data) stored inside it
    // This is the core method that every extract method above depends on
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())   // Use our secret key to verify the token's signature
                .build()
                .parseClaimsJws(token)            // Parse and validate the token (throws if invalid)
                .getBody();                       // Return the claims (subject, role, dates, etc.)
    }
}
