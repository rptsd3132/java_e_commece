// Import React hooks needed for context, state, and side effects
import { createContext, useContext, useState, useEffect } from 'react'

// Create a new AuthContext object
// We pass null as the default value so we can detect if a component is missing the provider
const AuthContext = createContext(null)

// AuthProvider component that wraps the app and provides auth state to all children
export function AuthProvider({ children }) {
  // State to hold the logged-in user's data (name, email, role, etc.)
  // Starts as null because we don't know if the user is logged in yet
  const [user, setUser] = useState(null)

  // State to hold the JWT authentication token
  // Starts as null and gets set after login or restored from localStorage
  const [token, setToken] = useState(null)

  // Computed value: true if a token exists, false otherwise
  // This makes it easy for components to check if someone is logged in
  const isLoggedIn = token !== null

  // Login function: called when the user successfully signs in
  // It saves the user data and token to both state and localStorage
  const login = (userData, token) => {
    setUser(userData)              // Update React state with user info
    setToken(token)                // Update React state with the token
    localStorage.setItem('token', token)                    // Persist token across page refreshes
    localStorage.setItem('user', JSON.stringify(userData))  // Persist user data across page refreshes
  }

  // Logout function: called when the user clicks sign out
  // It clears all state and removes stored data from localStorage
  const logout = () => {
    setUser(null)                  // Clear user from React state
    setToken(null)                 // Clear token from React state
    localStorage.removeItem('token')  // Remove token from browser storage
    localStorage.removeItem('user')   // Remove user data from browser storage
  }

  // Effect runs once when the component mounts (page load or refresh)
  // It checks localStorage for saved auth data and restores the session
  useEffect(() => {
    const savedToken = localStorage.getItem('token')  // Get token from storage
    const savedUser = localStorage.getItem('user')    // Get user data from storage

    // If both token and user data exist, restore them to state
    if (savedToken && savedUser) {
      setToken(savedToken)                            // Restore token
      setUser(JSON.parse(savedUser))                  // Parse JSON string back to object and restore user
    }
  }, [])  // Empty dependency array means this runs only once on mount

  // Provide all auth values and functions to any component inside this provider
  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook that any component can use to access auth data
// This is cleaner than calling useContext(AuthContext) directly every time
export function useAuth() {
  const ctx = useContext(AuthContext)  // Get the context value from the nearest provider

  // Throw an error if a component uses this hook without being wrapped in AuthProvider
  // This helps catch bugs early during development
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return ctx  // Return { user, token, isLoggedIn, login, logout }
}
