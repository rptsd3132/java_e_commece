package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.order.OrderItemResponse;
import com.ecommerce.backend.dto.order.OrderResponse;
import com.ecommerce.backend.dto.order.OrderStatusDto;
import com.ecommerce.backend.dto.order.PlaceOrderRequest;
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
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

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
