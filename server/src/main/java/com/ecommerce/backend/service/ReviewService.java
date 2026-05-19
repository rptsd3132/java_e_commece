package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.review.ReviewCreateRequest;
import com.ecommerce.backend.dto.review.ReviewResponse;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.Review;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.ReviewRepository;
import com.ecommerce.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    /* ==================================================================== */
    /*  addReview — Submit a new review for a product                       */
    /* ==================================================================== */

    @Transactional
    public ReviewResponse addReview(Long customerId, Long productId, ReviewCreateRequest request) {
        // Reject if the customer already reviewed this product
        if (reviewRepository.existsByProductIdAndCustomerId(productId, customerId)) {
            throw new RuntimeException("You have already reviewed this product");
        }

        // Only allow reviews from customers who actually purchased and received the product
        if (!reviewRepository.hasCustomerReceivedProduct(customerId, productId)) {
            throw new RuntimeException("You can only review products you have purchased and received");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + customerId));

        Review review = Review.builder()
                .product(product)
                .customer(customer)
                .rating(request.rating())
                .comment(request.comment())
                .build();

        review = reviewRepository.save(review);

        return toReviewResponse(review);
    }

    /* ==================================================================== */
    /*  getProductReviews — Paginated list of reviews for a product         */
    /* ==================================================================== */

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);
        return reviews.map(this::toReviewResponse);
    }

    /* ==================================================================== */
    /*  PRIVATE HELPERS                                                     */
    /* ==================================================================== */

    // Converts a Review entity to a ReviewResponse DTO
    private ReviewResponse toReviewResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getCustomer().getFullName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt() != null
                        ? review.getCreatedAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime()
                        : null
        );
    }
}
