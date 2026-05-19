# 🛒 Java E-Commerce Application

A full-stack e-commerce web application built with **Java Spring Boot** (backend) and **React** (frontend). It supports three types of users: **Customers**, **Sellers**, and **Admins** — each with their own dashboard and features.

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Overview](#api-overview)
- [Database](#database)
- [User Roles](#user-roles)
- [Pages & Routes](#pages--routes)

---

## About the Project

This is a complete online shopping platform where:
- **Customers** can browse products, add to cart, place orders, write reviews, and save wishlists.
- **Sellers** can list their products, manage inventory, and track orders.
- **Admins** can manage all users, sellers, products, orders, and discount coupons.

The app uses **JWT (JSON Web Tokens)** for secure login and access control.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Java 21 | Programming language |
| Spring Boot 3.4 | Web framework |
| Spring Security | Authentication & authorization |
| Spring Data JPA / Hibernate | Database access |
| PostgreSQL | Database |
| JWT (JJWT 0.11.5) | Secure token-based login |
| Cloudinary | Image uploads |
| Lombok | Reduces boilerplate Java code |
| Maven | Build tool |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Fast development build tool |
| React Router v7 | Page navigation |
| Axios | API calls |
| Tailwind CSS | Styling |
| Stripe | Payment processing |
| Recharts | Dashboard charts |

---

## Project Structure

```
java_e_commece-main/
│
├── client/                         # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                    # Axios HTTP client setup
│   │   ├── assets/                 # Images and icons
│   │   ├── components/
│   │   │   ├── common/             # Navbar, Footer, ProtectedRoute
│   │   │   ├── admin/              # Admin UI components
│   │   │   ├── customer/           # Customer UI components
│   │   │   └── seller/             # Seller UI components
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Manages login/logout state
│   │   │   └── CartContext.jsx     # Manages shopping cart state
│   │   ├── pages/
│   │   │   ├── auth/               # Home, Login, Register pages
│   │   │   ├── customer/           # Product list, Cart, Orders, Wishlist
│   │   │   ├── seller/             # Seller dashboard, Products, Orders
│   │   │   └── admin/              # Admin dashboard, Users, Coupons
│   │   └── App.jsx                 # Main routing file
│   └── package.json
│
└── server/                         # Spring Boot Backend
    └── src/main/java/com/ecommerce/backend/
        ├── controller/             # API endpoint handlers
        ├── service/                # Business logic
        ├── repository/             # Database queries
        ├── model/                  # Database table models
        │   └── enums/              # Status types (OrderStatus, UserRole, etc.)
        ├── dto/                    # Request/Response data shapes
        ├── security/               # JWT filter & authentication
        ├── config/                 # Security, CORS, Cloudinary config
        └── exception/              # Error handling
```

---

## Features

### 👤 Customer
- Register and log in
- Browse and search products by category
- View product details and reviews
- Add products to cart
- Apply discount coupons at checkout
- Pay with Stripe
- Track order status
- Save products to wishlist
- Manage delivery addresses

### 🏪 Seller
- Register as a seller
- Add, edit, and delete products
- Upload product images
- View and manage incoming orders
- Dashboard with sales overview

### 🛡️ Admin
- View and manage all users
- Approve or reject seller accounts
- Manage all products
- View and update all orders
- Create and manage discount coupons
- Full dashboard with analytics

---

## Getting Started

### Requirements

Make sure you have the following installed:
- **Java 21**
- **Maven**
- **Node.js** (v18 or higher)
- **PostgreSQL**
- A **Cloudinary** account (for image uploads)
- A **Stripe** account (for payments)

---

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/java_e_commece.git
   cd java_e_commece/server
   ```

2. **Create the PostgreSQL database**
   ```sql
   CREATE DATABASE ecommerce_db;
   CREATE USER ecom_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecom_user;
   ```

3. **Set environment variables**

   Create a `.env` file or set these in your system:
   ```
   DB_PASSWORD=your_database_password
   JWT_SECRET=your_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. **Run the backend**
   ```bash
   mvn spring-boot:run
   ```

   The server will start at `http://localhost:8080`

---

### Frontend Setup

1. **Navigate to the client folder**
   ```bash
   cd ../client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the `client/` folder:
   ```
   VITE_API_BASE_URL=http://localhost:8080
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173`

---

## API Overview

The backend provides REST API endpoints at `http://localhost:8080/api/...`

| Endpoint Group | Description |
|---|---|
| `/api/auth` | Register, login, get current user |
| `/api/products` | List, search, view products |
| `/api/cart` | Add, remove, view cart items |
| `/api/orders` | Place orders, track order status |
| `/api/seller/orders` | Seller-specific order management |
| `/api/categories` | Product categories |
| `/api/reviews` | Post and view product reviews |
| `/api/wishlist` | Add/remove wishlist items |
| `/api/addresses` | Manage delivery addresses |

All protected routes require a JWT token in the `Authorization: Bearer <token>` header.

---

## Database

- **Database name:** `ecommerce_db`
- **Database user:** `ecom_user`
- **Port:** `5432`
- **Password:** Set via `DB_PASSWORD` environment variable

### Main Tables (Entities)

| Table | Description |
|---|---|
| `users` | All users (customers, sellers, admins) |
| `products` | Product listings |
| `product_images` | Product photos |
| `categories` | Product categories |
| `cart_items` | Shopping cart entries |
| `orders` | Customer orders |
| `order_items` | Products inside each order |
| `order_status_history` | Timeline of order status changes |
| `reviews` | Customer product reviews |
| `wishlist_items` | Saved products |
| `coupons` | Discount coupon codes |
| `addresses` | Customer delivery addresses |

---

## User Roles

| Role | What they can do |
|---|---|
| `CUSTOMER` | Shop, order, review, wishlist |
| `SELLER` | Manage products and fulfill orders |
| `ADMIN` | Full control over entire platform |

Roles are enforced on both the frontend (protected routes) and backend (Spring Security).

---

## Pages & Routes

### Public (anyone can visit)
| Route | Page |
|---|---|
| `/` | Home page |
| `/login` | Login page |
| `/register` | Register page |
| `/products` | Product listing |
| `/products/:id` | Product detail page |

### Customer (must be logged in as CUSTOMER)
| Route | Page |
|---|---|
| `/cart` | Shopping cart |
| `/checkout` | Checkout & payment |
| `/customer/dashboard` | Customer dashboard |
| `/customer/orders` | Order history |
| `/customer/orders/:id` | Order detail |
| `/customer/wishlist` | Saved products |

### Seller (must be logged in as SELLER)
| Route | Page |
|---|---|
| `/seller/dashboard` | Seller overview |
| `/seller/products` | Manage products |
| `/seller/products/new` | Add new product |
| `/seller/products/:id/edit` | Edit product |
| `/seller/orders` | Manage orders |

### Admin (must be logged in as ADMIN)
| Route | Page |
|---|---|
| `/admin/dashboard` | Admin overview |
| `/admin/users` | Manage users |
| `/admin/sellers` | Approve/reject sellers |
| `/admin/products` | View all products |
| `/admin/orders` | View all orders |
| `/admin/coupons` | Manage coupons |

---

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

This project is open source. Feel free to use, modify, and share it.

---

👨‍💻 Author

R. P. T. Sandeepa Dilhara (computer engineer  and IT undergraduate student )
