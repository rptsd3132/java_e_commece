import { Link } from 'react-router-dom'

export default function AdminCouponsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-sm text-blue-800">
        <strong>API Coming Soon:</strong> The coupon management API (<code>/api/admin/coupons</code>) is not yet implemented.
        This page will let you create, edit, and deactivate discount codes.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Planned coupon features</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          {[
            '🎟️ Create percentage or fixed-amount discount codes',
            '📅 Set expiry dates and usage limits',
            '📊 Track how many times each coupon was used',
            '🚫 Deactivate or delete coupons',
            '👤 Restrict coupons to specific users or categories',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
