import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">E-Shop</Link>
        <div className="space-x-6">
          <Link to="/shop" className="text-gray-700 hover:text-blue-600">Shop</Link>
          <Link to="/cart" className="text-gray-700 hover:text-blue-600">Cart</Link>
          <Link to="/orders" className="text-gray-700 hover:text-blue-600">Orders</Link>
          <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
        </div>
      </div>
    </nav>
  )
}
