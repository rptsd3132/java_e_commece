package com.ecommerce.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    // Unique auto-generated primary key for each category record
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Display name of the category shown to users on the storefront
    @Column(nullable = false, length = 100)
    private String name;

    // URL-friendly version of the name used in routes, must be unique across all categories
    @Column(unique = true, length = 100)
    private String slug;

    // This links a subcategory to its parent. E.g. Smartphones → parent is Electronics
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parentCategory;

    // A parent category has many child subcategories
    @OneToMany(mappedBy = "parentCategory")
    private List<Category> children;

    // Timestamp of when the category was first created, never updated after insertion
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
