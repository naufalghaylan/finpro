import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useToast } from './Toast'

interface Props {
  children: ReactNode
}

/** Hanya bisa diakses oleh user yang sudah login */
export const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuthStore()
  const { showToast } = useToast()
  const hasShownToast = useRef(false)
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated && !hasShownToast.current) {
      showToast('Mohon login terlebih dahulu untuk mengakses halaman ini.', 'warning')
      hasShownToast.current = true
    }
  }, [isAuthenticated, showToast])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

/** Hanya bisa diakses oleh user yang sudah login dan sudah terverifikasi */
export const VerifiedRoute = ({ children }: Props) => {
  const { isAuthenticated, user } = useAuthStore()
  const { showToast } = useToast()
  const hasShownToast = useRef(false)
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated && !hasShownToast.current) {
      showToast('Mohon login terlebih dahulu untuk mengakses halaman ini.', 'warning')
      hasShownToast.current = true
    } else if (isAuthenticated && user && !user.emailVerified && !hasShownToast.current) {
      showToast('Akses ditolak. Silakan verifikasi email Anda terlebih dahulu.', 'warning')
      hasShownToast.current = true
    }
  }, [isAuthenticated, user, showToast])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (user && !user.emailVerified) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

/** Hanya bisa diakses oleh user yang belum login (guest) */
export const GuestRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

/** Hanya bisa diakses oleh SUPER_ADMIN atau STORE_ADMIN */
export const AdminRoute = ({ children }: Props) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN'
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

/** Hanya bisa diakses oleh SUPER_ADMIN saja */
export const SuperAdminRoute = ({ children }: Props) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
