package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Gets only top-level categories (Electronics, Clothing, Books...)
    List<Category> findByParentCategoryIsNull();

    // Gets subcategories of a given parent
    List<Category> findByParentCategoryId(Long parentId);

    // Finds category by URL slug like 'smartphones'
    Optional<Category> findBySlug(String slug);
}
