import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axiosConfig'

export default function RegisterPage() {
  // State for all form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('CUSTOMER')
  const [storeName, setStoreName] = useState('')

  // State for error/success messages and loading
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  // Handle form submission
  const handleSubmit = async (e) => {
    // Step 1: Prevent default browser form submission
    e.preventDefault()

    // Step 2: Clear previous messages
    setErrorMessage('')
    setSuccessMessage('')

    // Step 3: Client-side validation — check all required fields are filled
    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      setErrorMessage('All fields are required')
      return
    }

    // Step 4: Validate password length is at least 8 characters
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters')
      return
    }

    // Step 5: Validate password and confirm password match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }

    // Step 6: If role is SELLER, storeName is required
    if (role === 'SELLER' && !storeName) {
      setErrorMessage('Store name is required for sellers')
      return
    }

    // Step 7: Set loading state
    setIsLoading(true)

    try {
      // Step 8: Build the request body with all fields
      const requestBody = {
        firstName,
        lastName,
        email,
        password,
        role,
        ...(role === 'SELLER' && { storeName }),
      }

      // Step 9: Send POST request to register endpoint
      await api.post('/api/auth/register', requestBody)

      // Step 10: On success — show green success message
      setSuccessMessage('Account created! Redirecting to login...')

      // Step 11: After 2 seconds, navigate to login page
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
      // Step 12: On error — show red error message from API response
      setErrorMessage(error.response?.data?.error || 'Registration failed')
    } finally {
      // Step 13: Always reset loading state
      setIsLoading(false)
    }
  }

  return (
    // Centered white card with max width
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Account</h1>

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First name input */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="John"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Last name input */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Email input */}
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

          {/* Password input */}
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
              placeholder="Min 8 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Confirm password input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Role dropdown — Customer or Seller */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              I am a...
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="SELLER">Seller / Shop Owner</option>
            </select>
          </div>

          {/* Store name input — only shown when role is SELLER */}
          {role === 'SELLER' && (
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                id="storeName"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                placeholder="My Awesome Shop"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Error message box — shown only when errorMessage is set */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Success message box — shown only when successMessage is set */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {/* Submit button — shows loading text and is disabled while loading */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        {/* Link to login page */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
