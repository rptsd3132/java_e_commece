import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import heroImg from '../../assets/hero.png'

const CATEGORY_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-orange-400 to-orange-600',
  'from-green-400 to-green-600',
  'from-red-400 to-red-600',
  'from-yellow-400 to-yellow-600',
  'from-indigo-400 to-indigo-600',
]

const CATEGORY_EMOJIS = ['🛍️', '👗', '📱', '🏠', '⚽', '📚', '💄', '🎮']

const renderStar = (index, rating) => {
  if (rating >= index + 1)
    return <svg key={index} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
  if (rating >= index + 0.5)
    return <svg key={index} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0v15z" /></svg>
  return <svg key={index} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
}

const formatPrice = (p) => `LKR ${Number(p).toLocaleString('en-US')}`

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingProds, setLoadingProds] = useState(true)

  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { incrementCart } = useCart()

  useEffect(() => {
    api.get('/categories')
      .then(r => setCategories(r.data.slice(0, 8)))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false))

    api.get('/products', { params: { page: 0, size: 8, sort: 'createdAt,desc' } })
      .then(r => setProducts(r.data.content || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProds(false))
  }, [])

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) { navigate('/login'); return }
    try {
      await api.post('/cart', { productId, quantity: 1 })
      incrementCart()
    } catch (err) {
      console.error('Add to cart failed:', err)
    }
  }

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white py-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Discover Amazing<br />Products
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Shop thousands of products at unbeatable prices — delivered to your door.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link
                to="/products"
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-colors shadow-lg"
              >
                Shop Now
              </Link>
              <Link
                to="/register"
                className="px-8 py-3 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors"
              >
                Become a Seller
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img src={heroImg} alt="Shop" className="max-h-72 object-contain drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse Categories</h2>
          {loadingCats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-500">No categories available yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  to="/products"
                  className={`bg-gradient-to-br ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-white hover:scale-105 transition-transform shadow-md`}
                >
                  <span className="text-3xl">{CATEGORY_EMOJIS[i % CATEGORY_EMOJIS.length]}</span>
                  <span className="text-sm font-semibold text-center leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <Link to="/products" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All →
            </Link>
          </div>

          {loadingProds ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-9 bg-gray-200 rounded animate-pulse w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-3">🛒</span>
              <p className="text-gray-500">No products available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => {
                const primaryImage = product.images?.length > 0 ? product.images[0].url : null
                const rating = product.averageRating || 0
                const reviewCount = product.reviewCount || 0
                const storeName = product.seller?.storeName || 'Unknown Store'

                return (
                  <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                    <Link to={`/products/${product.id}`} className="block">
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
                    </Link>
                    <div className="p-4 space-y-2">
                      <Link to={`/products/${product.id}`}>
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1">
                        {[0,1,2,3,4].map(i => renderStar(i, rating))}
                        <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
                      <p className="text-xs text-gray-500">Sold by {storeName}</p>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className="w-full py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-block px-10 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full hover:opacity-90 transition-opacity shadow-lg"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="py-12 bg-gray-50 border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'On orders over LKR 5,000' },
              { icon: '🔒', title: 'Secure Payment', desc: '100% protected transactions' },
              { icon: '🔄', title: 'Easy Returns', desc: 'Within 30 days' },
              { icon: '💬', title: '24/7 Support', desc: 'Always here to help' },
            ].map((b) => (
              <div key={b.title} className="flex flex-col items-center gap-2">
                <span className="text-4xl">{b.icon}</span>
                <p className="font-semibold text-gray-800">{b.title}</p>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SELLER CTA ── */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-3">Start Selling Today</h2>
          <p className="text-white/80 text-lg mb-8">Join thousands of sellers on ShopEasy and grow your business.</p>
          <Link
            to="/register"
            className="inline-block px-10 py-3 bg-white text-orange-600 font-bold rounded-full hover:bg-orange-50 transition-colors shadow-lg"
          >
            Register as Seller
          </Link>
        </div>
      </section>

    </div>
  )
}
