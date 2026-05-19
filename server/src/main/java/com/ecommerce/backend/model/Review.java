package com.ecommerce.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

// Maps to the "reviews" table — one row per customer review of a product.
// A UNIQUE constraint on (product_id, customer_id) prevents duplicate reviews.
// The DB trigger auto-updates products.average_rating after every insert.
@Entity
@Table(name = "reviews", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"product_id", "customer_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    // Unique auto-generated primary key for each review
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The product being reviewed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // The customer who submitted the review
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    // The order this review is associated with (nullable — not all reviews require an order context)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    // Star rating between 1 and 5
    @Column(nullable = false, columnDefinition = "SMALLINT")
    private int rating;

    // Optional detailed feedback text
    @Column(columnDefinition = "TEXT")
    private String comment;

    // Timestamp of when the review was first created, never updated after insertion
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
