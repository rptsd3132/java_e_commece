import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useCart } from '../../context/CartContext'

const formatPrice = (p) => `LKR ${Number(p).toLocaleString('en-US')}`

const renderStar = (index, rating) => {
  if (rating >= index + 1)
    return <svg key={index} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
  if (rating >= index + 0.5)
    return <svg key={index} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0v15z" /></svg>
  return <svg key={index} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
}

export default function WishlistPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { incrementCart } = useCart()

  useEffect(() => {
    let cancelled = false
    api.get('/wishlist')
      .then(r => { if (!cancelled) setItems(r.data) })
      .catch(err => console.error('Wishlist fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`)
      setItems(prev => prev.filter(i => (i.productId || i.product?.id) !== productId))
    } catch (err) {
      console.error('Remove from wishlist failed:', err)
    }
  }

  const handleAddToCart = async (productId) => {
    try {
      await api.post('/cart', { productId, quantity: 1 })
      incrementCart()
    } catch (err) {
      console.error('Add to cart failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
                <div className="h-9 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <span className="text-6xl block mb-4">❤️</span>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save items you love and come back to them later.</p>
        <button
          onClick={() => navigate('/products')}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        <span className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {items.map((item) => {
          const product = item.product || item
          const productId = item.productId || product.id
          const primaryImage = product.images?.length > 0 ? product.images[0].url : null
          const rating = product.averageRating || 0
          const reviewCount = product.reviewCount || 0

          return (
            <div key={productId} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <Link to={`/products/${productId}`} className="block relative">
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); handleRemove(productId) }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                  title="Remove from wishlist"
                >
                  <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </Link>
              <div className="p-4 space-y-2">
                <Link to={`/products/${productId}`}>
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-1">
                  {[0,1,2,3,4].map(i => renderStar(i, rating))}
                  <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(productId)}
                    className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleRemove(productId)}
                    className="px-3 py-2 text-sm border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
