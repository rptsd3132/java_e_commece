import { Link } from 'react-router-dom'

export default function AdminUsersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-sm text-blue-800">
        <strong>API Coming Soon:</strong> The user management API (<code>/api/admin/users</code>) is not yet implemented.
        This page will list all registered users, allow role changes, and enable account deactivation once the backend endpoint is ready.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '👤', label: 'Customers', desc: 'Registered shoppers' },
          { icon: '🏪', label: 'Sellers', desc: 'Marketplace vendors' },
          { icon: '🛡️', label: 'Admins', desc: 'Platform administrators' },
        ].map((r) => (
          <div key={r.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <span className="text-4xl block mb-2">{r.icon}</span>
            <p className="font-semibold text-gray-800">{r.label}</p>
            <p className="text-sm text-gray-500">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
