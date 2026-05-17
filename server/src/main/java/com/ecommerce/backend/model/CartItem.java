package com.ecommerce.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

// One row = one product in one user's cart. UNIQUE constraint prevents duplicates.
@Entity
@Table(name = "cart_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "product_id"})
})
public class CartItem {

    // Unique auto-generated primary key for each cart item record
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user whose shopping cart this item belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // The product that has been added to the cart
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Number of units of this product in the cart (must be > 0)
    @Column(nullable = false)
    private Integer quantity = 1;

    // Timestamp of when the product was added to the cart, never updated after insertion
    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private OffsetDateTime addedAt;

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

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public OffsetDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(OffsetDateTime addedAt) {
        this.addedAt = addedAt;
    }

    // ==================== Builder Pattern ====================

    public static CartItemBuilder builder() {
        return new CartItemBuilder();
    }

    public static class CartItemBuilder {
        private Long id;
        private User user;
        private Product product;
        private Integer quantity = 1;
        private OffsetDateTime addedAt;

        public CartItemBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public CartItemBuilder user(User user) {
            this.user = user;
            return this;
        }

        public CartItemBuilder product(Product product) {
            this.product = product;
            return this;
        }

        public CartItemBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public CartItemBuilder addedAt(OffsetDateTime addedAt) {
            this.addedAt = addedAt;
            return this;
        }

        public CartItem build() {
            CartItem cartItem = new CartItem();
            cartItem.setId(this.id);
            cartItem.setUser(this.user);
            cartItem.setProduct(this.product);
            cartItem.setQuantity(this.quantity);
            cartItem.setAddedAt(this.addedAt);
            return cartItem;
        }
    }
















}
