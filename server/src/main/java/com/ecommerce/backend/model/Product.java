package com.ecommerce.backend.model;

import com.ecommerce.backend.model.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "products")
@NoArgsConstructor
public class Product {

    // Unique auto-generated primary key for each product record
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Display name of the product shown on product cards and detail pages
    @Column(nullable = false, length = 300)
    private String name;

    // Detailed HTML or plain-text description of the product features and specifications
    @Column(columnDefinition = "TEXT")
    private String description;

    // Selling price of the product stored with 2 decimal places for currency precision
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Number of units currently available in the seller's inventory
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    // Current listing state: ACTIVE (visible), INACTIVE (hidden), or OUT_OF_STOCK (unavailable)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

    // The seller who created this product
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    // The category this product belongs to for browsing and filtering
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    // All photos for this product (stored in product_images table)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<ProductImage> images;

    // Average star rating calculated from all customer reviews of this product
    @Column(name = "average_rating", precision = 3, scale = 2)
    private BigDecimal averageRating;

    // Total number of customer reviews submitted for this product
    @Column(name = "review_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer reviewCount;

    // Timestamp of when the product was first created, never updated after insertion
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    // Timestamp of the last update to the product record, automatically refreshed on each save
    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // Constructor with all fields
    public Product(Long id, String name, String description, BigDecimal price, Integer stockQuantity, 
                   ProductStatus status, User seller, Category category, List<ProductImage> images, 
                   BigDecimal averageRating, Integer reviewCount, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.status = status;
        this.seller = seller;
        this.category = category;
        this.images = images;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public Integer getStockQuantity() { return stockQuantity; }
    public ProductStatus getStatus() { return status; }
    public User getSeller() { return seller; }
    public Category getCategory() { return category; }
    public List<ProductImage> getImages() { return images; }
    public BigDecimal getAverageRating() { return averageRating; }
    public Integer getReviewCount() { return reviewCount; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
    public void setStatus(ProductStatus status) { this.status = status; }
    public void setSeller(User seller) { this.seller = seller; }
    public void setCategory(Category category) { this.category = category; }
    public void setImages(List<ProductImage> images) { this.images = images; }
    public void setAverageRating(BigDecimal averageRating) { this.averageRating = averageRating; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder pattern
    public static ProductBuilder builder() {
        return new ProductBuilder();
    }

    public static class ProductBuilder {
        private Long id;
        private String name;
        private String description;
        private BigDecimal price;
        private Integer stockQuantity;
        private ProductStatus status;
        private User seller;
        private Category category;
        private List<ProductImage> images;
        private BigDecimal averageRating;
        private Integer reviewCount;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;

        public ProductBuilder id(Long id) { this.id = id; return this; }
        public ProductBuilder name(String name) { this.name = name; return this; }
        public ProductBuilder description(String description) { this.description = description; return this; }
        public ProductBuilder price(BigDecimal price) { this.price = price; return this; }
        public ProductBuilder stockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; return this; }
        public ProductBuilder status(ProductStatus status) { this.status = status; return this; }
        public ProductBuilder seller(User seller) { this.seller = seller; return this; }
        public ProductBuilder category(Category category) { this.category = category; return this; }
        public ProductBuilder images(List<ProductImage> images) { this.images = images; return this; }
        public ProductBuilder averageRating(BigDecimal averageRating) { this.averageRating = averageRating; return this; }
        public ProductBuilder reviewCount(Integer reviewCount) { this.reviewCount = reviewCount; return this; }
        public ProductBuilder createdAt(OffsetDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ProductBuilder updatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Product build() {
            return new Product(id, name, description, price, stockQuantity, status, seller, category, 
                             images, averageRating, reviewCount, createdAt, updatedAt);
        }
    }
}
