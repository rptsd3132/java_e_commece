package com.ecommerce.backend.model;

import com.ecommerce.backend.model.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
