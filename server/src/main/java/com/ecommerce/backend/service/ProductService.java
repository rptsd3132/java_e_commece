package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.product.ProductCreateRequest;
import com.ecommerce.backend.dto.product.ProductResponse;
import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.ProductImage;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.model.enums.ProductStatus;
import com.ecommerce.backend.model.enums.UserRole;
import com.ecommerce.backend.repository.CategoryRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    // Lists all active products with optional filters, sorted newest first
    public Page<ProductResponse> getProducts(String search, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, int page, int size) {
        // Step 1: Create a Pageable that sorts by created_at descending (newest first)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Product> productPage;

        // Step 2: If no filters provided, fetch all ACTIVE products
        if (search == null && categoryId == null && minPrice == null && maxPrice == null) {
            productPage = productRepository.findByStatus(ProductStatus.ACTIVE, pageable);
        }
        // Step 3: Otherwise use the filter query with the provided parameters
        else {
            productPage = productRepository.filterProducts(categoryId, search, minPrice, maxPrice, pageable);
        }

        // Step 4: Convert each Product entity to a ProductResponse DTO
        return productPage.map(this::toResponse);
    }

    // Returns a single product by its ID
    public ProductResponse getProductById(Long id) {
        // Step 1: Find the product in the database
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        // Step 2: Convert to response format
        return toResponse(product);
    }

    // Creates a new product for a seller
    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request, Long sellerId) {
        // Step 1: Load the seller user from the database
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found with id: " + sellerId));

        // Step 2: Load the category if one was provided
        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.categoryId()));
        }

        // Step 3: Determine the product status (default to ACTIVE if not specified)
        ProductStatus status = request.status() != null
                ? ProductStatus.valueOf(request.status())
                : ProductStatus.ACTIVE;

        // Step 4: Build the Product entity
        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .stockQuantity(request.stockQuantity())
                .status(status)
                .seller(seller)
                .category(category)
                .averageRating(BigDecimal.ZERO)
                .reviewCount(0)
                .build();

        // Step 5: Save the product to get an ID for the images
        Product savedProduct = productRepository.save(product);

        // Step 6: Create ProductImage records for each provided URL
        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            List<ProductImage> images = new ArrayList<>();
            for (int i = 0; i < request.imageUrls().size(); i++) {
                ProductImage image = ProductImage.builder()
                        .product(savedProduct)
                        .imageUrl(request.imageUrls().get(i))
                        .isPrimary(i == 0)
                        .sortOrder(i)
                        .build();
                images.add(image);
            }
            savedProduct.setImages(images);
            savedProduct = productRepository.save(savedProduct);
        }

        // Step 7: Return the created product as a response DTO
        return toResponse(savedProduct);
    }

    // Updates an existing product (only the seller who owns it can update)
    @Transactional
    public ProductResponse updateProduct(Long productId, ProductCreateRequest request, Long sellerId) {
        // Step 1: Load the product from the database
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // Step 2: Verify the requesting user is the owner of this product
        if (!product.getSeller().getId().equals(sellerId)) {
            throw new RuntimeException("Not authorized to update this product");
        }

        // Step 3: Update the product fields from the request
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());

        if (request.status() != null) {
            product.setStatus(ProductStatus.valueOf(request.status()));
        }

        // Step 4: Update the category if provided
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.categoryId()));
            product.setCategory(category);
        }

        // Step 5: Delete old images and replace with new ones
        if (product.getImages() != null) {
            product.getImages().clear();
        }

        // Step 6: Create new ProductImage records from the request
        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            List<ProductImage> images = new ArrayList<>();
            for (int i = 0; i < request.imageUrls().size(); i++) {
                ProductImage image = ProductImage.builder()
                        .product(product)
                        .imageUrl(request.imageUrls().get(i))
                        .isPrimary(i == 0)
                        .sortOrder(i)
                        .build();
                images.add(image);
            }
            product.setImages(images);
        }

        // Step 7: Save and return the updated product
        Product updatedProduct = productRepository.save(product);
        return toResponse(updatedProduct);
    }

    // Deletes a product (seller can delete own, admin can delete any)
    @Transactional
    public void deleteProduct(Long productId, Long requesterId, String requesterRole) {
        // Step 1: Load the product from the database
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // Step 2: Check authorization based on the requester's role
        if (UserRole.SELLER.name().equals(requesterRole)) {
            // Sellers can only delete their own products
            if (!product.getSeller().getId().equals(requesterId)) {
                throw new RuntimeException("Not authorized to delete this product");
            }
        }
        // Admins can delete any product — no additional check needed

        // Step 3: Delete the product (cascade removes all associated images)
        productRepository.delete(product);
    }

    // Returns all products belonging to a specific seller, paginated
    public Page<ProductResponse> getSellerProducts(Long sellerId, int page, int size) {
        // Step 1: Create pageable sorted by newest first
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Step 2: Fetch all products for this seller regardless of status
        Page<Product> productPage = productRepository.findBySellerIdAndStatus(sellerId, null, pageable);

        // Step 3: If the repository method doesn't support null status, fall back to all statuses
        // Using a custom query or fetch all and filter — here we use findBySellerId and paginate manually
        List<Product> allProducts = productRepository.findBySellerId(sellerId);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allProducts.size());

        List<Product> pagedProducts = allProducts.subList(start, end);
        return new org.springframework.data.domain.PageImpl<>(
                pagedProducts.stream().map(this::toResponse).toList(),
                pageable,
                allProducts.size()
        );
    }

    // Converts database object to API response format
    private ProductResponse toResponse(Product product) {
        // Step 1: Extract all image URLs from the product's image list
        List<String> imageUrls = new ArrayList<>();
        String primaryImageUrl = null;

        if (product.getImages() != null) {
            for (ProductImage image : product.getImages()) {
                imageUrls.add(image.getImageUrl());
                // Step 2: Identify the primary (main) image
                if (Boolean.TRUE.equals(image.getIsPrimary())) {
                    primaryImageUrl = image.getImageUrl();
                }
            }
        }

        // Step 3: Build and return the ProductResponse with all mapped fields
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getStatus().name(),
                product.getSeller().getId(),
                product.getSeller().getFirstName() + " " + product.getSeller().getLastName(),
                product.getSeller().getStoreName(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                imageUrls,
                primaryImageUrl,
                product.getAverageRating() != null ? product.getAverageRating().doubleValue() : null,
                product.getReviewCount(),
                product.getCreatedAt() != null
                        ? product.getCreatedAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime()
                        : null
        );
    }
}
