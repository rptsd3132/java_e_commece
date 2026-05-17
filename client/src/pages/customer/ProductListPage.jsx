// Import React hooks for state management, side effects, memoization, and refs
import { useState, useEffect, useCallback, useRef } from 'react'
// Import Link and useNavigate from react-router-dom for navigation
import { Link, useNavigate } from 'react-router-dom'
// Import the pre-configured axios instance (baseURL: http://localhost:8080/api)
import api from '../../api/axios'
// Import useAuth to check if the user is logged in and access user data
import { useAuth } from '../../context/AuthContext'
// Import useCart to update the cart count after adding an item
import { useCart } from '../../context/CartContext'

/**
 * ProductListPage — the main shopping page at route /products
 *
 * Layout:
 *   LEFT SIDEBAR (w-64, sticky): Search, Categories, Price Range
 *   MAIN CONTENT (flex-1): Results count, Sort, Product grid, Pagination
 *
 * API calls:
 *   GET /api/products?search=&categoryId=&minPrice=&maxPrice=&page=0&size=12&sort=createdAt,desc
 *   GET /api/categories (on mount, for sidebar category list)
 *   POST /api/cart (add to cart, requires auth)
 *   POST /api/wishlist (add to wishlist, requires auth)
 *   DELETE /api/wishlist/{productId} (remove from wishlist, requires auth)
 */
