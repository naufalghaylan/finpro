import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const from = location.state?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ emailOrUsername: identifier, password, rememberMe });
      navigate(from);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number, data?: { message?: string } } };
      if (error.response?.status === 403 && error.response?.data?.message === 'Account not verified') {
        showToast('Akun belum diverifikasi. Silakan verifikasi ulang.', 'warning');
        navigate('/verify', { state: { email: identifier } });
      } else {
        setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <main className="page-main">
        <div className="shell auth-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100svh', padding: 'clamp(16px, 5vw, 40px)' }}>
          <div className="hero-card auth-card" style={{ width: '100%', maxWidth: '420px', padding: 'clamp(24px, 5vw, 40px) clamp(16px, 5vw, 32px)' }}>
            <div className="auth-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
              <button className="mobile-back-btn" onClick={() => navigate(-1)} type="button" aria-label="Go back">
                <ChevronLeft size={24} />
              </button>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                  <span className="logo-mark"></span>
                  <span style={{ fontSize: '1.4rem' }}>PanenMart</span>
                </div>
              </Link>
              <h1 className="hero-card-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Selamat Datang Kembali</h1>
              <p className="hero-card-sub">Masuk untuk melanjutkan belanja</p>
            </div>
            
            {error && (
              <div className="location-error" style={{ marginBottom: '20px', textAlign: 'center', padding: '12px', background: '#ffecec', borderRadius: '12px', border: '1px solid #ffcdcd' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="identifier" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Email atau Username</label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                  placeholder="Masukkan email atau username"
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="password" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 48px 14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--ink)' }}>
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--accent-strong)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Ingat Saya
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: 'var(--accent-strong)', fontWeight: 500, textDecoration: 'none' }}>
                    Lupa Password?
                  </Link>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="button primary" 
                style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '1.05rem', borderRadius: '14px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
            
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--line)' }}></div>
                  <span style={{ padding: '0 12px', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>atau masuk dengan</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--line)' }}></div>
                </div>
                <GoogleLoginButton onError={setError} />
              </>
            )}
            
            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                Belum punya akun? <Link to="/register" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Daftar sekarang</Link>
              </div>
              <div>
                Belum verifikasi email? <Link to="/verify" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Kirim ulang verifikasi</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
