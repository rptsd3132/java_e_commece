import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axiosConfig'

export default function LoginPage() {
  // State for form inputs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // State for error display and loading spinner
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  // Handle form submission
  const handleSubmit = async (e) => {
    // Step 1: Prevent default browser form submission
    e.preventDefault()

    // Step 2: Set loading state and clear any previous error
    setIsLoading(true)
    setErrorMessage('')

    try {
      // Step 3: Send POST request to login endpoint with email and password
      const response = await api.post('/api/auth/login', { email, password })

      // Step 4: On success — save user data and token to auth context + localStorage
      login(response.data, response.data.token)

      // Step 5: Navigate to the correct dashboard based on the user's role
      if (response.data.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else if (response.data.role === 'SELLER') {
        navigate('/seller/dashboard')
      } else {
        // CUSTOMER role (default)
        navigate('/customer/dashboard')
      }
    } catch (error) {
      // Step 6: On error — display the error message from the API or a fallback
      setErrorMessage(error.response?.data?.error || 'Login failed')
    } finally {
      // Step 7: Always reset loading state when request finishes
      setIsLoading(false)
    }
  }

  return (
    // Centered white card with max width
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign In</h1>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Password input field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Error message box — shown only when errorMessage is set */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Submit button — shows loading text and is disabled while loading */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* Link to registration page */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
