import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}

const STATUS_LIFECYCLE = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

export default function CustomerOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get(`/orders/${id}`),
      api.get(`/orders/${id}/timeline`),
    ])
      .then(([orderRes, timelineRes]) => {
        if (cancelled) return
        setOrder(orderRes.data)
        setTimeline(timelineRes.data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const formatPrice = (price) => `LKR ${Number(price).toLocaleString('en-US')}`

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const getStepStatus = (stepStatus) => {
    if (!order) return 'future'
    const stepIdx = STATUS_LIFECYCLE.indexOf(stepStatus)
    const currentIdx = STATUS_LIFECYCLE.indexOf(order.status)

    if (currentIdx === -1) {
      const hasEntry = timeline.some(t => t.status === stepStatus)
      return hasEntry ? 'completed' : 'future'
    }

    if (stepIdx < currentIdx) return 'completed'
    if (stepIdx === currentIdx) return 'current'
    return 'future'
  }

  const getTimelineEntry = (stepStatus) => timeline.find(t => t.status === stepStatus)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl mb-4 block">🔍</span>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't find this order. It may have been removed or you don't have access.</p>
        <button
          onClick={() => navigate('/customer/orders')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Back to My Orders
        </button>
      </div>
    )
  }

  const isTerminal = order.status === 'CANCELLED' || order.status === 'REFUNDED'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/customer/orders')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        &larr; Back to My Orders
      </button>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
          {order.status}
        </span>
        <span className="text-sm text-gray-500">Placed on {formatDate(order.placedAt)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <img
                    src={item.productImageUrl || '/placeholder.png'}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.quantity} &times; {formatPrice(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Order Total</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && order.couponCode && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({order.couponCode})</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.shipStreet}</p>
              <p>{order.shipCity}, {order.shipState} {order.shipZip}</p>
              <p>{order.shipCountry}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Timeline</h2>
            <div className="space-y-0">
              {STATUS_LIFECYCLE.map((status, idx) => {
                const stepStatus = getStepStatus(status)
                const entry = getTimelineEntry(status)
                const isLast = idx === STATUS_LIFECYCLE.length - 1
                return (
                  <div key={status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        stepStatus === 'completed' ? 'bg-green-500' : ''
                      } ${
                        stepStatus === 'current' ? 'bg-blue-500 animate-pulse' : ''
                      } ${
                        stepStatus === 'future' ? 'border-2 border-gray-300 bg-white' : ''
                      }`}>
                        {stepStatus === 'completed' && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-8 ${
                          stepStatus === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                    <div className="pb-6 flex-1">
                      <p className={`text-sm font-semibold ${
                        stepStatus === 'future' ? 'text-gray-400' : stepStatus === 'current' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </p>
                      {entry && (
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(entry.changedAt)}</p>
                      )}
                      {entry?.note && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{entry.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}

              {isTerminal && (() => {
                const terminalEntry = timeline.find(t => t.status === order.status)
                return (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                    <div className="pb-6 flex-1">
                      <p className="text-sm font-semibold text-red-600">
                        {order.status === 'CANCELLED' ? 'Cancelled' : 'Refunded'}
                      </p>
                      {terminalEntry && (
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(terminalEntry.changedAt)}</p>
                      )}
                      {terminalEntry?.note && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{terminalEntry.note}</p>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
