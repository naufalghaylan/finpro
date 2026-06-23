import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ToastProvider } from './components/common/Toast'
import { ProtectedRoute, GuestRoute } from './components/common/RouteGuard'
import { ScrollToTop } from './components/common/ScrollToTop'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyAccountPage from './pages/auth/VerifyAccountPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ProfilePage from './pages/profile/ProfilePage'
import SocialOnboardingPage from './pages/auth/SocialOnboardingPage'
import CartPage from './pages/cart/CartPage'
import CheckoutPage from './pages/checkout/CheckoutPage'
import PaymentPage from './pages/payment/PaymentPage'
import OrdersPage from './pages/orders/OrdersPage'
import CatalogPage from './pages/catalog/CatalogPage'
import SearchPage from './pages/search/SearchPage'
import ProductDetailPage from './pages/product/ProductDetailPage'
import AdminCategoryPage from './pages/admin/AdminCategoryPage'
import AdminProductPage from './pages/admin/AdminProductPage'
import AdminStoreLayout, { AdminStoreIndexRedirect } from './pages/admin/AdminStoreLayout'
import AdminStoreList from './pages/admin/AdminStoreList'
import AdminStoreAdminList from './pages/admin/AdminStoreAdminList'
import AdminStockList from './pages/admin/AdminStockList'
import AdminStoreDetailPage from './pages/admin/AdminStoreDetailPage'
import AdminOrderList from './pages/admin/AdminOrderList'
import './App.css'

function OrderPaymentRedirect() {
  const { id } = useParams()

  return <Navigate to={`/orders/${id}`} replace />
}




function App() {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100svh', gap: '16px' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <p style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Memuat...</p>
      </div>
    )
  }

  return (
    <ToastProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        
        {/* Guest Routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify" element={<VerifyAccountPage />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        
        {/* Protected Routes */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><SocialOnboardingPage /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/orders/:id/payment" element={<ProtectedRoute><OrderPaymentRedirect /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/categories" element={<AdminCategoryPage />} />
        
        <Route path="/admin/stores" element={<AdminStoreLayout />}>
          <Route index element={<AdminStoreIndexRedirect />} />
          <Route path="list" element={<AdminStoreList />} />
          <Route path="admins" element={<AdminStoreAdminList />} />
          <Route path="stocks" element={<AdminStockList />} />
          <Route path="products" element={<AdminProductPage />} />
          <Route path="orders" element={<AdminOrderList />} />
          <Route path=":id" element={<AdminStoreDetailPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  )

}

export default App