export default function ProductListPage() {
  // ==================== STATE VARIABLES ====================

  // Array of product objects returned from the API
  // Each product contains: id, name, price, images, averageRating, reviewCount, seller, etc.
  const [products, setProducts] = useState([])

  // Boolean flag to show skeleton loaders while the products API call is in flight
  const [loading, setLoading] = useState(true)

  // Total number of pages available from the API (used for pagination buttons)
  const [totalPages, setTotalPages] = useState(0)

  // Total number of products matching the current filters (used for "Showing X products" text)
  const [totalElements, setTotalElements] = useState(0)

  // Current page number (0-indexed, matching Spring Data's page numbering)
  const [currentPage, setCurrentPage] = useState(0)

  // Current search query text typed by the user in the search bar
  const [search, setSearch] = useState('')

  // ID of the category the user has selected in the sidebar (null means no filter)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  // Minimum price value for the price range filter
  const [minPrice, setMinPrice] = useState('')

  // Maximum price value for the price range filter
  const [maxPrice, setMaxPrice] = useState('')

  // Sort option selected by the user: 'newest' | 'priceAsc' | 'priceDesc'
  const [sortBy, setSortBy] = useState('newest')

  // Array of category objects fetched on mount for the sidebar category tree
  // Each category: { id, name, children: [...] }
  const [categories, setCategories] = useState([])

  // Set of product IDs that the user has added to their wishlist
  // Used to toggle the heart icon between filled and empty
  const [wishlistIds, setWishlistIds] = useState(new Set())

  // ==================== HOOKS ====================

  // useNavigate lets us programmatically redirect the user (e.g. to /login)
  const navigate = useNavigate()

  // Get authentication state to decide whether to show "Add to Cart" or redirect to login
  const { isLoggedIn } = useAuth()

  // Get incrementCart to update the cart badge count in the navbar after adding an item
  const { incrementCart } = useCart()

  // ==================== DATA FETCHING ====================

  // useRef stores the AbortController to cancel in-flight requests when filters change
  // This prevents race conditions where an older request resolves after a newer one
  const abortControllerRef = useRef(null)

  // useEffect runs the product fetch whenever any filter or pagination value changes
  // This ensures the product list is always in sync with the current filters
  // The effect fetches from GET /api/products with the current filter parameters
  useEffect(() => {
    // Cancel any previous in-flight request to avoid race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create a new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Async function to fetch products from the API
    async function fetchProducts() {
      // Show skeleton loaders while we wait for the API response
      setLoading(true)
      try {
        // Build the query parameters object — only include non-empty values
        const params = {
          page: currentPage,       // 0-indexed page number
          size: 12,                // 12 products per page (matches grid skeleton count)
        }

        // Add search query if the user has typed something
        if (search) params.search = search

        // Add category filter if a category is selected
        if (selectedCategoryId) params.categoryId = selectedCategoryId

        // Add minimum price filter if the user entered a value
        if (minPrice !== '') params.minPrice = minPrice

        // Add maximum price filter if the user entered a value
        if (maxPrice !== '') params.maxPrice = maxPrice

        // Map the sortBy state to the Spring Data sort parameter format
        // 'newest' → createdAt,desc | 'priceAsc' → price,asc | 'priceDesc' → price,desc
        if (sortBy === 'newest') {
          params.sort = 'createdAt,desc'
        } else if (sortBy === 'priceAsc') {
          params.sort = 'price,asc'
        } else if (sortBy === 'priceDesc') {
          params.sort = 'price,desc'
        }

        // GET /api/products?search=&categoryId=&minPrice=&maxPrice=&page=0&size=12&sort=createdAt,desc
        // Response: { content: [...products], totalPages: N, totalElements: N, number: 0 }
        const response = await api.get('/products', {
          params,
          signal: abortController.signal, // Attach abort signal for cancellation
        })

        // Only update state if this request hasn't been aborted
        if (!abortController.signal.aborted) {
          setProducts(response.data.content)
          setTotalPages(response.data.totalPages)
          setTotalElements(response.data.totalElements)
        }
      } catch (error) {
        // Ignore aborted requests — they are expected when filters change rapidly
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          console.error('Failed to fetch products:', error)
          // Only update state if this request hasn't been aborted
          if (!abortController.signal.aborted) {
            setProducts([])
            setTotalElements(0)
          }
        }
      } finally {
        // Hide skeleton loaders whether the call succeeded or failed
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    // Cleanup function: abort the request if the component unmounts or filters change
    return () => {
      abortController.abort()
    }
  }, [currentPage, search, selectedCategoryId, minPrice, maxPrice, sortBy])

  // Fetch the category tree once when the component mounts
  // GET /api/categories — returns a flat or nested list of top-level categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        // GET /api/categories — no auth needed, public endpoint
        const response = await api.get('/categories')
        setCategories(response.data)
      } catch (error) {
        // If categories fail to load, the sidebar simply won't show any categories
        console.error('Failed to fetch categories:', error)
        setCategories([])
      }
    }
    fetchCategories()
  }, []) // Empty dependency array — only runs once on mount

  // Fetch the user's wishlist IDs on mount (only if logged in)
  // This lets us show filled heart icons for products already in the wishlist
  useEffect(() => {
    async function fetchWishlist() {
      if (!isLoggedIn) return
      try {
        // GET /api/wishlist — returns the logged-in user's wishlist items
        const response = await api.get('/wishlist')
        // Extract product IDs into a Set for fast O(1) lookups
        const ids = new Set(response.data.map((item) => item.productId || item.product?.id))
        setWishlistIds(ids)
      } catch (error) {
        // Wishlist fetch failure is non-critical — just log it
        console.error('Failed to fetch wishlist:', error)
      }
    }
    fetchWishlist()
  }, [isLoggedIn]) // Re-run if login state changes

  // ==================== DEBOUNCE: SEARCH INPUT ====================

  // useRef stores the debounce timer ID across renders without triggering re-renders
  // Using a ref instead of a variable ensures the timer persists between renders
  const searchTimerRef = useRef(null)

  // useCallback creates a stable reference to the debounced search handler
  // Debounce means we wait 500ms after user stops typing before calling the API
  // This prevents excessive API calls while the user is still typing
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value
      // Update the search state immediately so the input feels responsive
      setSearch(value)

      // Clear any existing timer so we don't fire an outdated search
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }

      // Start a new 500ms timer — the API call only fires after the user pauses typing
      searchTimerRef.current = setTimeout(() => {
        // Reset to page 0 when the search query changes (new results start from page 1)
        setCurrentPage(0)
      }, 500)
    },
    [] // No dependencies — this function is stable across renders
  )

  // Clean up the debounce timer when the component unmounts
  // This prevents a state update on an unmounted component (React warning)
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])

  // ==================== EVENT HANDLERS ====================

  // Called when the user clicks a category in the sidebar
  // Sets the selected category and resets to page 0 for fresh results
  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setCurrentPage(0) // Reset to first page when changing category filter
  }

  // Called when the user clicks the "Apply" button in the Price Range section
  // Triggers a product re-fetch with the new min/max price values (via useEffect)
  // and resets to page 0
  const handleApplyPrice = () => {
    setCurrentPage(0) // Reset to first page when applying price filter
    // The useEffect watching minPrice/maxPrice will automatically trigger fetchProducts
  }

  // Called when the user clicks "Clear Filters" in the empty state
  // Resets all filter values back to their defaults
  const handleClearFilters = () => {
    setSearch('')
    setSelectedCategoryId(null)
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
    setCurrentPage(0)
  }

  // Called when the user clicks "Add to Cart" on a product
  // If logged in: POST /api/cart with the product ID
  // If not logged in: redirect to /login page
  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) {
      // User must be logged in to add items to cart
      navigate('/login')
      return
    }
    try {
      // POST /api/cart — add one unit of the product to the user's cart
      // Request body: { productId, quantity }
      await api.post('/cart', { productId, quantity: 1 })
      // Update the cart badge count in the navbar
      incrementCart()
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  // Called when the user clicks the heart icon to toggle wishlist status
  // If the product is already in the wishlist: DELETE /api/wishlist/{productId}
  // If the product is NOT in the wishlist: POST /api/wishlist with the product ID
  const handleToggleWishlist = async (productId) => {
    if (!isLoggedIn) {
      // User must be logged in to manage their wishlist
      navigate('/login')
      return
    }
    try {
      const isInWishlist = wishlistIds.has(productId)
      if (isInWishlist) {
        // DELETE /api/wishlist/{productId} — remove the product from the wishlist
        await api.delete(`/wishlist/${productId}`)
        // Remove the product ID from the local Set so the heart icon updates immediately
        setWishlistIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      } else {
        // POST /api/wishlist — add the product to the wishlist
        await api.post('/wishlist', { productId })
        // Add the product ID to the local Set so the heart icon fills immediately
        setWishlistIds((prev) => new Set(prev).add(productId))
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
    }
  }

  // ==================== RENDER HELPERS ====================

  // Renders a single category item with its subcategories (recursive for nested children)
  // Categories are shown indented if they have a parent, selected ones get a blue background
  const renderCategoryItem = (category, depth = 0) => {
    const isSelected = selectedCategoryId === category.id
    return (
      <div key={category.id}>
        {/* Category name — clickable to filter products by this category */}
        <button
          onClick={() => handleCategoryClick(category.id)}
          className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          {category.name}
        </button>
        {/* Recursively render subcategories if this category has children */}
        {category.children &&
          category.children.map((child) => renderCategoryItem(child, depth + 1))}
      </div>
    )
  }

  // Renders a single star — filled (yellow) if the index is below the rating, empty (gray) otherwise
  // Uses half-star logic: if rating is 3.7, stars 0-2 are full, star 3 is half, stars 4+ are empty
  const renderStar = (index, rating) => {
    if (rating >= index + 1) {
      // Full star — the rating is at least this index + 1
      return (
        <svg key={index} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      )
    } else if (rating >= index + 0.5) {
      // Half star — the rating is between index+0.5 and index+1
      return (
        <svg key={index} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0v15z" />
        </svg>
      )
    } else {
      // Empty star — the rating is below this index
      return (
        <svg key={index} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      )
    }
  }

  // Format a number as Sri Lankan Rupees: "LKR 12,500"
  // Uses Intl.NumberFormat for proper comma separation
  const formatPrice = (price) => {
    return `LKR ${Number(price).toLocaleString('en-US')}`
  }

  // ==================== PAGINATION HELPER ====================

  // Generates an array of page numbers to display (max 5 visible at a time)
  // Uses a sliding window centered on the current page
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    // Calculate the start of the window — center on currentPage but clamp to valid range
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2))
    // Calculate the end of the window — don't exceed totalPages
    const end = Math.min(start + maxVisible, totalPages)
    // Adjust start backwards if we're near the end so we always show maxVisible pages
    start = Math.max(0, end - maxVisible)

    for (let i = start; i < end; i++) {
      pages.push(i)
    }
    return pages
  }

  // ==================== RENDER ====================

  return (
    // Main container: flex row with sidebar on the left and content on the right
    <div className="flex gap-6">
      {/* ==================== LEFT SIDEBAR ==================== */}
      {/* Sticky sidebar — stays visible while scrolling the product list */}
      <aside className="w-64 flex-shrink-0 sticky top-4 self-start">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-6">
          {/* --- Search Bar --- */}
          <div>
            <label htmlFor="product-search" className="block text-sm font-semibold text-gray-800 mb-2">
              Search Products
            </label>
            <div className="relative">
              {/* Search icon (magnifying glass) positioned inside the input */}
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {/* Text input with debounce — onChange triggers handleSearchChange which waits 500ms before updating filters */}
              <input
                id="product-search"
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search products..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* --- Categories Section --- */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Categories</h3>
            {/* Scrollable category list — max height prevents sidebar from growing too tall */}
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {categories.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No categories available</p>
              ) : (
                // Render each top-level category (subcategories rendered recursively inside)
                categories.map((category) => renderCategoryItem(category))
              )}
            </div>
          </div>

          {/* --- Price Range Section --- */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Price Range</h3>
            <div className="space-y-2">
              {/* Min Price input — accepts any numeric value */}
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min Price"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                min="0"
              />
              {/* Max Price input — accepts any numeric value */}
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max Price"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                min="0"
              />
              {/* Apply button — triggers product re-fetch with the current min/max price values */}
              <button
                onClick={handleApplyPrice}
                className="w-full py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="flex-1 min-w-0">
        {/* --- Results Count & Sort Bar --- */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Shows the number of matching products or "No products found" */}
          {loading ? (
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          ) : totalElements === 0 ? (
            <p className="text-gray-600 font-medium">No products found</p>
          ) : (
            <p className="text-gray-600 font-medium">
              Showing {totalElements} product{totalElements !== 1 ? 's' : ''}
            </p>
          )}

          {/* Sort dropdown — lets the user choose how to order the results */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setCurrentPage(0) // Reset to first page when changing sort order
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>

        {/* --- Product Grid / Loading Skeletons / Empty State --- */}
        {loading ? (
          /* Loading state: show 12 grey skeleton boxes with animate-pulse */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Skeleton image placeholder */}
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  {/* Skeleton product name (2 lines) */}
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  {/* Skeleton price */}
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
                  {/* Skeleton rating stars */}
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                  {/* Skeleton button */}
                  <div className="h-9 bg-gray-200 rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty state: centered emoji + message + Clear Filters button */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">🔍</span>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No products found</h2>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Product grid: 3 columns on desktop (lg), 2 on tablet (sm), 1 on mobile */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              // Get the primary image URL or use a placeholder if no images exist
              const primaryImage =
                product.images && product.images.length > 0
                  ? product.images[0].url
                  : null
              // Get the seller's store name (fallback to 'Unknown Store')
              const storeName = product.seller?.storeName || 'Unknown Store'
              // Check if this product is in the user's wishlist
              const isInWishlist = wishlistIds.has(product.id)
              // Average rating defaults to 0 if not available
              const rating = product.averageRating || 0
              // Review count defaults to 0 if not available
              const reviewCount = product.reviewCount || 0

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Product Image — links to the product detail page */}
                  <Link to={`/products/${product.id}`} className="block relative">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        /* Placeholder when no image is available */
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Wishlist heart icon — positioned in the top-right corner of the image */}
                    <button
                      onClick={(e) => {
                        e.preventDefault() // Prevent navigation when clicking the heart
                        handleToggleWishlist(product.id)
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
                      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      {/* Filled heart if in wishlist, outline heart if not */}
                      <svg
                        className={`w-5 h-5 ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                        fill={isInWishlist ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 space-y-2">
                    {/* Product name — truncated at 2 lines with line-clamp */}
                    <Link to={`/products/${product.id}`}>
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Star rating: render 5 stars based on averageRating */}
                    <div className="flex items-center gap-1">
                      {/* Render 5 stars (index 0-4), each filled/empty based on the rating */}
                      {[0, 1, 2, 3, 4].map((i) => renderStar(i, rating))}
                      {/* Review count in parentheses */}
                      <span className="text-xs text-gray-500 ml-1">({reviewCount} reviews)</span>
                    </div>

                    {/* Price formatted as "LKR 12,500" */}
                    <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>

                    {/* Seller store name in small text */}
                    <p className="text-xs text-gray-500">Sold by {storeName}</p>

                    {/* Add to Cart button — small, full-width */}
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

        {/* --- Pagination --- */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {/* Previous button — disabled when on the first page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {/* Page numbers — max 5 shown at a time via getPageNumbers() */}
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white font-medium'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page + 1} {/* Display 1-indexed page number to the user */}
              </button>
            ))}

            {/* Next button — disabled when on the last page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
