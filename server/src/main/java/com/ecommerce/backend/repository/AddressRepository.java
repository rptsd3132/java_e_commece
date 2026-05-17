package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// Repository for managing user shipping addresses
@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    // Load all addresses belonging to a specific user
    List<Address> findByUserId(Long userId);

    // Find the user's default address (if one is set)
    Optional<Address> findByUserIdAndIsDefaultTrue(Long userId);
}
