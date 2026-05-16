// Import Navigate to redirect users and Outlet to render child routes
import { Navigate, Outlet } from 'react-router-dom'
// Import useAuth to check login status and user role
import { useAuth } from '../../context/AuthContext'

// ProtectedRoute guards routes based on authentication and role
// Usage: <ProtectedRoute requiredRole="ADMIN"><SomeAdminPage /></ProtectedRoute>
// Or with nested routes: <ProtectedRoute requiredRole="SELLER"><Outlet /></ProtectedRoute>
export default function ProtectedRoute({ requiredRole }) {
  // Get the current login state and user object from AuthContext
  const { isLoggedIn, user } = useAuth()

  // CONDITION 1: User is not logged in at all
  // Redirect them to the login page so they can sign in first
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // CONDITION 2: User is logged in but does not have the required role
  // For example, a CUSTOMER trying to access /admin/dashboard
  // Redirect them to an unauthorized page explaining they lack permission
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  // CONDITION 3: User is logged in AND has the correct role (or no role was required)
  // Render the child component(s) by rendering the Outlet
  // Outlet is used when ProtectedRoute wraps nested <Route> elements
  return <Outlet />
}
