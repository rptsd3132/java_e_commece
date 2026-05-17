package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

    // Used to fetch the full status timeline for an order, oldest first
    List<OrderStatusHistory> findByOrderIdOrderByChangedAtAsc(Long orderId);
}
