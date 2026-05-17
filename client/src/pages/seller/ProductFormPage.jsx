// Import React hooks for state management and side effects
import { useState, useEffect } from 'react'
// Import useParams to detect edit mode (params.id present) vs create mode
// Import useNavigate to redirect after successful submit
import { useParams, useNavigate } from 'react-router-dom'
// Import the pre-configured axios instance (baseURL: http://localhost:8080, auto-attaches JWT)
import api from '../../api/axiosConfig'

/**
 * ProductFormPage — handles both product creation and editing
 *
 * Routes:
 *   /seller/products/new          — create mode (no params.id)
 *   /seller/products/:id/edit     — edit mode (params.id exists)
 *
 * API calls:
 *   GET /api/products/{id}        — fetch product data (edit mode only)
 *   GET /api/categories           — fetch all categories for dropdown
 *   POST /api/products            — create new product
 *   PUT /api/products/{id}        — update existing product
 */
export default function ProductFormPage() {
  // ==================== STATE VARIABLES ====================

  // Form field: product name (required, min 3 chars)
  const [name, setName] = useState('')

  // Form field: product description (textarea, 4 rows)
  const [description, setDescription] = useState('')

  // Form field: product price (number, min=0, step=0.01, required, must be > 0)
  const [price, setPrice] = useState('')

  // Form field: stock quantity (number, min=0, required, must be >= 0)
  const [stockQuantity, setStockQuantity] = useState('')

  // Form field: selected category ID (from dropdown)
  const [categoryId, setCategoryId] = useState('')

  // Form field: product status — 'ACTIVE' or 'INACTIVE' (radio buttons)
  const [status, setStatus] = useState('ACTIVE')

  // Form fields: up to 3 image URLs
  // In Phase 7 these will be replaced with real file upload inputs
  const [imageUrls, setImageUrls] = useState(['', '', ''])

  // Array of category objects fetched from GET /api/categories
  // Each category: { id, name, children: [...] }
  const [categories, setCategories] = useState([])

  // Boolean flag to show loading spinner on the submit button
  const [submitting, setSubmitting] = useState(false)

  // Validation errors — object with field names as keys and error messages as values
  const [errors, setErrors] = useState({})

  // Success toast message shown briefly after successful create/update
  const [successMsg, setSuccessMsg] = useState('')

  // Boolean flag to show skeleton form while fetching product data (edit mode)
  const [loadingForm, setLoadingForm] = useState(false)

  // ==================== HOOKS ====================

  // useParams lets us detect if we're in edit mode (params.id exists)
  const { id } = useParams()

  // useNavigate lets us redirect to the products list after successful submit
  const navigate = useNavigate()

  // Determine mode: if params.id exists we are editing, otherwise creating
  const isEditMode = !!id

  // ==================== DATA FETCHING ====================

  // Fetch categories on mount — used for the category dropdown in both modes
  // GET /api/categories — returns a tree of category objects
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/api/categories')
        setCategories(response.data || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories([])
      }
    }

    fetchCategories()
  }, [])

  // In edit mode: fetch the existing product data to pre-fill all form fields
  // GET /api/products/{id} — returns the full product object
  useEffect(() => {
    if (!isEditMode) return

    async function fetchProduct() {
      setLoadingForm(true)
      try {
        const response = await api.get(`/api/products/${id}`)
        const product = response.data

        // Pre-fill all form fields with existing product data
        setName(product.name || '')
        setDescription(product.description || '')
        setPrice(product.price || '')
        setStockQuantity(product.stockQuantity ?? '')
        setCategoryId(product.category?.id || '')
        setStatus(product.status || 'ACTIVE')

        // Pre-fill image URL inputs (up to 3)
        // In Phase 7 we'll replace these text inputs with real file upload
        const urls = ['', '', '']
        if (product.images && product.images.length > 0) {
          product.images.slice(0, 3).forEach((img, i) => {
            urls[i] = img.url || ''
          })
        }
        setImageUrls(urls)
      } catch (error) {
        console.error('Failed to fetch product for editing:', error)
        alert('Failed to load product data. Please try again.')
        navigate('/seller/products')
      } finally {
        setLoadingForm(false)
      }
    }

    fetchProduct()
  }, [id, isEditMode, navigate])

  // ==================== RENDER HELPERS ====================

  // Flatten the nested category tree into a flat array with indentation labels
  // e.g. "Electronics", "  Smartphones", "    Android Phones"
  // This makes it easy to render as a simple <select> dropdown
  const flattenCategories = (cats, level = 0) => {
    let result = []
    for (const cat of cats) {
      // Indentation prefix: two spaces per level for visual hierarchy
      const prefix = level > 0 ? '\u00A0\u00A0'.repeat(level) + '— ' : ''
      result.push({ id: cat.id, name: `${prefix}${cat.name}`, level })
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1))
      }
    }
    return result
  }

  // Update a specific image URL in the imageUrls array
  // In Phase 7 we'll replace these with real file upload inputs
  const handleImageUrlChange = (index, value) => {
    const updated = [...imageUrls]
    updated[index] = value
    setImageUrls(updated)
  }

  // ==================== VALIDATION ====================

  // Validate all form fields before submission
  // Returns an errors object: { name: '...', price: '...', ... }
  // Returns empty object if all fields are valid
  const validate = () => {
    const newErrors = {}

    // Name: required, minimum 3 characters
    if (!name || name.trim().length === 0) {
      newErrors.name = 'Product name is required'
    } else if (name.trim().length < 3) {
      newErrors.name = 'Product name must be at least 3 characters'
    }

    // Price: required, must be a positive number (> 0)
    if (!price && price !== 0) {
      newErrors.price = 'Price is required'
    } else if (Number(price) <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }

    // Stock Quantity: required, must be a non-negative number (>= 0)
    if (stockQuantity === '' || stockQuantity === null || stockQuantity === undefined) {
      newErrors.stockQuantity = 'Stock quantity is required'
    } else if (Number(stockQuantity) < 0) {
      newErrors.stockQuantity = 'Stock quantity must be 0 or more'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ==================== FORM SUBMISSION ====================

  // Called when the user clicks "Save Product"
  // Create mode: POST /api/products
  // Edit mode:   PUT /api/products/{id}
  // On success: redirect to /seller/products with a toast message
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Run validation — stop if any field is invalid
    if (!validate()) return

    setSubmitting(true)

    // Build the request payload from form fields
    // Filter out empty image URLs — only send URLs that are actually entered
    // In Phase 7 we'll replace these text inputs with real file upload
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      status,
      imageUrls: imageUrls.filter((url) => url.trim().length > 0),
    }

    // Attach category ID only if one is selected
    if (categoryId) {
      payload.categoryId = Number(categoryId)
    }

    try {
      if (isEditMode) {
        // Edit mode: PUT /api/products/{id} — update existing product
        await api.put(`/api/products/${id}`, payload)
        setSuccessMsg('Product updated successfully!')
      } else {
        // Create mode: POST /api/products — create new product
        await api.post('/api/products', payload)
        setSuccessMsg('Product created successfully!')
      }

      // Clear form errors
      setErrors({})

      // Show success toast for 2 seconds, then redirect to products list
      setTimeout(() => {
        navigate('/seller/products')
      }, 2000)
    } catch (error) {
      console.error('Failed to save product:', error)
      // Show a generic error if the API returns a validation error or server error
      setErrors({
        form:
          error.response?.data?.message ||
          'Failed to save product. Please check your inputs and try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ==================== LOADING STATE (EDIT MODE) ====================

  // Show skeleton form while fetching product data in edit mode
  if (loadingForm) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page title skeleton */}
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />

        {/* Form skeleton — grey placeholder fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
          {/* Submit button skeleton */}
          <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // ==================== MAIN RENDER ====================

  // Flatten categories for the dropdown with visual indentation
  const flatCategories = flattenCategories(categories)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ==================== PAGE HEADER ==================== */}
      {/* Title changes based on create vs edit mode */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Product' : 'Add New Product'}
      </h1>

      {/* ==================== SUCCESS TOAST ==================== */}
      {/* Green success message shown after successful create/update */}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* ==================== FORM-LEVEL ERROR ==================== */}
      {/* Red error box shown when the API returns a server error */}
      {errors.form && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errors.form}
        </div>
      )}

      {/* ==================== PRODUCT FORM ==================== */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

        {/* ----- FIELD 1: Product Name (required, min 3 chars) ----- */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Samsung Galaxy S24 Ultra"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              errors.name ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {/* Inline red error message shown below the field if validation fails */}
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* ----- FIELD 2: Description (textarea, 4 rows) ----- */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the product features, specifications, etc."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* ----- FIELD 3: Price (number, min=0, step=0.01, required, > 0) ----- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (LKR) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.price ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {/* Inline red error message shown below the field if validation fails */}
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          {/* ----- FIELD 4: Stock Quantity (number, min=0, required, >= 0) ----- */}
          <div>
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="stockQuantity"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="0"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.stockQuantity ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {/* Inline red error message shown below the field if validation fails */}
            {errors.stockQuantity && (
              <p className="mt-1 text-sm text-red-600">{errors.stockQuantity}</p>
            )}
          </div>
        </div>

        {/* ----- FIELD 5: Category (dropdown, flattened with indentation) ----- */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">— Select a category —</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {/* dangerouslySetInnerHTML is safe here since we control the category data */}
                <span dangerouslySetInnerHTML={{ __html: cat.name }} />
              </option>
            ))}
          </select>
        </div>

        {/* ----- FIELD 6: Status (radio buttons — Active | Inactive) ----- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex gap-6">
            {/* Active radio option */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="ACTIVE"
                checked={status === 'ACTIVE'}
                onChange={(e) => setStatus(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>

            {/* Inactive radio option */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="INACTIVE"
                checked={status === 'INACTIVE'}
                onChange={(e) => setStatus(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Inactive</span>
            </label>
          </div>
        </div>

        {/* ----- FIELD 7: Image URLs (3 text inputs with small preview) ----- */}
        {/* In Phase 7 we'll replace these text inputs with real file upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Enter image URLs below. (In Phase 7 we&apos;ll replace these with real file upload)
          </p>
          <div className="space-y-3">
            {imageUrls.map((url, index) => (
              <div key={index} className="flex gap-3 items-start">
                {/* Image URL text input */}
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder={`Image URL ${index + 1} (e.g. https://example.com/photo.jpg)`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />

                {/* Small preview image shown if a URL is entered */}
                {url.trim() && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide the preview if the URL is invalid or the image fails to load
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ==================== FORM ACTIONS ==================== */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          {/* Cancel button — navigates back to the products list */}
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="px-6 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>

          {/* Submit button — shows loading state while request is in flight */}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting
              ? 'Saving...'
              : isEditMode
                ? 'Update Product'
                : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
