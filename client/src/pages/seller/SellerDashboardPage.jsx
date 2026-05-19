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

const formatPrice = (p) => `LKR ${Number(p || 0).toLocaleString('en-US')}`
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export default function SellerDashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.get('/seller/orders/dashboard')
      .then(r => { if (!cancelled) setDashboard(r.data) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <span className="text-5xl block mb-3">⚠️</span>
        <p className="text-gray-600">Failed to load dashboard. Please try again.</p>
      </div>
    )
  }

  const stats = [
    { label: 'Total Orders', value: dashboard?.totalOrders ?? 0, icon: '📦', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Pending Orders', value: dashboard?.pendingOrders ?? 0, icon: '⏳', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { label: 'My Products', value: dashboard?.totalProducts ?? 0, icon: '🏷️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Revenue This Month', value: formatPrice(dashboard?.revenueThisMonth), icon: '📅', color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Total Revenue', value: formatPrice(dashboard?.revenueTotal), icon: '💰', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Seller Dashboard
      </h1>
      <p className="text-gray-500 mb-8">Welcome back, {user?.firstName}!</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 flex items-center gap-4 ${s.color}`}>
            <span className="text-3xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold leading-tight">{s.value}</p>
              <p className="text-xs font-medium opacity-75">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'My Products', to: '/seller/products', icon: '🏷️' },
          { label: 'Add Product', to: '/seller/products/new', icon: '➕' },
          { label: 'My Orders', to: '/seller/orders', icon: '📋' },
        ].map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all"
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
          <Link to="/seller/orders" className="text-sm text-blue-600 hover:text-blue-700">View All →</Link>
        </div>

        {!dashboard?.recentOrders?.length ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">📦</span>
            <p className="text-gray-500 text-sm">No orders yet. Start by listing your products.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <Link to={`/seller/orders`} className="font-medium text-blue-600 hover:underline">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700">{order.customerName}</td>
                    <td className="py-3 font-medium text-gray-900">{formatPrice(order.total)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{formatDate(order.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
