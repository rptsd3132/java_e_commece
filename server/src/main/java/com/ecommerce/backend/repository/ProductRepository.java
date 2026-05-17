package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Used to list all ACTIVE products on the public product page
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    // Used in seller dashboard to show only their own products
    Page<Product> findBySellerIdAndStatus(Long sellerId, ProductStatus status, Pageable pageable);

    // Used when customer filters products by category
    Page<Product> findByCategoryIdAndStatus(Long categoryId, ProductStatus status, Pageable pageable);

    // Used for the search bar - finds products whose name contains the search text
    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' AND LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> searchByName(@Param("search") String search, Pageable pageable);

    // The main filter query - all parameters are optional (null means "ignore this filter")
    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' " +
            "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
            "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Product> filterProducts(@Param("categoryId") Long categoryId,
                                 @Param("search") String search,
                                 @Param("minPrice") BigDecimal minPrice,
                                 @Param("maxPrice") BigDecimal maxPrice,
                                 Pageable pageable);

    // Returns all products for a seller (used for seller stats)
    List<Product> findBySellerId(Long sellerId);

    // Counts seller's total products for dashboard stats card
    long countBySellerId(Long sellerId);
}
