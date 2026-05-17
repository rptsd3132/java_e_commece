package com.ecommerce.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

// One row = one product saved in a user's wishlist.
// UNIQUE constraint on (user_id, product_id) prevents duplicate wishlist entries.
@Entity
@Table(name = "wishlist_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "product_id"})
})
public class WishlistItem {

    // Unique auto-generated primary key for each wishlist item record
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user whose wishlist this item belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // The product that has been saved to the wishlist
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Timestamp of when the product was added to the wishlist, never updated after insertion
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

    public OffsetDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(OffsetDateTime addedAt) {
        this.addedAt = addedAt;
    }

    // ==================== Builder Pattern ====================

    public static WishlistItemBuilder builder() {
        return new WishlistItemBuilder();
    }

    public static class WishlistItemBuilder {
        private Long id;
        private User user;
        private Product product;
        private OffsetDateTime addedAt;

        public WishlistItemBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WishlistItemBuilder user(User user) {
            this.user = user;
            return this;
        }

        public WishlistItemBuilder product(Product product) {
            this.product = product;
            return this;
        }

        public WishlistItemBuilder addedAt(OffsetDateTime addedAt) {
            this.addedAt = addedAt;
            return this;
        }

        public WishlistItem build() {
            WishlistItem item = new WishlistItem();
            item.setId(this.id);
            item.setUser(this.user);
            item.setProduct(this.product);
            item.setAddedAt(this.addedAt);
            return item;
        }
    }
















}
