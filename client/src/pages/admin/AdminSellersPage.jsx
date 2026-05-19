import { Link } from 'react-router-dom'

export default function AdminSellersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>
        <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-sm text-blue-800">
        <strong>API Coming Soon:</strong> The seller management API (<code>/api/admin/sellers</code>) is not yet implemented.
        This page will list all sellers, show their store details, revenue, and allow approving or suspending accounts.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">What this page will include</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          {[
            '📋 List of all seller accounts with store name and registration date',
            '💰 Revenue summary per seller',
            '✅ Approve or reject new seller applications',
            '🚫 Suspend / reinstate seller accounts',
            '📊 View products listed by each seller',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
