package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.User;
import com.ecommerce.backend.model.enums.SellerStatus;
import com.ecommerce.backend.model.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Used during login to find the user by their email address
    Optional<User> findByEmail(String email);

    // Used during registration to check if this email is already taken
    boolean existsByEmail(String email);

    // Used by admin to list all users of a specific role
    List<User> findByRole(UserRole role);

    // Used by admin to find sellers waiting for approval (role=SELLER, status=PENDING)
    List<User> findByRoleAndSellerStatus(UserRole role, SellerStatus sellerStatus);

    // Used by admin to filter users by role and ban status with pagination
    Page<User> findByRoleAndIsBanned(UserRole role, boolean isBanned, Pageable pageable);

    // Used by admin search bar to find users by name or email within a specific role
    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<User> searchByRoleAndName(@Param("role") UserRole role,
                                   @Param("search") String search,
                                   Pageable pageable);
}
