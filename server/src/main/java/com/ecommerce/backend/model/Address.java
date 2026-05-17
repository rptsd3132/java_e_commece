package com.ecommerce.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

// Represents a shipping address belonging to a user.
// A user can have multiple addresses, one of which is marked as the default.
@Entity
@Table(name = "addresses")
public class Address {

    // Unique auto-generated primary key for each address record
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who owns this address
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Label for the address (e.g. "Home", "Office", "Parents")
    @Column(length = 50)
    private String label = "Home";

    // Street address line
    @Column(length = 300)
    private String street;

    // City or town
    @Column(length = 100)
    private String city;

    // State or province
    @Column(length = 100)
    private String state;

    // Postal or ZIP code
    @Column(name = "zip_code", length = 20)
    private String zipCode;

    // Country — defaults to "Sri Lanka"
    @Column(length = 100)
    private String country = "Sri Lanka";

    // Whether this address is the user's default shipping address
    @Column(name = "is_default")
    private Boolean isDefault = false;

    // Timestamp of when the address was first created, never updated after insertion
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    // ==================== Getters and Setters ====================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getZipCode() {
        return zipCode;
    }

    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // ==================== Builder Pattern ====================

    public static AddressBuilder builder() {
        return new AddressBuilder();
    }

    public static class AddressBuilder {
        private Long id;
        private User user;
        private String label = "Home";
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String country = "Sri Lanka";
        private Boolean isDefault = false;
        private OffsetDateTime createdAt;

        public AddressBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public AddressBuilder user(User user) {
            this.user = user;
            return this;
        }

        public AddressBuilder label(String label) {
            this.label = label;
            return this;
        }

        public AddressBuilder street(String street) {
            this.street = street;
            return this;
        }

        public AddressBuilder city(String city) {
            this.city = city;
            return this;
        }

        public AddressBuilder state(String state) {
            this.state = state;
            return this;
        }

        public AddressBuilder zipCode(String zipCode) {
            this.zipCode = zipCode;
            return this;
        }

        public AddressBuilder country(String country) {
            this.country = country;
            return this;
        }

        public AddressBuilder isDefault(Boolean isDefault) {
            this.isDefault = isDefault;
            return this;
        }

        public AddressBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Address build() {
            Address address = new Address();
            address.setId(this.id);
            address.setUser(this.user);
            address.setLabel(this.label);
            address.setStreet(this.street);
            address.setCity(this.city);
            address.setState(this.state);
            address.setZipCode(this.zipCode);
            address.setCountry(this.country);
            address.setIsDefault(this.isDefault);
            address.setCreatedAt(this.createdAt);
            return address;
        }
    }




























}
