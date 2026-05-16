package com.ecommerce.backend.model;

import com.ecommerce.backend.model.enums.SellerStatus;
import com.ecommerce.backend.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    // Unique auto-generated primary key for each user record
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User's email address, used as the unique login identifier
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // BCrypt-hashed password, never stored in plain text
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    // User's first name for display and personalization
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    // User's last name for display and personalization
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    // Optional phone number for contact or delivery notifications
    @Column(length = 20)
    private String phone;

    // The user's role that determines access level: CUSTOMER, SELLER, or ADMIN
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    // Seller application status: PENDING, APPROVED, or REJECTED (only relevant for SELLER role)
    @Enumerated(EnumType.STRING)
    @Column(name = "seller_status", length = 20)
    private SellerStatus sellerStatus;

    // Public-facing store name displayed on the marketplace (only for sellers)
    @Column(name = "store_name", length = 200)
    private String storeName;

    // Description of the seller's store shown on their storefront page
    @Column(name = "store_desc", columnDefinition = "TEXT")
    private String storeDesc;

    // Whether the user has been banned by an admin, blocking all access
    @Column(name = "is_banned", nullable = false)
    private Boolean isBanned = false;

    // Whether the user account is active and allowed to log in
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;

    // Timestamp of when the user account was first created, never updated after insertion
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    // Timestamp of the last update to the user record, automatically refreshed on each save
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // ==================== UserDetails Implementation ====================

    // Returns the email as the username for Spring Security authentication
    @Override
    public String getUsername() {
        return email;
    }

    // Returns the hashed password for Spring Security password verification
    @Override
    public String getPassword() {
        return passwordHash;
    }

    // Returns the user's role as a Spring Security authority prefixed with "ROLE_"
    @Override
    public List<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    // Account is considered locked if the user has been banned by an admin
    @Override
    public boolean isAccountNonLocked() {
        return !isBanned;
    }

    // Returns whether the account is enabled and allowed to authenticate
    @Override
    public boolean isEnabled() {
        return isEnabled;
    }

    // Accounts never expire in this system
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // Credentials (passwords) never expire in this system
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
