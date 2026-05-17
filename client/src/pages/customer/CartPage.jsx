import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export default function CartPage() {
  const [items, setItems] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const { user } = useAuth()
  const { setCartCount } = useCart()

  useEffect(() => {
    async function fetchCart() {
      setLoading(true)
      try {
        const res = await api.get('/cart')
        setItems(res.data.items)
        setSubtotal(res.data.subtotal)
        setCartCount(res.data.totalItems)
      } catch (err) {
        console.error('Failed to fetch cart:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCart()
  }, [setCartCount])

  const recalcSubtotal = (updatedItems) => {
    const total = updatedItems.reduce((sum, item) => sum + Number(item.lineTotal), 0)
    setSubtotal(total)
    setCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0))
  }

  const handleDecrement = async (item) => {
    if (item.quantity === 1) {
      const confirmed = window.confirm('Remove item?')
      if (!confirmed) return
      await performRemove(item.cartItemId)
      return
    }
    await performUpdateQuantity(item.cartItemId, item.quantity - 1)
  }

  const handleIncrement = async (item) => {
    await performUpdateQuantity(item.cartItemId, item.quantity + 1)
  }

  const performUpdateQuantity = async (cartItemId, newQuantity) => {
    const prevItems = [...items]
    const optimisticItems = items.map((it) =>
      it.cartItemId === cartItemId
        ? { ...it, quantity: newQuantity, lineTotal: Number(it.unitPrice) * newQuantity }
        : it
    )
    setItems(optimisticItems)
    recalcSubtotal(optimisticItems)

    try {
      const res = await api.put(`/cart/${cartItemId}`, { quantity: newQuantity })
      setItems((prev) =>
        prev.map((it) =>
          it.cartItemId === cartItemId
            ? { ...it, quantity: res.data.quantity, lineTotal: res.data.lineTotal }
            : it
        )
      )
      recalcSubtotal(items.map((it) =>
        it.cartItemId === cartItemId
          ? { ...it, quantity: res.data.quantity, lineTotal: res.data.lineTotal }
          : it
      ))
    } catch (err) {
      console.error('Failed to update quantity:', err)
      setItems(prevItems)
      recalcSubtotal(prevItems)
    }
  }

  const performRemove = async (cartItemId) => {
    const prevItems = [...items]
    const updatedItems = items.filter((it) => it.cartItemId !== cartItemId)
    setItems(updatedItems)
    recalcSubtotal(updatedItems)

    try {
      await api.delete(`/cart/${cartItemId}`)
    } catch (err) {
      console.error('Failed to remove item:', err)
      setItems(prevItems)
      recalcSubtotal(prevItems)
    }
  }

  const formatPrice = (price) => {
    return `LKR ${Number(price).toLocaleString('en-US')}`
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="flex gap-8">
          <div className="w-2/3 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="w-1/3">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl mb-4 block">🛒</span>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you have not added anything yet.</p>
        <Link
          to="/products"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Shop Now
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        <div className="w-2/3">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Shopping Cart ({items.length} item{items.length !== 1 ? 's' : ''})
          </h1>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.cartItemId}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
              >
                <img
                  src={item.productImageUrl || '/placeholder.png'}
                  alt={item.productName}
                  className="w-12 h-12 object-cover rounded flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.productName}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatPrice(item.unitPrice)}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDecrement(item)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleIncrement(item)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    +
                  </button>
                </div>

                <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                  {formatPrice(item.lineTotal)}
                </p>

                <button
                  onClick={() => performRemove(item.cartItemId)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Remove item"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/3">
          {/* Optimistic UI: update state first, then call API */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
