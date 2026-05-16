import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export default function Navbar() {
  // Get authentication state and logout function from AuthContext
  const { user, isLoggedIn, logout } = useAuth()

  // Get cart item count from CartContext
  const { cartCount } = useCart()

  const navigate = useNavigate()

  // Handle logout: clear auth state and redirect to login page
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    // Navigation bar with flex layout that wraps on mobile
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">

        {/* Left side: Logo */}
        <Link to="/" className="text-xl font-bold text-blue-600 whitespace-nowrap">
          🛒 ShopEasy
        </Link>

        {/* Center: Navigation links — changes based on user role */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Home and Products links — always visible */}
          <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>

          {/* Customer-specific links */}
          {isLoggedIn && user?.role === 'CUSTOMER' && (
            <>
              <Link to="/customer/orders" className="text-gray-700 hover:text-blue-600">My Orders</Link>
              <Link to="/customer/wishlist" className="text-gray-700 hover:text-blue-600">Wishlist</Link>
              <Link to="/customer/cart" className="text-gray-700 hover:text-blue-600 relative">
                Cart
                {/* Badge showing number of items in cart */}
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Seller-specific links */}
          {isLoggedIn && user?.role === 'SELLER' && (
            <>
              <Link to="/seller/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
              <Link to="/seller/products" className="text-gray-700 hover:text-blue-600">My Products</Link>
              <Link to="/seller/orders" className="text-gray-700 hover:text-blue-600">My Orders</Link>
            </>
          )}

          {/* Admin-specific links */}
          {isLoggedIn && user?.role === 'ADMIN' && (
            <>
              <Link to="/admin/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
              <Link to="/admin/users" className="text-gray-700 hover:text-blue-600">Users</Link>
              <Link to="/admin/analytics" className="text-gray-700 hover:text-blue-600">Analytics</Link>
            </>
          )}
        </div>

        {/* Right side: Auth buttons or user info */}
        <div className="flex items-center gap-3">
          {/* Show login/register buttons when NOT logged in */}
          {!isLoggedIn && (
            <>
              <Link
                to="/login"
                className="px-4 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}

          {/* Show user info and logout button when logged in */}
          {isLoggedIn && user && (
            <>
              {/* User's first name */}
              <span className="text-sm text-gray-700 font-medium">{user.firstName}</span>
              {/* Role badge */}
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {user.role}
              </span>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
