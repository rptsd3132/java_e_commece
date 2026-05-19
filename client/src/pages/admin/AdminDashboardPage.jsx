import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ products: 0, categories: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get('/products?page=0&size=1').catch(() => ({ data: { totalElements: 0 } })),
      api.get('/categories').catch(() => ({ data: [] })),
    ]).then(([prodRes, catRes]) => {
      if (cancelled) return
      setStats({
        products: prodRes.data.totalElements || 0,
        categories: (catRes.data || []).length,
      })
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const panels = [
    { label: 'Users', icon: '👤', to: '/admin/users', color: 'from-blue-500 to-blue-700', desc: 'Manage registered users' },
    { label: 'Sellers', icon: '🏪', to: '/admin/sellers', color: 'from-purple-500 to-purple-700', desc: 'Manage seller accounts' },
    { label: 'Products', icon: '🏷️', to: '/admin/products', color: 'from-green-500 to-green-700', desc: loading ? '…' : `${stats.products} listed` },
    { label: 'Orders', icon: '📦', to: '/admin/orders', color: 'from-orange-500 to-orange-700', desc: 'View all orders' },
    { label: 'Categories', icon: '📂', to: '/admin/products', color: 'from-pink-500 to-pink-700', desc: loading ? '…' : `${stats.categories} categories` },
    { label: 'Coupons', icon: '🎟️', to: '/admin/coupons', color: 'from-red-500 to-red-700', desc: 'Manage discount codes' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Welcome, {user?.firstName}. Manage the ShopEasy platform.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {panels.map((p) => (
          <Link
            key={p.label}
            to={p.to}
            className={`bg-gradient-to-br ${p.color} text-white rounded-xl p-6 hover:opacity-90 hover:scale-105 transition-all shadow-md`}
          >
            <span className="text-4xl block mb-3">{p.icon}</span>
            <p className="text-xl font-bold">{p.label}</p>
            <p className="text-sm text-white/75 mt-1">{p.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-sm text-yellow-800">
        <strong>Note:</strong> Some admin management APIs (users, sellers, orders, coupons) are not yet implemented in the backend.
        Those sections will show placeholder content until the API is available.
      </div>
    </div>
  )
}
