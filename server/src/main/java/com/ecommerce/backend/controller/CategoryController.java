package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.product.CategoryResponse;
import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    // Public endpoint. Returns top-level categories with subcategories nested.
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        // Step 1: Fetch all top-level categories (those without a parent)
        List<Category> topLevelCategories = categoryRepository.findByParentCategoryIsNull();

        // Step 2: Convert each top-level category to a response DTO, nesting its children
        List<CategoryResponse> response = topLevelCategories.stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    // Only admins can create new categories
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody Map<String, Object> body) {
        // Step 1: Extract fields from the request body
        String name = (String) body.get("name");
        String slug = (String) body.get("slug");
        Long parentId = body.get("parentId") != null ? ((Number) body.get("parentId")).longValue() : null;

        // Step 2: Build the Category entity
        Category category = Category.builder()
                .name(name)
                .slug(slug)
                .build();

        // Step 3: If a parentId was provided, link to the parent category
        if (parentId != null) {
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent category not found with id: " + parentId));
            category.setParentCategory(parent);
        }

        // Step 4: Save and return the created category
        Category savedCategory = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(savedCategory));
    }

    // Converts a Category entity to a CategoryResponse DTO with nested children
    private CategoryResponse toResponse(Category category) {
        List<CategoryResponse> children = category.getChildren() != null
                ? category.getChildren().stream()
                        .map(this::toResponse)
                        .toList()
                : List.of();

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                children
        );
    }
}
