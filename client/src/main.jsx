// Import React strict mode for catching potential bugs
import { StrictMode } from 'react'
// Import the function that renders our React app into the DOM
import { createRoot } from 'react-dom/client'
// BrowserRouter enables client-side page navigation without full page reloads
import { BrowserRouter } from 'react-router-dom'
// AuthProvider shares login state (user, token, login, logout) to every component
import { AuthProvider } from './context/AuthContext'
// CartProvider shares cart item count to every component (used for navbar badge)
import { CartProvider } from './context/CartContext'
// Global styles including Tailwind CSS directives
import './index.css'
// The main App component that holds all routes and page layouts
import App from './App.jsx'

// Find the root div in index.html and render our React tree inside it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter: Required for react-router-dom to manage URL-based navigation */}
    <BrowserRouter>
      {/* AuthProvider: Must wrap the app so every page can check if user is logged in */}
      <AuthProvider>
        {/* CartProvider: Must wrap the app so navbar and pages can read/update cart count */}
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
