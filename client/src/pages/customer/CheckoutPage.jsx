import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const STEPS = [
  { num: 1, label: 'Address' },
  { num: 2, label: 'Review' },
  { num: 3, label: 'Done' },
]

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [orderId, setOrderId] = useState(null)

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress] = useState({ label: '', street: '', city: '', state: '', zipCode: '', country: 'Sri Lanka' })

  const [cart, setCart] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [placing, setPlacing] = useState(false)

  const navigate = useNavigate()
  const { user } = useAuth()
  const { setCartCount } = useCart()

  const formatPrice = (price) => `LKR ${Number(price).toLocaleString('en-US')}`

  useEffect(() => {
    if (step === 1) {
      api.get('/addresses').then((res) => {
        setAddresses(res.data)
        const def = res.data.find((a) => a.isDefault)
        if (def) setSelectedAddressId(def.id)
      }).catch((err) => console.error('Failed to fetch addresses:', err))
    }
  }, [step])

  useEffect(() => {
    if (step === 2) {
      api.get('/cart').then((res) => {
        setCart(res.data)
      }).catch((err) => console.error('Failed to fetch cart:', err))
    }
  }, [step])

  const handleAddAddress = useCallback(async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/addresses', newAddress)
      setAddresses((prev) => [...prev, res.data])
      setSelectedAddressId(res.data.id)
      setShowAddForm(false)
      setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: 'Sri Lanka' })
    } catch (err) {
      console.error('Failed to add address:', err)
    }
  }, [newAddress])

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setAppliedCoupon(null)
    try {
      const res = await api.get(`/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&cartTotal=${cart?.subtotal || 0}`)
      setAppliedCoupon(res.data)
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code')
    } finally {
      setCouponLoading(false)
    }
  }, [couponCode, cart])

  const handlePlaceOrder = useCallback(async () => {
    setPlacing(true)
    try {
      const body = { addressId: selectedAddressId }
      if (appliedCoupon) body.couponCode = couponCode.trim()
      const res = await api.post('/orders', body)
      setOrderId(res.data.id)
      setCartCount(0)
      setStep(3)
    } catch (err) {
      console.error('Failed to place order:', err)
    } finally {
      setPlacing(false)
    }
  }, [selectedAddressId, appliedCoupon, couponCode, setCartCount])

  const discount = appliedCoupon
    ? (appliedCoupon.discountType === 'PERCENT'
        ? Number(cart?.subtotal || 0) * (Number(appliedCoupon.discountValue) / 100)
        : Number(appliedCoupon.discountValue))
    : 0

  const total = (Number(cart?.subtotal || 0) - discount)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s.num ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-sm font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 mx-3 ${step > s.num ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Select Address */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Shipping Address</h2>

          <div className="space-y-3">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === addr.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1 accent-green-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {addr.label || 'Address'}
                      {addr.isDefault && <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">Default</span>}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                    <p className="text-sm text-gray-500">{addr.country}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {showAddForm ? (
            <form onSubmit={handleAddAddress} className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Label (e.g. Home)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress((p) => ({ ...p, label: e.target.value }))}
                  className="col-span-2 p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Street *"
                  required
                  value={newAddress.street}
                  onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))}
                  className="col-span-2 p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="City *"
                  required
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                  className="p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="State *"
                  required
                  value={newAddress.state}
                  onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                  className="p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Zip Code *"
                  required
                  value={newAddress.zipCode}
                  onChange={(e) => setNewAddress((p) => ({ ...p, zipCode: e.target.value }))}
                  className="p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={newAddress.country}
                  onChange={(e) => setNewAddress((p) => ({ ...p, country: e.target.value }))}
                  className="p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  Save Address
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              + Add New Address
            </button>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedAddressId}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Review Order */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Review Your Order</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Cart Items */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Items ({cart?.totalItems || 0})</h3>
                <div className="divide-y divide-gray-100">
                  {cart?.items?.map((item) => (
                    <div key={item.cartItemId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <img
                        src={item.productImageUrl || '/placeholder.png'}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatPrice(item.lineTotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Address */}
              {(() => {
                const addr = addresses.find((a) => a.id === selectedAddressId)
                if (!addr) return null
                return (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">Delivering To</h3>
                    <p className="text-sm text-gray-600">
                      {addr.label && <span className="font-medium">{addr.label}: </span>}
                      {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                    </p>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-green-600 hover:text-green-700 mt-1 font-medium"
                    >
                      Change
                    </button>
                  </div>
                )
              })()}
            </div>

            <div className="space-y-4">
              {/* Coupon */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Coupon Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Discount: -{formatPrice(discount)}
                  </p>
                )}
                {couponError && (
                  <p className="text-sm text-red-500 mt-2">{couponError}</p>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-3">Order Total</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(cart?.subtotal || 0)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50"
                >
                  {placing ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Order Confirmed */}
      {step === 3 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{orderId} Confirmed!</h1>
          <p className="text-gray-600 mb-8">Your order has been placed successfully.</p>
          <button
            onClick={() => navigate('/customer/orders')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            View My Orders
          </button>
        </div>
      )}
    </div>
  )
}
