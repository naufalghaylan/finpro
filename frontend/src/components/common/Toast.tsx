import { useCallback, useState, type ReactNode } from 'react'
import { ToastContext, type ToastType } from './toastContext'
import './Toast.css'

// eslint-disable-next-line react-refresh/only-export-components
export { useToast } from './toastContext'

type Toast = {
  id: number
  message: string
  type: ToastType
}

let toastId = 0

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts([{ id, message, type }])
    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
    }, 2400)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
            <span className="toast__icon">{getIcon(toast.type)}</span>
            <span className="toast__message">{toast.message}</span>
            <button
              className="toast__close"
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Tutup notifikasi"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function getIcon(type: ToastType) {
  if (type === 'info') return 'i'
  return type === 'success' ? 'OK' : '!'
}
