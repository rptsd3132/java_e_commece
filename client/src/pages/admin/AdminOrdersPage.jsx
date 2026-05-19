import { Link } from 'react-router-dom'

export default function AdminOrdersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
        <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-sm text-blue-800">
        <strong>API Coming Soon:</strong> The admin orders API (<code>/api/admin/orders</code>) is not yet implemented.
        This page will provide a platform-wide view of all orders across all sellers and customers.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { icon: '⏳', label: 'Pending', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
          { icon: '📦', label: 'Shipped', color: 'bg-purple-50 border-purple-200 text-purple-800' },
          { icon: '✅', label: 'Delivered', color: 'bg-green-50 border-green-200 text-green-800' },
          { icon: '❌', label: 'Cancelled', color: 'bg-red-50 border-red-200 text-red-800' },
          { icon: '💳', label: 'Refunded', color: 'bg-gray-50 border-gray-200 text-gray-800' },
          { icon: '🔵', label: 'Confirmed', color: 'bg-blue-50 border-blue-200 text-blue-800' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 text-center ${s.color}`}>
            <span className="text-3xl block mb-2">{s.icon}</span>
            <p className="font-semibold">{s.label}</p>
            <p className="text-2xl font-bold mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
