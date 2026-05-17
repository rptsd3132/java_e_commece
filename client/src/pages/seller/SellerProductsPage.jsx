// Import React hooks for state management and side effects
import { useState, useEffect } from 'react'
// Import Link and useNavigate from react-router-dom for navigation
import { Link, useNavigate } from 'react-router-dom'
// Import the pre-configured axios instance (baseURL: http://localhost:8080, auto-attaches JWT)
import api from '../../api/axiosConfig'

/**
 * SellerProductsPage — displays the logged-in seller's product list
 *
 * Route: /seller/products (protected — requires SELLER role)
 *
 * API calls:
 *   GET /api/seller/products?page=0&size=20 — fetch seller's own products
 *   DELETE /api/products/{id}               — delete a product
 */
export default function SellerProductsPage() {
  // ==================== STATE VARIABLES ====================

  // Array of product objects returned from GET /api/seller/products
  // Each product: { id, name, price, stockQuantity, status, images, category, ... }
  const [products, setProducts] = useState([])

  // Total number of products (from API pagination metadata)
  const [totalElements, setTotalElements] = useState(0)

  // Boolean flag to show skeleton table rows while data is loading
  const [loading, setLoading] = useState(true)

  // ==================== HOOKS ====================

  // useNavigate lets us redirect to the form page or other routes
  const navigate = useNavigate()

  // ==================== DATA FETCHING ====================

  // Fetch the seller's products on mount
  // GET /api/seller/products?page=0&size=20 — JWT token auto-attached by axiosConfig
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const response = await api.get('/api/seller/products', {
          params: { page: 0, size: 20 },
        })
        // The API returns a paginated response: { content: [...], totalElements, ... }
        setProducts(response.data.content || [])
        setTotalElements(response.data.totalElements || 0)
      } catch (error) {
        console.error('Failed to fetch seller products:', error)
        setProducts([])
        setTotalElements(0)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // ==================== EVENT HANDLERS ====================

  // Called when the user clicks "Delete" on a product row
  // Shows a confirm dialog, then sends DELETE /api/products/{id}
  // On success: removes the product from state immediately (no page reload)
  const handleDelete = async (product) => {
    // Confirm dialog to prevent accidental deletion
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return
    }

    try {
      // DELETE /api/products/{id} — JWT token auto-attached
      await api.delete(`/api/products/${product.id}`)
      // Remove the deleted product from state immediately — no page reload needed
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      setTotalElements((prev) => prev - 1)
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  // ==================== RENDER HELPERS ====================

  // Format a number as Sri Lankan Rupees: "LKR 125,000"
  const formatPrice = (price) => {
    return `LKR ${Number(price).toLocaleString('en-US')}`
  }

  // Get the primary (first) image URL from a product's images array
  // Returns empty string if no images exist
  const getPrimaryImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].url
    }
    return ''
  }

  // Determine the status badge styling based on product status
  // ACTIVE → green, INACTIVE → grey, OUT_OF_STOCK → red
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Active', className: 'bg-green-100 text-green-700' }
      case 'INACTIVE':
        return { text: 'Inactive', className: 'bg-gray-100 text-gray-600' }
      case 'OUT_OF_STOCK':
        return { text: 'Out of Stock', className: 'bg-red-100 text-red-700' }
      default:
        return { text: status || 'Unknown', className: 'bg-gray-100 text-gray-600' }
    }
  }

  // Get the category name, falling back to 'Uncategorized' if not set
  const getCategoryName = (product) => {
    if (product.category) {
      if (product.category.parent) {
        return `${product.category.parent.name} > ${product.category.name}`
      }
      return product.category.name
    }
    return 'Uncategorized'
  }

  // ==================== LOADING STATE ====================

  // Show skeleton table with 5 grey rows while data is loading
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Table skeleton — 5 grey rows */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table header skeleton */}
          <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>

          {/* 5 skeleton rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="hidden md:grid grid-cols-7 gap-4 px-6 py-4 border-b border-gray-100 items-center"
            >
              {/* Image placeholder */}
              <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
              {/* Product name placeholder */}
              <div className="h-4 bg-gray-200 rounded animate-pulse col-span-2" />
              {/* Category placeholder */}
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              {/* Price placeholder */}
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              {/* Stock placeholder */}
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              {/* Status + Actions placeholder */}
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Page title with product count badge */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {totalElements} product{totalElements !== 1 ? 's' : ''}
          </span>
        </div>

        {/* "+ Add New Product" button — navigates to the product creation form */}
        <button
          onClick={() => navigate('/seller/products/new')}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add New Product
        </button>
      </div>

      {/* ==================== EMPTY STATE ==================== */}
      {/* Shown when the seller has no products */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <span className="text-5xl mb-4 block">📦</span>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            You haven&apos;t added any products yet
          </h2>
          <p className="text-gray-500 mb-6">
            Start by adding your first product to your store.
          </p>
          <button
            onClick={() => navigate('/seller/products/new')}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add New Product
          </button>
        </div>
      ) : (
        /* ==================== PRODUCT TABLE ==================== */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table header — hidden on mobile, shown on md and up */}
          <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div>Image</div>
            <div className="col-span-2">Product Name</div>
            <div>Category</div>
            <div>Price</div>
            <div>Stock</div>
            <div>Status / Actions</div>
          </div>

          {/* Table rows — one per product */}
          {products.map((product) => {
            const statusBadge = getStatusBadge(product.status)
            const primaryImage = getPrimaryImage(product)

            return (
              <div
                key={product.id}
                className="hidden md:grid grid-cols-7 gap-4 px-6 py-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors"
              >
                {/* Product thumbnail — 48x48 with object-cover */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      📷
                    </div>
                  )}
                </div>

                {/* Product name */}
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                </div>

                {/* Category breadcrumb */}
                <div className="text-sm text-gray-600 truncate">
                  {getCategoryName(product)}
                </div>

                {/* Price */}
                <div className="text-sm font-medium text-gray-900">
                  {formatPrice(product.price)}
                </div>

                {/* Stock quantity */}
                <div className="text-sm text-gray-600">
                  {product.stockQuantity}
                </div>

                {/* Status badge + Edit/Delete action buttons */}
                <div className="flex items-center gap-2">
                  {/* Status badge: ACTIVE=green, INACTIVE=grey, OUT_OF_STOCK=red */}
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.className}`}
                  >
                    {statusBadge.text}
                  </span>

                  {/* Edit button — navigates to the product edit form */}
                  <button
                    onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                    className="px-2 py-1 text-xs border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>

                  {/* Delete button — triggers confirm dialog then DELETE request */}
                  <button
                    onClick={() => handleDelete(product)}
                    className="px-2 py-1 text-xs border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ==================== MOBILE CARD VIEW ==================== */}
      {/* Shown on screens smaller than md — each product as a card */}
      {products.length > 0 && (
        <div className="md:hidden space-y-3 mt-4">
          {products.map((product) => {
            const statusBadge = getStatusBadge(product.status)
            const primaryImage = getPrimaryImage(product)

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex gap-3">
                  {/* Small thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        📷
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {getCategoryName(product)}
                    </p>
                    <p className="text-sm font-bold text-green-600 mt-1">
                      {formatPrice(product.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {/* Status badge */}
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.className}`}
                      >
                        {statusBadge.text}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {product.stockQuantity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                    className="flex-1 py-1.5 text-xs font-medium border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="flex-1 py-1.5 text-xs font-medium border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
