import { Routes, Route } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'

// Auth pages
import HomePage from './pages/auth/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Customer pages
import ProductListPage from './pages/customer/ProductListPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage'
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage'
import CustomerOrderDetailPage from './pages/customer/CustomerOrderDetailPage'
import WishlistPage from './pages/customer/WishlistPage'

// Seller pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage'
import SellerProductsPage from './pages/seller/SellerProductsPage'
import ProductFormPage from './pages/seller/ProductFormPage'
import SellerOrdersPage from './pages/seller/SellerOrdersPage'

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSellersPage from './pages/admin/AdminSellersPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          {/* These pages are accessible to everyone, no login required */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route
            path="/unauthorized"
            element={
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-red-600">403</h1>
                <p className="mt-4 text-xl text-gray-600">You do not have permission to view this page</p>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">404</h1>
                <p className="mt-4 text-xl text-gray-600">Page Not Found</p>
              </div>
            }
          />

          {/* ==================== CUSTOMER ROUTES ==================== */}
          {/* Only logged-in users with role CUSTOMER can access these */}
          <Route element={<ProtectedRoute requiredRole="CUSTOMER" />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/customer/orders" element={<CustomerOrdersPage />} />
            <Route path="/customer/orders/:id" element={<CustomerOrderDetailPage />} />
            <Route path="/customer/wishlist" element={<WishlistPage />} />
          </Route>

          {/* ==================== SELLER ROUTES ==================== */}
          {/* Only logged-in users with role SELLER can access these */}
          <Route element={<ProtectedRoute requiredRole="SELLER" />}>
            <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
            <Route path="/seller/products" element={<SellerProductsPage />} />
            <Route path="/seller/products/new" element={<ProductFormPage />} />
            <Route path="/seller/products/:id/edit" element={<ProductFormPage />} />
            <Route path="/seller/orders" element={<SellerOrdersPage />} />
          </Route>

          {/* ==================== ADMIN ROUTES ==================== */}
          {/* Only logged-in users with role ADMIN can access these */}
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/sellers" element={<AdminSellersPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
