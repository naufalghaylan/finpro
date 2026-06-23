import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';

export default function VerifyAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmail = location.state?.email || '';

  // Set Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Resend Email State
  const [resendEmail, setResendEmail] = useState(stateEmail);
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [showResend, setShowResend] = useState(!token);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/verify', { token, password });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Verifikasi gagal. Link mungkin tidak valid atau sudah kadaluarsa.');
      if (error.response?.data?.message === 'Token expired' || error.response?.data?.message === 'Invalid token') {
        setShowResend(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMessage('');
    setIsResending(true);
    try {
      const res = await api.post('/auth/resend-verification', { email: resendEmail });
      setResendMessage(res.data.message || 'Email verifikasi berhasil dikirim ulang.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setResendMessage(error.response?.data?.message || 'Gagal mengirim ulang email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="page">
      <main className="page-main">
        <div className="shell auth-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100svh', padding: 'clamp(24px, 5vw, 40px) clamp(16px, 5vw, 40px)' }}>
          <div className="hero-card auth-card" style={{ width: '100%', maxWidth: '460px', padding: 'clamp(24px, 5vw, 40px) clamp(16px, 5vw, 32px)' }}>
            <div className="auth-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
              <button className="mobile-back-btn" onClick={() => navigate(-1)} type="button" aria-label="Go back">
                <ChevronLeft size={24} />
              </button>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/PanenMartLogo.svg" alt="PanenMart Logo" style={{ width: '32px', height: '32px' }} />
                  <span style={{ fontSize: '1.4rem' }}>PanenMart</span>
                </div>
              </Link>
              <h1 className="hero-card-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Verifikasi Akun</h1>
              <p className="hero-card-sub">Buat password untuk mengaktifkan akun Anda</p>
            </div>
            
            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                <h2 style={{ color: 'var(--ink)', marginBottom: '12px' }}>Akun Berhasil Diverifikasi!</h2>
                <p style={{ color: 'var(--ink-soft)', lineHeight: '1.5', marginBottom: '24px' }}>
                  Anda akan dialihkan ke halaman login dalam beberapa detik...
                </p>
                <Link to="/login" className="button primary" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '14px', textDecoration: 'none' }}>
                  Ke Halaman Login
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="location-error" style={{ marginBottom: '20px', textAlign: 'center', padding: '12px', background: '#ffecec', borderRadius: '12px', border: '1px solid #ffcdcd' }}>
                    {error}
                  </div>
                )}
                
                {token && (
                  <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label htmlFor="password" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Password Baru</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 48px 14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                          placeholder="Minimal 6 karakter"
                          required
                          minLength={6}
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
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label htmlFor="confirmPassword" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Konfirmasi Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 48px 14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                          placeholder="Ulangi password baru"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                          aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="button primary" 
                      style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '1.05rem', borderRadius: '14px' }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Memproses...' : 'Simpan Password & Verifikasi'}
                    </button>
                  </form>
                )}
                
                {showResend && (
                  <div style={{ paddingTop: token ? '24px' : '0', borderTop: token ? '1px solid var(--line)' : 'none' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', textAlign: 'center' }}>Tidak menerima email? Atau link kadaluarsa?</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: '16px', textAlign: 'center' }}>
                      Masukkan email Anda untuk mengirim ulang link verifikasi.
                    </p>
                    
                    {resendMessage && (
                      <div style={{ marginBottom: '16px', textAlign: 'center', padding: '12px', background: resendMessage.includes('berhasil') ? '#e6f7eb' : '#ffecec', borderRadius: '12px', border: resendMessage.includes('berhasil') ? '1px solid #c3e8cd' : '1px solid #ffcdcd', color: resendMessage.includes('berhasil') ? '#2e7d32' : 'inherit' }}>
                        {resendMessage}
                      </div>
                    )}
                    
                    <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <input
                        type="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', outline: 'none' }}
                        placeholder="Masukkan alamat email"
                        required
                      />
                      <button 
                        type="submit" 
                        className="button outline" 
                        style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '14px', background: 'transparent', border: '1px solid var(--ink)', cursor: 'pointer' }}
                        disabled={isResending}
                      >
                        {isResending ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
