import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}

const formatPrice = (p) => `LKR ${Number(p).toLocaleString('en-US')}`
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export default function CustomerDashboardPage() {
  const { user } = useAuth()
  const [recentOrders, setRecentOrders] = useState([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get('/orders?page=0&size=3').catch(() => ({ data: { content: [], totalElements: 0 } })),
      api.get('/wishlist').catch(() => ({ data: [] })),
    ]).then(([ordersRes, wishlistRes]) => {
      if (cancelled) return
      setRecentOrders(ordersRes.data.content || [])
      setTotalOrders(ordersRes.data.totalElements || 0)
      setWishlistCount((wishlistRes.data || []).length)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome back, {user?.firstName}!
      </h1>
      <p className="text-gray-500 mb-8">Here&apos;s an overview of your account.</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: loading ? '…' : totalOrders, icon: '📦', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Wishlist Items', value: loading ? '…' : wishlistCount, icon: '❤️', color: 'bg-pink-50 text-pink-700 border-pink-200' },
          { label: 'Account Status', value: 'Active', icon: '✅', color: 'bg-green-50 text-green-700 border-green-200' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-5 flex items-center gap-4 ${stat.color}`}>
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm font-medium opacity-80">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'My Orders', to: '/customer/orders', icon: '📋' },
          { label: 'Wishlist', to: '/customer/wishlist', icon: '❤️' },
          { label: 'Cart', to: '/cart', icon: '🛒' },
          { label: 'Browse', to: '/products', icon: '🛍️' },
        ].map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all text-center"
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="text-sm font-medium text-gray-700">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/customer/orders" className="text-sm text-blue-600 hover:text-blue-700">View All →</Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">📦</span>
            <p className="text-gray-500 text-sm">No orders yet.</p>
            <Link to="/products" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/customer/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">Order #{order.id}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.placedAt)}</p>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
