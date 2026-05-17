package com.ecommerce.backend.dto.product;

import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        List<CategoryResponse> children
) {}
