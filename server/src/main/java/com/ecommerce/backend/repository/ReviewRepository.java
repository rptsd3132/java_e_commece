package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Retrieves all reviews for a product sorted by newest first, with pagination
    Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    // Checks whether the customer already submitted a review for this product (prevents duplicates)
    boolean existsByProductIdAndCustomerId(Long productId, Long customerId);

    // Checks if the customer received a delivery of this product before allowing a review
    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi JOIN oi.order o WHERE o.customer.id = :customerId AND oi.product.id = :productId AND o.status = 'DELIVERED'")
    boolean hasCustomerReceivedProduct(@Param("customerId") Long customerId, @Param("productId") Long productId);
}
