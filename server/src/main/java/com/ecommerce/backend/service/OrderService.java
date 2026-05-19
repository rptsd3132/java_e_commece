package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.order.OrderItemResponse;
import com.ecommerce.backend.dto.order.OrderResponse;
import com.ecommerce.backend.dto.order.OrderStatusDto;
import com.ecommerce.backend.dto.order.PlaceOrderRequest;
import com.ecommerce.backend.dto.order.SellerDashboardDto;
import com.ecommerce.backend.dto.order.SellerDashboardDto.RecentOrderDto;
import com.ecommerce.backend.model.*;
import com.ecommerce.backend.model.enums.OrderStatus;
import com.ecommerce.backend.model.enums.PaymentStatus;
import com.ecommerce.backend.model.enums.ProductStatus;
import com.ecommerce.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    /* ==================================================================== */
    /*  METHOD 1 — placeOrder                                               */
    /* ==================================================================== */

    @Transactional
    public OrderResponse placeOrder(Long customerId, PlaceOrderRequest req) {

        // Step 1: Validate cart — load all items in the customer's cart
        List<CartItem> cartItems = cartRepository.findByUserId(customerId);

        // Cannot place order with empty cart
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Your cart is empty");
        }

        // Step 2: Validate stock for every item before making any DB changes
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new RuntimeException("Not enough stock for: " + product.getName());
            }
        }

        // Step 3: Calculate totals — subtotal = sum of (price × quantity) for all cart items
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            BigDecimal lineTotal = cartItem.getProduct().getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(lineTotal);
        }

        // discountAmount = 0 for now (coupon logic added in Phase 6)
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.subtract(discountAmount);

        // Step 4: Load address and verify it belongs to this customer
        Address addr = addressRepository.findById(req.addressId())
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + req.addressId()));

        if (!addr.getUser().getId().equals(customerId)) {
            throw new RuntimeException("Address does not belong to this customer");
        }

        // Step 5: Create Order record with PENDING status and address snapshot
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + customerId));

        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .couponCode(req.couponCode())
                .shipStreet(addr.getStreet())
                .shipCity(addr.getCity())
                .shipState(addr.getState())
                .shipZip(addr.getZipCode())
                .shipCountry(addr.getCountry())
                .build();

        Order savedOrder = orderRepository.save(order);

        // Step 6: Create OrderItem for each cart item, snapshotting product details
        // We snapshot name and price so they don't change if seller edits the product later
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            BigDecimal unitPrice = product.getPrice();
            Integer quantity = cartItem.getQuantity();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(product)
                    .seller(product.getSeller())
                    .productName(product.getName())
                    .productImageUrl(getPrimaryImageUrl(product))
                    .unitPrice(unitPrice)
                    .quantity(quantity)
                    .lineTotal(lineTotal)
                    .build();

            orderItemRepository.save(orderItem);

            itemResponses.add(new OrderItemResponse(
                    product.getId(),
                    product.getName(),
                    getPrimaryImageUrl(product),
                    unitPrice,
                    quantity,
                    lineTotal,
                    product.getSeller().getStoreName() != null
                            ? product.getSeller().getStoreName()
                            : product.getSeller().getFirstName() + " " + product.getSeller().getLastName()
            ));
        }

        // Step 7: Reduce stock by the quantity ordered
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            if (product.getStockQuantity() == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            }
            productRepository.save(product);
        }

        // Step 8: Record the first status entry in the order history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status(OrderStatus.PENDING)
                .build();
        orderStatusHistoryRepository.save(history);

        // Step 9: Clear the customer's cart — order is placed
        cartRepository.deleteByUserId(customerId);

        // Step 10: Build and return the response
        return new OrderResponse(
                savedOrder.getId(),
                savedOrder.getStatus(),
                savedOrder.getPaymentStatus(),
                savedOrder.getSubtotal(),
                savedOrder.getDiscountAmount(),
                savedOrder.getTotalAmount(),
                savedOrder.getCouponCode(),
                itemResponses,
                savedOrder.getShipStreet(),
                savedOrder.getShipCity(),
                savedOrder.getShipState(),
                savedOrder.getShipZip(),
                savedOrder.getShipCountry(),
                savedOrder.getPlacedAt() != null
                        ? savedOrder.getPlacedAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime()
                        : null
        );
    }

    /* ==================================================================== */
    /*  METHOD 2 — getCustomerOrders                                        */
    /* ==================================================================== */

    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrders(Long customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "placedAt"));
        Page<Order> orderPage = orderRepository.findByCustomerIdOrderByPlacedAtDesc(customerId, pageable);
        return orderPage.map(this::toOrderResponse);
    }

    /* ==================================================================== */
    /*  METHOD 3 — getOrderById                                             */
    /* ==================================================================== */

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long customerId, Long orderId) {
        Order order = orderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        return toOrderResponse(order);
    }

    /* ==================================================================== */
    /*  METHOD 4 — cancelOrder                                              */
    /* ==================================================================== */

    @Transactional
    public void cancelOrder(Long customerId, Long orderId) {
        // Load order and verify ownership
        Order order = orderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // Only allow cancellation if the current status is PENDING
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new RuntimeException("Only pending orders can be cancelled");
        }

        // Set status to CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Restore stock for each item in the order
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            if (product != null) {
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                if (product.getStatus() == ProductStatus.OUT_OF_STOCK && product.getStockQuantity() > 0) {
                    product.setStatus(ProductStatus.ACTIVE);
                }
                productRepository.save(product);
            }
        }

        // Record CANCELLED in the status history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.CANCELLED)
                .build();
        orderStatusHistoryRepository.save(history);
    }

    /* ==================================================================== */
    /*  METHOD 5 — getOrderTimeline                                         */
    /* ==================================================================== */

    @Transactional(readOnly = true)
    public List<OrderStatusDto> getOrderTimeline(Long orderId) {
        List<OrderStatusHistory> historyList =
                orderStatusHistoryRepository.findByOrderIdOrderByChangedAtAsc(orderId);

        List<OrderStatusDto> dtos = new ArrayList<>();
        for (OrderStatusHistory history : historyList) {
            dtos.add(new OrderStatusDto(
                    history.getStatus(),
                    history.getNote(),
                    history.getChangedAt() != null
                            ? history.getChangedAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime()
                            : null
            ));
        }
        return dtos;
    }

    /* ==================================================================== */
    /*  METHOD 6 — getSellerOrders                                          */
    /* ==================================================================== */

    // Sellers only see orders that contain their products
    @Transactional(readOnly = true)
    public Page<OrderResponse> getSellerOrders(Long sellerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "placedAt"));
        Page<Order> orderPage = orderRepository.findByItemsSellerIdOrderByPlacedAtDesc(sellerId, pageable);
        return orderPage.map(this::toOrderResponse);
    }

    /* ==================================================================== */
    /*  METHOD 7 — getOrderByIdForSeller                                    */
    /* ==================================================================== */

    // Sellers can only view orders that contain their products
    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdForSeller(Long orderId, Long sellerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        boolean hasSellerItem = orderItemRepository.findByOrderId(orderId).stream()
                .anyMatch(item -> item.getSeller() != null && item.getSeller().getId().equals(sellerId));

        if (!hasSellerItem) {
            throw new RuntimeException("You don't have permission to view this order");
        }

        return toOrderResponse(order);
    }

    /* ==================================================================== */
    /*  METHOD 8 — updateOrderStatus                                        */
    /* ==================================================================== */

    // Sellers can only move status forward, never backwards
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, Long sellerId, OrderStatus newStatus) {
        // Step 1: Load order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // Step 2: Verify seller has at least one item in this order
        boolean hasSellerItem = orderItemRepository.findByOrderId(orderId).stream()
                .anyMatch(item -> item.getSeller() != null && item.getSeller().getId().equals(sellerId));

        if (!hasSellerItem) {
            throw new RuntimeException("You don't have permission to update this order");
        }

        // Step 3: Validate status transition direction
        OrderStatus currentStatus = order.getStatus();
        if (!isValidForwardTransition(currentStatus, newStatus)) {
            throw new RuntimeException("Cannot change status from " + currentStatus + " to " + newStatus);
        }

        // Step 4: Update order status
        order.setStatus(newStatus);
        orderRepository.save(order);

        // Step 5: Save new OrderStatusHistory row with changedBy=seller
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found with id: " + sellerId));

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(newStatus)
                .changedBy(seller)
                .build();
        orderStatusHistoryRepository.save(history);

        // Step 6: Return updated OrderResponse
        return toOrderResponse(order);
    }

    // Validates that the status transition moves forward only: PENDING → CONFIRMED → SHIPPED → DELIVERED
    private boolean isValidForwardTransition(OrderStatus current, OrderStatus next) {
        return switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED;
            case CONFIRMED -> next == OrderStatus.SHIPPED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            default -> false;
        };
    }

    /* ==================================================================== */
    /*  METHOD 9 — getSellerDashboard                                       */
    /* ==================================================================== */

    /**
     * Builds the seller dashboard stats:
     *   - totalOrders: distinct orders where seller has at least one item
     *   - pendingOrders: distinct orders with status PENDING or CONFIRMED
     *   - totalProducts: count of products owned by this seller
     *   - revenueThisMonth: SUM of line_total for current calendar month
     *   - revenueTotal: SUM of line_total for all time
     *   - recentOrders: last 5 orders with customer name, seller's share, status, date
     */
    @Transactional(readOnly = true)
    public SellerDashboardDto getSellerDashboard(Long sellerId) {

        // Total distinct orders where this seller has items
        long totalOrders = orderRepository.countDistinctByItemsSellerId(sellerId);

        // Distinct orders with PENDING or CONFIRMED status
        long pendingOrders = orderRepository.countDistinctByItemsSellerIdAndStatusIn(
                sellerId, List.of(OrderStatus.PENDING, OrderStatus.CONFIRMED)
        );

        // Total products owned by this seller
        long totalProducts = productRepository.countBySellerId(sellerId);

        // Total lifetime revenue: SUM of line_total for all seller's order items
        BigDecimal revenueTotal = orderItemRepository.sumLineTotalBySellerId(sellerId);

        // Monthly revenue: SUM of line_total for items where order placed in current month
        // Calculate start and end of current month in system timezone, then convert to OffsetDateTime
        LocalDate now = LocalDate.now(ZoneId.systemDefault());
        LocalDate firstDayOfMonth = now.withDayOfMonth(1);
        LocalDate lastDayOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        // Convert to OffsetDateTime at start/end of day with system default offset
        OffsetDateTime monthStart = firstDayOfMonth.atStartOfDay()
                .atOffset(ZoneOffset.systemDefault().getRules().getOffset(now.atStartOfDay()));
        OffsetDateTime monthEnd = lastDayOfMonth.atTime(LocalTime.MAX)
                .atOffset(ZoneOffset.systemDefault().getRules().getOffset(lastDayOfMonth.atStartOfDay()));

        BigDecimal revenueThisMonth = orderItemRepository.sumLineTotalBySellerIdAndOrderPlacedAtBetween(
                sellerId, monthStart, monthEnd
        );

        // Recent orders: fetch top 5 most recent order items, then deduplicate by order
        // and aggregate the seller's share per order
        List<OrderItem> recentItems = orderItemRepository.findTop5BySellerIdOrderByOrderPlacedAtDesc(sellerId);

        // Use a LinkedHashMap to preserve insertion order while deduplicating by order ID
        Map<Long, RecentOrderDto> recentOrdersMap = new LinkedHashMap<>();
        for (OrderItem item : recentItems) {
            Long orderId = item.getOrder().getId();
            if (!recentOrdersMap.containsKey(orderId)) {
                // First time seeing this order — create the DTO entry
                String customerName = item.getOrder().getCustomer().getFirstName()
                        + " " + item.getOrder().getCustomer().getLastName();
                String status = item.getOrder().getStatus().name();
                LocalDateTime date = item.getOrder().getPlacedAt() != null
                        ? item.getOrder().getPlacedAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime()
                        : null;

                recentOrdersMap.put(orderId, new RecentOrderDto(
                        orderId, customerName, item.getLineTotal(), status, date
                ));
            } else {
                // Order already in map — add this item's line_total to the existing total
                RecentOrderDto existing = recentOrdersMap.get(orderId);
                recentOrdersMap.put(orderId, new RecentOrderDto(
                        existing.id(),
                        existing.customerName(),
                        existing.total().add(item.getLineTotal()),
                        existing.status(),
                        existing.date()
                ));
            }
        }

        // Take only the first 5 unique orders
        List<RecentOrderDto> recentOrders = recentOrdersMap.values().stream()
                .limit(5)
                .collect(Collectors.toList());

        return new SellerDashboardDto(
                totalOrders,
                pendingOrders,
                totalProducts,
                revenueThisMonth,
                revenueTotal,
                recentOrders
        );
    }

    /* ==================================================================== */
    /*  PRIVATE HELPERS                                                     */
    /* ==================================================================== */

    // Converts an Order entity to an OrderResponse DTO
    private OrderResponse toOrderResponse(Order order) {
        // Load items for this order
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<OrderItemResponse> itemResponses = new ArrayList<>();

        for (OrderItem item : items) {
            String sellerName = item.getSeller() != null
                    ? (item.getSeller().getStoreName() != null
                        ? item.getSeller().getStoreName()
                        : item.getSeller().getFirstName() + " " + item.getSeller().getLastName())
                    : null;

            itemResponses.add(new OrderItemResponse(
                    item.getProduct() != null ? item.getProduct().getId() : null,
                    item.getProductName(),
                    item.getProductImageUrl(),
                    item.getUnitPrice(),
                    item.getQuantity(),
                    item.getLineTotal(),
                    sellerName
            ));
        }

        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getSubtotal(),
                order.getDiscountAmount(),
                order.getTotalAmount(),
                order.getCouponCode(),
                itemResponses,
                order.getShipStreet(),
                order.getShipCity(),
                order.getShipState(),
                order.getShipZip(),
                order.getShipCountry(),
                order.getPlacedAt() != null
                        ? order.getPlacedAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime()
                        : null
        );
    }

    // Extracts the primary image URL from a product's image list
    private String getPrimaryImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }
        for (ProductImage image : product.getImages()) {
            if (Boolean.TRUE.equals(image.getIsPrimary())) {
                return image.getImageUrl();
            }
        }
        return product.getImages().get(0).getImageUrl();
    }
}
