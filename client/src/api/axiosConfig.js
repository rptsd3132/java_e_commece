// Import the axios library to make HTTP requests
import axios from 'axios'

// Create a reusable axios instance with the base URL of our Spring Boot backend
// This means we can call api.get('/users') instead of api.get('http://localhost:8080/users')
const api = axios.create({
  baseURL: 'http://localhost:8080', // Backend server address
})

// REQUEST INTERCEPTOR
// This runs before EVERY API call and attaches the user's login token
api.interceptors.request.use(
  (config) => {
    // Read the JWT token from localStorage (saved during login)
    const token = localStorage.getItem('token')

    // If a token exists, add it to the Authorization header
    if (token) {
      // Spring Boot will read this header to verify the user's identity
      config.headers.Authorization = `Bearer ${token}`
    }

    // Return the modified config so the request can proceed
    return config
  },
  (error) => {
    // If something goes wrong setting up the request, reject with the error
    return Promise.reject(error)
  }
)

// RESPONSE INTERCEPTOR
// This runs when the server says our token is expired or invalid
api.interceptors.response.use(
  (response) => {
    // If the request was successful, simply return the response
    return response
  },
  (error) => {
    // Check if the error came from the server and the status is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // The token is expired or invalid, so clear all stored auth data
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Redirect the user to the login page to sign in again
      window.location.href = '/login'
    }

    // Pass the error along so the calling code can handle it too
    return Promise.reject(error)
  }
)

// Export the configured api instance so other files can import and use it
export default api
