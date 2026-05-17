package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.address.AddressDto;
import com.ecommerce.backend.model.Address;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.AddressRepository;
import com.ecommerce.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// Service layer for managing user shipping addresses
// Handles CRUD operations and default address management
@Service
public class AddressService {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Retrieves all shipping addresses for a user.
     *
     * Step 1: Load all Address records for this user from the database
     * Step 2: Convert each Address entity to an AddressDto
     * Step 3: Return the list of DTOs
     */
    public List<AddressDto> getUserAddresses(Long userId) {
        // Step 1: Load all Address records for this user
        List<Address> addresses = addressRepository.findByUserId(userId);

        // Step 2: Convert each Address entity to an AddressDto
        List<AddressDto> dtos = new ArrayList<>();
        for (Address address : addresses) {
            dtos.add(toDto(address));
        }

        // Step 3: Return the list
        return dtos;
    }

    /**
     * Adds a new shipping address for a user.
     *
     * Step 1: Load the user from the database
     * Step 2: If user has NO addresses yet: set isDefault=true automatically
     * Step 3: If dto.isDefault=true: first set ALL user's addresses isDefault=false,
     *           then set this new address to true
     * Step 4: Save and return AddressDto
     */
    @Transactional
    public AddressDto addAddress(Long userId, AddressDto dto) {
        // Step 1: Load the user from the database
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Step 2: If user has NO addresses yet: set isDefault=true automatically
        List<Address> existingAddresses = addressRepository.findByUserId(userId);
        boolean shouldBeDefault = existingAddresses.isEmpty() || Boolean.TRUE.equals(dto.isDefault());

        // Step 3: If dto.isDefault=true: first set ALL user's addresses isDefault=false
        if (Boolean.TRUE.equals(dto.isDefault()) && !existingAddresses.isEmpty()) {
            for (Address addr : existingAddresses) {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            }
        }

        // Build and save the new Address entity
        Address address = Address.builder()
                .user(user)
                .label(dto.label() != null ? dto.label() : "Home")
                .street(dto.street())
                .city(dto.city())
                .state(dto.state())
                .zipCode(dto.zipCode())
                .country(dto.country() != null ? dto.country() : "Sri Lanka")
                .isDefault(shouldBeDefault)
                .build();

        addressRepository.save(address);

        // Step 4: Return AddressDto
        return toDto(address);
    }

    /**
     * Updates an existing shipping address.
     *
     * Step 1: Load address and verify it belongs to this user
     * Step 2: Update fields from the DTO
     * Step 3: Handle isDefault logic — if setting this as default,
     *           first set ALL other addresses isDefault=false
     * Step 4: Save and return AddressDto
     */
    @Transactional
    public AddressDto updateAddress(Long userId, Long addressId, AddressDto dto) {
        // Step 1: Load address and verify it belongs to this user
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Address does not belong to this user");
        }

        // Step 2: Update fields from the DTO
        address.setLabel(dto.label() != null ? dto.label() : address.getLabel());
        address.setStreet(dto.street());
        address.setCity(dto.city());
        address.setState(dto.state());
        address.setZipCode(dto.zipCode());
        address.setCountry(dto.country() != null ? dto.country() : address.getCountry());

        // Step 3: Handle isDefault logic
        if (Boolean.TRUE.equals(dto.isDefault())) {
            // Set ALL other addresses for this user to isDefault=false
            List<Address> allAddresses = addressRepository.findByUserId(userId);
            for (Address addr : allAddresses) {
                if (!addr.getId().equals(addressId)) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            }
            address.setIsDefault(true);
        }

        // Step 4: Save and return AddressDto
        addressRepository.save(address);
        return toDto(address);
    }

    /**
     * Deletes a shipping address.
     *
     * Step 1: Load address and verify it belongs to this user
     * Step 2: If it was the default: set first remaining address as new default
     * Step 3: Delete the address
     */
    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        // Step 1: Load address and verify it belongs to this user
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Address does not belong to this user");
        }

        // Step 2: If it was the default: set first remaining address as new default
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            List<Address> remainingAddresses = addressRepository.findByUserId(userId);
            for (Address addr : remainingAddresses) {
                if (!addr.getId().equals(addressId)) {
                    // Set the first remaining address as the new default
                    addr.setIsDefault(true);
                    addressRepository.save(addr);
                    break;
                }
            }
        }

        // Step 3: Delete the address
        addressRepository.delete(address);
    }

    /**
     * Sets a specific address as the user's default.
     *
     * Step 1: Load address and verify it belongs to this user
     * Step 2: Set all user's addresses isDefault=false
     * Step 3: Set this address isDefault=true and save
     */
    @Transactional
    public AddressDto setDefaultAddress(Long userId, Long addressId) {
        // Step 1: Load address and verify it belongs to this user
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Address does not belong to this user");
        }

        // Step 2: Set all user's addresses isDefault=false
        List<Address> allAddresses = addressRepository.findByUserId(userId);
        for (Address addr : allAddresses) {
            addr.setIsDefault(false);
            addressRepository.save(addr);
        }

        // Step 3: Set this address isDefault=true and save
        address.setIsDefault(true);
        addressRepository.save(address);

        return toDto(address);
    }

    // ==================== PRIVATE HELPERS ====================

    // Converts an Address entity to an AddressDto
    private AddressDto toDto(Address address) {
        return new AddressDto(
                address.getId(),
                address.getLabel(),
                address.getStreet(),
                address.getCity(),
                address.getState(),
                address.getZipCode(),
                address.getCountry(),
                address.getIsDefault()
        );
    }
}
