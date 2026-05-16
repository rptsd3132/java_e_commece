package com.ecommerce.backend.security;

import com.ecommerce.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * UserDetailsService is a Spring Security interface that loads user-specific data.
 *
 * How it works in the JWT flow:
 * 1. A client sends a request with a JWT token in the Authorization header.
 * 2. A JWT filter extracts the email from the token.
 * 3. Spring Security calls loadUserByUsername(email) to get the full user object.
 * 4. Spring Security then uses that object to check permissions and roles.
 *
 * This service bridges the gap between the JWT token (which only contains the email)
 * and the full User entity stored in the database (which has roles, ban status, etc.).
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    // Repository used to look up users in the database by email
    @Autowired
    private UserRepository userRepository;

    // Spring Security calls this automatically when validating a JWT token
    // The "username" parameter is actually the user's email address in our system
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Look for a user with the given email in the database
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
}
