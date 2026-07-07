import { useEffect, Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ToastProvider } from './components/common/Toast'
import { ProtectedRoute, GuestRoute, AdminRoute, SuperAdminRoute } from './components/common/RouteGuard'
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
import AdminStoreAdminList from './pages/admin/AdminStoreAdminList'
import AdminStockList from './pages/admin/AdminStockList'
import AdminOrderList from './pages/admin/AdminOrderList'
import AdminDashboardLayout from './components/admin/AdminDashboardLayout'

const AdminStoreList = lazy(() => import('./pages/admin/AdminStoreList'))
const AdminStoreDetailPage = lazy(() => import('./pages/admin/AdminStoreDetailPage'))
const AdminStoreOrdersPage = lazy(() => import('./pages/admin/AdminStoreOrdersPage'))
const AdminStoreMutationsPage = lazy(() => import('./pages/admin/AdminStoreMutationsPage'))
const AdminStoreStocksPage = lazy(() => import('./pages/admin/AdminStoreStocksPage'))
const AdminStoreDiscountsPage = lazy(() => import('./pages/admin/AdminStoreDiscountsPage'))

const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '16px' }}>
    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    <p style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Memuat halaman...</p>
  </div>
)
import AdminSalesReport from './pages/admin/AdminSalesReport'
import AdminStockReport from './pages/admin/AdminStockReport'
import AdminStoreSalesReportPage from './pages/admin/AdminStoreSalesReportPage'
import AdminStoreStockReportPage from './pages/admin/AdminStoreStockReportPage'
import NotFoundPage from './pages/error/NotFoundPage'
import AdminUserPage from './pages/admin/AdminUserPage'
import './App.css'
import './styles/index.css'

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

        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify" element={<VerifyAccountPage />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><SocialOnboardingPage /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/orders/:id/payment" element={<ProtectedRoute><OrderPaymentRedirect /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminDashboardLayout />}>
          <Route path="users" element={<SuperAdminRoute><AdminUserPage /></SuperAdminRoute>} />
          <Route path="categories" element={<AdminRoute><AdminCategoryPage /></AdminRoute>} />

          <Route path="stores" element={<AdminRoute><AdminStoreLayout /></AdminRoute>}>
            <Route index element={<AdminStoreIndexRedirect />} />
            <Route path="list" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminStoreList /></Suspense></SuperAdminRoute>} />
            <Route path="admins" element={<SuperAdminRoute><AdminStoreAdminList /></SuperAdminRoute>} />
            <Route path="stocks" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminStockList /></Suspense></SuperAdminRoute>} />
            <Route path="products" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminProductPage /></Suspense></SuperAdminRoute>} />
            <Route path="orders" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminOrderList /></Suspense></SuperAdminRoute>} />
            <Route path=":id/orders" element={<Suspense fallback={<PageLoader />}><AdminStoreOrdersPage /></Suspense>} />
            <Route path=":id/fulfillment" element={<Suspense fallback={<PageLoader />}><AdminStoreMutationsPage /></Suspense>} />
            <Route path=":id/sales-report" element={<AdminStoreSalesReportPage />} />
            <Route path=":id/stock-report" element={<AdminStoreStockReportPage />} />
            <Route path=":id/stocks" element={<Suspense fallback={<PageLoader />}><AdminStoreStocksPage /></Suspense>} />
            <Route path=":id/discounts" element={<Suspense fallback={<PageLoader />}><AdminStoreDiscountsPage /></Suspense>} />
            <Route path="sales-report" element={<SuperAdminRoute><AdminSalesReport /></SuperAdminRoute>} />
          <Route path="stock-report" element={<SuperAdminRoute><AdminStockReport /></SuperAdminRoute>} />
          <Route path=":id" element={<Suspense fallback={<PageLoader />}><AdminStoreDetailPage /></Suspense>} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  )
}

export default App