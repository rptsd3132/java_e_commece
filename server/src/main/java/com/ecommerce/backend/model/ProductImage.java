package com.ecommerce.backend.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "product_images")
@NoArgsConstructor
public class ProductImage {

    // Unique auto-generated primary key for each image record
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The product this image belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Full URL of the image stored in the cloud (e.g. Cloudinary, S3)
    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    // Unique identifier returned by the cloud storage service for deletion or management
    @Column(name = "public_id", length = 300)
    private String publicId;

    // Whether this image should be displayed as the main/primary photo on the product card
    @Column(name = "is_primary")
    private Boolean isPrimary;

    // Numeric order used to sort multiple images in a gallery view
    @Column(name = "sort_order")
    private Integer sortOrder;

    // Timestamp of when the image record was first created, never updated after insertion
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    // Constructor with all fields
    public ProductImage(Long id, Product product, String imageUrl, String publicId, 
                       Boolean isPrimary, Integer sortOrder, OffsetDateTime createdAt) {
        this.id = id;
        this.product = product;
        this.imageUrl = imageUrl;
        this.publicId = publicId;
        this.isPrimary = isPrimary;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
    }

    // Getters
    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public String getImageUrl() { return imageUrl; }
    public String getPublicId() { return publicId; }
    public Boolean getIsPrimary() { return isPrimary; }
    public Integer getSortOrder() { return sortOrder; }
    public OffsetDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setProduct(Product product) { this.product = product; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setPublicId(String publicId) { this.publicId = publicId; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    // Builder pattern
    public static ProductImageBuilder builder() {
        return new ProductImageBuilder();
    }

    public static class ProductImageBuilder {
        private Long id;
        private Product product;
        private String imageUrl;
        private String publicId;
        private Boolean isPrimary;
        private Integer sortOrder;
        private OffsetDateTime createdAt;

        public ProductImageBuilder id(Long id) { this.id = id; return this; }
        public ProductImageBuilder product(Product product) { this.product = product; return this; }
        public ProductImageBuilder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public ProductImageBuilder publicId(String publicId) { this.publicId = publicId; return this; }
        public ProductImageBuilder isPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; return this; }
        public ProductImageBuilder sortOrder(Integer sortOrder) { this.sortOrder = sortOrder; return this; }
        public ProductImageBuilder createdAt(OffsetDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ProductImage build() {
            return new ProductImage(id, product, imageUrl, publicId, isPrimary, sortOrder, createdAt);
        }
    }
}
