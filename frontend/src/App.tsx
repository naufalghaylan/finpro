import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyAccountPage from './pages/auth/VerifyAccountPage'
import CartPage from './pages/cart/CartPage'
import CatalogPage from './pages/catalog/CatalogPage'
import SearchPage from './pages/search/SearchPage'
import ProductDetailPage from './pages/product/ProductDetailPage'
import AdminCategoryPage from './pages/admin/AdminCategoryPage'
import AdminProductPage from './pages/admin/AdminProductPage'
import './App.css'




function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100svh' }}>
        <p>Loading...</p>
      </div>
    )
  }

return (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/catalog" element={<CatalogPage />} />
    <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
    <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
    <Route path="/verify" element={<VerifyAccountPage />} />
    <Route path="/cart" element={isAuthenticated ? <CartPage /> : <Navigate to="/login" replace />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/products/:id" element={<ProductDetailPage />} />
    <Route path="/admin/products" element={<AdminProductPage />} />
    <Route path="/admin/categories" element={<AdminCategoryPage />} />
  </Routes>
)


}

export default App
