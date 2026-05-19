package com.ecommerce.backend.dto.review;

import java.time.LocalDateTime;

public record ReviewResponse(
        // Unique identifier for the review
        Long id,

        // Display name of the customer who wrote the review
        String customerName,

        // Star rating (1-5) given by the customer
        int rating,

        // Optional written feedback from the customer
        String comment,

        // Timestamp of when the review was submitted
        LocalDateTime createdAt
) {}
