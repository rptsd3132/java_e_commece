// Import React hooks for state management, side effects, and memoization
import { useState, useEffect } from 'react'
// Import useParams to read the product ID from the URL route /products/:id
import { useParams, Link, useNavigate } from 'react-router-dom'
// Import the pre-configured axios instance (baseURL: http://localhost:8080)
import api from '../../api/axiosConfig'
// Import useAuth to check if the user is logged in before cart/wishlist actions
import { useAuth } from '../../context/AuthContext'
// Import useCart to update the navbar cart badge after adding a product
import { useCart } from '../../context/CartContext'

/**
 * ProductDetailPage — displays a single product at route /products/:id
 *
 * Layout:
 *   TOP: 2-column section — Image Gallery (left) + Product Details (right)
 *   MIDDLE: Product Description ("About this product")
 *   BOTTOM: Customer Reviews list
 *
 * API calls:
 *   GET /api/products/{id}         — fetch product details on mount
 *   GET /api/products/{id}/reviews  — fetch customer reviews on mount
 *   POST /api/cart                  — add to cart (requires auth)
 *   POST /api/wishlist              — add to wishlist (requires auth)
 *   DELETE /api/wishlist/{id}       — remove from wishlist (requires auth)
 */
export default function ProductDetailPage() {
  // ==================== STATE VARIABLES ====================

  // Product object returned from GET /api/products/{id}
  // Contains: id, name, description, price, images, averageRating, reviewCount, stockQuantity, seller, category, etc.
  const [product, setProduct] = useState(null)

  // Boolean flag to show skeleton loaders while the product API call is in flight
  const [loadingProduct, setLoadingProduct] = useState(true)

  // Boolean flag to show skeleton loaders while the reviews API call is in flight
  const [loadingReviews, setLoadingReviews] = useState(true)

  // Error state: set to true if the product API returns 404 (product not found)
  const [notFound, setNotFound] = useState(false)

  // Array of review objects returned from GET /api/products/{id}/reviews
  // Each review: { id, user, rating, comment, createdAt }
  const [reviews, setReviews] = useState([])

  // URL of the currently displayed main image in the gallery
  // Updated when the user clicks a thumbnail
  const [mainImage, setMainImage] = useState('')

  // Quantity selected by the user for "Add to Cart"
  // Starts at 1, clamped between 1 and stockQuantity
  const [quantity, setQuantity] = useState(1)

  // Whether the product is already in the user's wishlist
  // Toggles the heart icon between filled and outline
  const [inWishlist, setInWishlist] = useState(false)

  // Green success message shown briefly after adding to cart
  // Cleared after 2 seconds via setTimeout
  const [cartSuccess, setCartSuccess] = useState('')

  // Red error message shown when add-to-cart fails
  // Cleared after 3 seconds
  const [cartError, setCartError] = useState('')

  // ==================== HOOKS ====================

  // Extract the product ID from the URL (e.g. /products/42 → id = "42")
  const { id } = useParams()

  // useNavigate lets us redirect the user (e.g. to /login if not authenticated)
  const navigate = useNavigate()

  // Get authentication state to gate cart and wishlist actions
  const { isLoggedIn } = useAuth()

  // Get incrementCart to bump the navbar cart count after a successful add
  const { incrementCart } = useCart()

  // ==================== DATA FETCHING ====================

  // Fetch product details when the component mounts or the URL id changes
  // GET /api/products/{id} — public endpoint, no auth required
  useEffect(() => {
    async function fetchProduct() {
      setLoadingProduct(true)
      setNotFound(false)
      try {
        // GET /api/products/{id} — returns a single product object
        const response = await api.get(`/products/${id}`)
        setProduct(response.data)

        // Set the main image to the first product image (or empty string if none)
        if (response.data.images && response.data.images.length > 0) {
          setMainImage(response.data.images[0].url)
        } else {
          setMainImage('')
        }
      } catch (error) {
        // If the server returns 404, the product does not exist
        if (error.response && error.response.status === 404) {
          setNotFound(true)
        } else {
          console.error('Failed to fetch product:', error)
        }
      } finally {
        // Hide the skeleton loader regardless of success or failure
        setLoadingProduct(false)
      }
    }

    fetchProduct()
  }, [id]) // Re-fetch if the URL product ID changes

  // Fetch customer reviews when the component mounts or the URL id changes
  // GET /api/products/{id}/reviews — public endpoint, no auth required
  useEffect(() => {
    async function fetchReviews() {
      setLoadingReviews(true)
      try {
        // GET /api/products/{id}/reviews — returns an array of review objects
        const response = await api.get(`/products/${id}/reviews`)
        setReviews(response.data)
      } catch (error) {
        // Reviews fetch failure is non-critical — log and show empty state
        console.error('Failed to fetch reviews:', error)
        setReviews([])
      } finally {
        setLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [id]) // Re-fetch if the URL product ID changes

  // Check if the product is already in the user's wishlist on mount (only if logged in)
  useEffect(() => {
    async function checkWishlist() {
      if (!isLoggedIn || !product) return
      try {
        // GET /api/wishlist — returns the logged-in user's wishlist items
        const response = await api.get('/wishlist')
        // Check if any wishlist item matches the current product ID
        const exists = response.data.some(
          (item) => (item.productId || item.product?.id) === product.id
        )
        setInWishlist(exists)
      } catch (error) {
        // Wishlist check failure is non-critical
        console.error('Failed to check wishlist:', error)
      }
    }

    checkWishlist()
  }, [isLoggedIn, product]) // Re-run when login state or product data changes

  // ==================== EVENT HANDLERS ====================

  // Called when the user clicks the "Add to Cart" button
  // If not logged in: redirect to /login
  // If logged in: POST /api/cart with productId and quantity
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      // User must be logged in to add items to cart
      navigate('/login')
      return
    }

    // Clear any previous messages
    setCartSuccess('')
    setCartError('')

    try {
      // POST /api/cart — add the selected quantity to the user's cart
      // Request body: { productId, quantity }
      await api.post('/cart', { productId: product.id, quantity })
      // Update the navbar cart badge
      incrementCart()
      // Show green success message
      setCartSuccess('Added to cart! ✓')
      // Clear the success message after 2 seconds
      setTimeout(() => setCartSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      // Show red error message
      setCartError('Failed to add to cart. Please try again.')
      // Clear the error message after 3 seconds
      setTimeout(() => setCartError(''), 3000)
    }
  }

  // Called when the user clicks the heart icon to toggle wishlist status
  // If in wishlist: DELETE /api/wishlist/{productId}
  // If not in wishlist: POST /api/wishlist with productId
  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      // User must be logged in to manage their wishlist
      navigate('/login')
      return
    }

    try {
      if (inWishlist) {
        // DELETE /api/wishlist/{productId} — remove from wishlist
        await api.delete(`/wishlist/${product.id}`)
        setInWishlist(false)
      } else {
        // POST /api/wishlist — add to wishlist
        await api.post('/wishlist', { productId: product.id })
        setInWishlist(true)
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
    }
  }

  // ==================== RENDER HELPERS ====================

  // Renders a star display based on a rating value (0 to 5)
  // Returns a string of filled (★) and empty (☆) stars
  // Handles half-star logic: 3.7 → ★★★☆☆ with a note
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalf = rating - fullStars >= 0.5
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

    return (
      <span className="inline-flex items-center gap-0.5">
        {/* Filled stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400 text-lg">★</span>
        ))}
        {/* Half star — rendered as a special character */}
        {hasHalf && (
          <span className="text-yellow-400 text-lg">★</span>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-lg">★</span>
        ))}
      </span>
    )
  }

  // Format a number as Sri Lankan Rupees: "LKR 125,000"
  const formatPrice = (price) => {
    return `LKR ${Number(price).toLocaleString('en-US')}`
  }

  // Get user initials from a name string for the avatar display
  // "John Doe" → "JD", "Alice" → "A"
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }

  // Format a date string into a readable format: "Jan 15, 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // ==================== LOADING STATE ====================

  // Show skeleton placeholders while the product data is being fetched
  if (loadingProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top section skeleton — 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left column: image gallery skeleton */}
          <div className="space-y-4">
            {/* Main image skeleton — grey box with animate-pulse */}
            <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse" />
            {/* Thumbnail skeletons — 4 small grey boxes */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Right column: product details skeleton */}
          <div className="space-y-4">
            {/* Breadcrumb skeleton */}
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            {/* Product name skeleton */}
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            {/* Rating skeleton */}
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            {/* Price skeleton */}
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            {/* Stock badge skeleton */}
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            {/* Seller skeleton */}
            <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
            {/* Quantity selector skeleton */}
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            {/* Add to Cart button skeleton */}
            <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
            {/* Wishlist button skeleton */}
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Description skeleton */}
        <div className="space-y-3 mb-12">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Reviews skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ==================== NOT FOUND STATE ====================

  // Show error message if the product API returned 404
  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl mb-4 block">😕</span>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Product not found</h1>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link
          to="/products"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  // ==================== MAIN RENDER ====================

  // Guard against null product (should not happen after loading, but safe to have)
  if (!product) return null

  // Build the category breadcrumb string from nested categories
  // e.g. "Electronics > Smartphones" or just "Electronics" if no subcategory
  const buildBreadcrumb = (category) => {
    if (!category) return 'Uncategorized'
    if (category.parent) {
      return `${category.parent.name} > ${category.name}`
    }
    return category.name
  }

  // Determine stock status and badge styling
  const stockQuantity = product.stockQuantity || 0
  let stockBadge = null
  if (stockQuantity === 0) {
    stockBadge = { text: 'Out of Stock', className: 'bg-red-100 text-red-700' }
  } else if (stockQuantity <= 10) {
    stockBadge = { text: `Only ${stockQuantity} left!`, className: 'bg-orange-100 text-orange-700' }
  } else {
    stockBadge = { text: 'In Stock', className: 'bg-green-100 text-green-700' }
  }

  // Get all thumbnail images from the product (up to 4)
  const thumbnails = product.images ? product.images.slice(0, 4) : []

  // Get the seller's store name for display
  const storeName = product.seller?.storeName || 'Unknown Store'
  const sellerId = product.seller?.id

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ==================== TOP SECTION — PRODUCT INFO (2 COLUMNS) ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

        {/* ----- LEFT COLUMN — IMAGE GALLERY ----- */}
        <div className="space-y-4">
          {/* Main large image — 400px tall, object-cover, rounded corners */}
          <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              /* Grey placeholder with camera icon when no images exist */
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                <span className="text-6xl mb-2">📷</span>
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>

          {/* Row of thumbnail images — clicking one updates the mainImage state */}
          {thumbnails.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {thumbnails.map((img, index) => (
                <button
                  key={img.id || index}
                  onClick={() => setMainImage(img.url)}
                  className={`h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    mainImage === img.url
                      ? 'border-blue-500'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ----- RIGHT COLUMN — PRODUCT DETAILS ----- */}
        <div className="space-y-4">
          {/* Category breadcrumb — shows the product's category path */}
          <p className="text-sm text-gray-500">
            {buildBreadcrumb(product.category)}
          </p>

          {/* Product name — large and bold */}
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* Star rating display: filled/empty stars + numeric rating + review count */}
          <div className="flex items-center gap-2">
            {renderStars(product.averageRating || 0)}
            <span className="text-sm text-gray-600">
              {product.averageRating?.toFixed(1) || '0.0'} ({product.reviewCount || 0} reviews)
            </span>
          </div>

          {/* Price displayed in large green text: "LKR 125,000" */}
          <p className="text-3xl text-green-600 font-bold">{formatPrice(product.price)}</p>

          {/* Stock status badge — color-coded based on stock quantity */}
          <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${stockBadge.className}`}>
            {stockBadge.text}
          </span>

          {/* Seller information — links to the seller's product listing page */}
          <p className="text-sm text-gray-600">
            Sold by:{' '}
            {sellerId ? (
              <Link to={`/products?sellerId=${sellerId}`} className="text-blue-600 hover:underline">
                {storeName}
              </Link>
            ) : (
              <span className="text-gray-700">{storeName}</span>
            )}
          </p>

          {/* Quantity selector — decrement/increment buttons with current value */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            {/* Decrease button — disabled at minimum (1) or out of stock */}
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || stockQuantity === 0}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            {/* Current quantity display */}
            <span className="w-10 text-center font-medium">{quantity}</span>
            {/* Increase button — disabled at max stock or out of stock */}
            <button
              onClick={() => setQuantity((q) => Math.min(stockQuantity, q + 1))}
              disabled={quantity >= stockQuantity || stockQuantity === 0}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>

          {/* Add to Cart button — full width, blue */}
          <button
            onClick={handleAddToCart}
            disabled={stockQuantity === 0}
            className="w-full py-3 text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* Success message — green text shown for 2 seconds after adding to cart */}
          {cartSuccess && (
            <p className="text-sm text-green-600 font-medium text-center">{cartSuccess}</p>
          )}

          {/* Error message — red text shown for 3 seconds on cart failure */}
          {cartError && (
            <p className="text-sm text-red-600 font-medium text-center">{cartError}</p>
          )}

          {/* Add to Wishlist button — heart icon toggles between outline and filled */}
          <button
            onClick={handleToggleWishlist}
            className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition-colors ${
              inWishlist
                ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {/* Heart SVG — filled if in wishlist, outline if not */}
            <svg
              className="w-5 h-5"
              fill={inWishlist ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
          </button>
        </div>
      </div>

      {/* ==================== MIDDLE SECTION — PRODUCT DESCRIPTION ==================== */}
      <div className="mb-12">
        {/* "About this product" heading */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">About this product</h2>
        {/* Product description displayed as a paragraph */}
        <p className="text-gray-700 leading-relaxed">
          {product.description || 'No description available.'}
        </p>
      </div>

      {/* ==================== BOTTOM SECTION — CUSTOMER REVIEWS ==================== */}
      <div>
        {/* Reviews heading with average star rating and total review count */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">Customer Reviews</h2>
        <div className="flex items-center gap-2 mb-6">
          {renderStars(product.averageRating || 0)}
          <span className="text-sm text-gray-500">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Loading state for reviews section */}
        {loadingReviews ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* Empty state: no reviews yet */
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl mb-3 block">💬</span>
            <p className="font-medium">No reviews yet.</p>
            <p className="text-sm mt-1">Be the first to review after purchase!</p>
          </div>
        ) : (
          /* List of review cards */
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                {/* Reviewer info: avatar initials, name, date */}
                <div className="flex items-center gap-3 mb-2">
                  {/* User initials avatar — colored circle with initials */}
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {getInitials(review.user?.name || review.userName || 'Anonymous')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {review.user?.name || review.userName || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                {/* Review star rating */}
                <div className="flex items-center gap-1 mb-2">
                  {renderStars(review.rating || 0)}
                </div>

                {/* Review comment text */}
                <p className="text-sm text-gray-700 leading-relaxed">
                  {review.comment || review.content || ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
