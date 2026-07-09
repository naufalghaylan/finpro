import { useEffect, Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ToastProvider } from './components/common/Toast'
import { ProtectedRoute, GuestRoute, AdminRoute, SuperAdminRoute, StoreAdminScopedRoute } from './components/common/RouteGuard'
import { ScrollToTop } from './components/common/ScrollToTop'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AdminDashboardLayout from './components/admin/AdminDashboardLayout'
import AdminStoreLayout, { AdminStoreIndexRedirect } from './pages/admin/AdminStoreLayout'
import AdminStoreSalesReportPage from './pages/admin/AdminStoreSalesReportPage'
import AdminStoreStockReportPage from './pages/admin/AdminStoreStockReportPage'
import './App.css'
import './styles/index.css'

const VerifyAccountPage = lazy(() => import('./pages/auth/VerifyAccountPage'))
const VerifyEmailChangePage = lazy(() => import('./pages/auth/VerifyEmailChangePage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'))
const SocialOnboardingPage = lazy(() => import('./pages/auth/SocialOnboardingPage'))
const CartPage = lazy(() => import('./pages/cart/CartPage'))
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'))
const PaymentPage = lazy(() => import('./pages/payment/PaymentPage'))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'))
const CatalogPage = lazy(() => import('./pages/catalog/CatalogPage'))
const SearchPage = lazy(() => import('./pages/search/SearchPage'))
const ProductDetailPage = lazy(() => import('./pages/product/ProductDetailPage'))
const HelpPage = lazy(() => import('./pages/help/HelpPage'))
const AboutPage = lazy(() => import('./pages/company/AboutPage'))
const PartnersPage = lazy(() => import('./pages/company/PartnersPage'))
const CareersPage = lazy(() => import('./pages/company/CareersPage'))

const AdminCategoryPage = lazy(() => import('./pages/admin/AdminCategoryPage'))
const AdminProductPage = lazy(() => import('./pages/admin/AdminProductPage'))
const AdminStoreAdminList = lazy(() => import('./pages/admin/AdminStoreAdminList'))
const AdminStockList = lazy(() => import('./pages/admin/AdminStockList'))
const AdminOrderList = lazy(() => import('./pages/admin/AdminOrderList'))
const AdminStoreList = lazy(() => import('./pages/admin/AdminStoreList'))
const AdminStoreDetailPage = lazy(() => import('./pages/admin/AdminStoreDetailPage'))
const AdminStoreOrdersPage = lazy(() => import('./pages/admin/AdminStoreOrdersPage'))
const AdminStoreMutationsPage = lazy(() => import('./pages/admin/AdminStoreMutationsPage'))
const AdminStoreStocksPage = lazy(() => import('./pages/admin/AdminStoreStocksPage'))
const AdminStoreScopedAdminsPage = lazy(() => import('./pages/admin/AdminStoreScopedAdminsPage'))
const AdminSalesReport = lazy(() => import('./pages/admin/AdminSalesReport'))
const AdminStockReport = lazy(() => import('./pages/admin/AdminStockReport'))
const AdminUserPage = lazy(() => import('./pages/admin/AdminUserPage'))
const NotFoundPage = lazy(() => import('./pages/error/NotFoundPage'))
const AdminStoreDiscountsPage = lazy(() => import('./pages/admin/AdminStoreDiscountsPage'))

const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '16px' }}>
    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    <p style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Memuat halaman...</p>
  </div>
)


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
        <Route path="/catalog" element={<Suspense fallback={<PageLoader />}><CatalogPage /></Suspense>} />
        <Route path="/search" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
        <Route path="/products/:id" element={<Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>} />
        <Route path="/help" element={<Suspense fallback={<PageLoader />}><HelpPage /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="/partners" element={<Suspense fallback={<PageLoader />}><PartnersPage /></Suspense>} />
        <Route path="/careers" element={<Suspense fallback={<PageLoader />}><CareersPage /></Suspense>} />

        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify" element={<Suspense fallback={<PageLoader />}><VerifyAccountPage /></Suspense>} />
        <Route path="/verify-email-change" element={<Suspense fallback={<PageLoader />}><VerifyEmailChangePage /></Suspense>} />
        <Route path="/forgot-password" element={<GuestRoute><Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense></GuestRoute>} />

        <Route path="/profile" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><SocialOnboardingPage /></Suspense></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CartPage /></Suspense></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><OrdersPage /></Suspense></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><PaymentPage /></Suspense></ProtectedRoute>} />
        <Route path="/orders/:id/payment" element={<ProtectedRoute><OrderPaymentRedirect /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminDashboardLayout />}>
          <Route path="users" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminUserPage /></Suspense></SuperAdminRoute>} />
          <Route path="categories" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminCategoryPage /></Suspense></AdminRoute>} />

          <Route path="stores" element={<AdminRoute><AdminStoreLayout /></AdminRoute>}>
            <Route index element={<AdminStoreIndexRedirect />} />
            <Route path="list" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminStoreList /></Suspense></SuperAdminRoute>} />
            <Route path="admins" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminStoreAdminList /></Suspense></SuperAdminRoute>} />
            <Route path="stocks" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminStockList /></Suspense></SuperAdminRoute>} />
            <Route path="products" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminProductPage /></Suspense></SuperAdminRoute>} />
            <Route path="orders" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminOrderList /></Suspense></SuperAdminRoute>} />
            <Route path=":id/orders" element={<StoreAdminScopedRoute><Suspense fallback={<PageLoader />}><AdminStoreOrdersPage /></Suspense></StoreAdminScopedRoute>} />
            <Route path=":id/fulfillment" element={<StoreAdminScopedRoute><Suspense fallback={<PageLoader />}><AdminStoreMutationsPage /></Suspense></StoreAdminScopedRoute>} />
            <Route path=":id/sales-report" element={<StoreAdminScopedRoute><AdminStoreSalesReportPage /></StoreAdminScopedRoute>} />
            <Route path=":id/stock-report" element={<StoreAdminScopedRoute><AdminStoreStockReportPage /></StoreAdminScopedRoute>} />
            <Route path=":id/stocks" element={<StoreAdminScopedRoute><Suspense fallback={<PageLoader />}><AdminStoreStocksPage /></Suspense></StoreAdminScopedRoute>} />
            <Route path=":id/admins" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminStoreScopedAdminsPage /></Suspense></SuperAdminRoute>} />
            <Route path=":id/discounts" element={<Suspense fallback={<PageLoader />}><AdminStoreDiscountsPage /></Suspense>} />
            <Route path="sales-report" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminSalesReport /></Suspense></SuperAdminRoute>} />
            <Route path="stock-report" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><AdminStockReport /></Suspense></SuperAdminRoute>} />
            <Route path=":id" element={<StoreAdminScopedRoute><Suspense fallback={<PageLoader />}><AdminStoreDetailPage /></Suspense></StoreAdminScopedRoute>} />
          </Route>
        </Route>

        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
      </Routes>
    </ToastProvider>
  )
}

export default App