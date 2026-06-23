import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RefreshCcw, Home } from 'lucide-react'

interface ErrorPageProps {
  title?: string
  message?: string
  code?: number | string
}

const ErrorPage: React.FC<ErrorPageProps> = ({ title: propTitle, message: propMessage, code: propCode }) => {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Try to get error details from navigation state
  const state = location.state as ErrorPageProps | null
  
  const title = propTitle || state?.title || 'Terjadi Kesalahan'
  const message = propMessage || state?.message || 'Kami mengalami masalah yang tidak terduga. Tim kami telah diberitahu dan sedang memperbaikinya.'
  const code = propCode || state?.code || '500'

  return (
    <div className="page flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-[440px] w-full text-center flex flex-col gap-8 md:gap-8 relative z-10">
        
        {/* Illustration / Icon */}
        <div className="relative mx-auto w-[160px] h-[160px] md:w-[200px] md:h-[200px]">
          {/* Animated Glow */}
          <div 
            className="animate-pulse absolute inset-0 rounded-full"
            style={{ 
              background: '#dc2626', opacity: 0.15, filter: 'blur(24px)' 
            }}
          ></div>
          
          {/* Circle Container */}
          <div 
            className="relative rounded-full flex items-center justify-center w-full h-full overflow-hidden"
            style={{ 
              background: 'var(--surface)', 
              border: '1px solid var(--line)',
              boxShadow: '0 24px 70px rgba(220, 38, 38, 0.12)',
            }}
          >
            <img 
              src="/ErrorIcon.svg" 
              alt="Error" 
              className="w-[100px] h-[100px] md:w-[130px] md:h-[130px] object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-3 md:gap-4">
          <h1 
            className="font-extrabold m-0 text-[1.8rem] md:text-[2.2rem] tracking-tight"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          <p 
            className="m-0 leading-relaxed text-[0.95rem] md:text-[1.05rem]"
            style={{ color: 'var(--ink-soft)' }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3 md:pt-4 w-full">
          <button 
            onClick={() => window.location.reload()}
            className="button w-full sm:w-auto"
          >
            <RefreshCcw size={18} />
            Coba Lagi
          </button>
          
          <Link 
            to="/home"
            className="button primary w-full sm:w-auto"
          >
            <Home size={18} />
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
