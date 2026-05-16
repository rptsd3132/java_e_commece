// Import React hooks needed for context, state, and the context consumer
import { createContext, useContext, useState } from 'react'

// Create a new CartContext object
// We pass null as the default so we can detect missing provider usage
const CartContext = createContext(null)

// CartProvider component that wraps the app and provides cart state to all children
export function CartProvider({ children }) {
  // State to hold the total number of items in the cart
  // Defaults to 0 (empty cart) when the app first loads
  const [cartCount, setCartCount] = useState(0)

  // Function to add an item to the cart
  // Increases the cart count by 1 each time it is called
  const incrementCart = () => {
    setCartCount((prev) => prev + 1)  // Use functional update to safely add 1 to previous value
  }

  // Function to remove an item from the cart
  // Decreases the cart count by the given amount (defaults to 1)
  // The count will never go below 0
  const decrementCart = (by = 1) => {
    setCartCount((prev) => Math.max(0, prev - by))  // Subtract 'by' but never drop below 0
  }

  // Provide the cart count and all manipulation functions to child components
  return (
    <CartContext.Provider value={{ cartCount, setCartCount, incrementCart, decrementCart }}>
      {children}
    </CartContext.Provider>
  )
}

// Custom hook that any component can use to access cart data
// This is cleaner than calling useContext(CartContext) directly every time
export function useCart() {
  const ctx = useContext(CartContext)  // Get the context value from the nearest provider

  // Throw an error if a component uses this hook without being wrapped in CartProvider
  // This helps catch bugs early during development
  if (!ctx) {
    throw new Error('useCart must be used inside a CartProvider')
  }

  return ctx  // Return { cartCount, setCartCount, incrementCart, decrementCart }
}
