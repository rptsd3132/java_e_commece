package com.ecommerce.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "product_images")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
