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
  const [formErrors, setFormErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Resend Email State
  const [resendEmail, setResendEmail] = useState(stateEmail);
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [showResend, setShowResend] = useState(!token);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    let hasError = false;
    const errors: { password?: string; confirmPassword?: string } = {};

    if (password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
      hasError = true;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Password dan konfirmasi password tidak cocok.';
      hasError = true;
    }

    if (hasError) {
      setFormErrors(errors);
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
    <div className="min-h-[100svh] flex flex-col bg-[var(--bg)]">
      <main className="flex-1 flex flex-col">
        <div className="flex justify-center items-center min-h-[100svh] p-[clamp(16px,5vw,40px)] w-full">
          <div className="w-full max-w-[420px] bg-white rounded-[24px] p-[clamp(24px,5vw,40px)_clamp(16px,5vw,32px)] shadow-[var(--shadow-soft)] border border-[var(--line)] relative">
            <div className="text-center mb-[32px]">
              <button className="absolute top-[24px] left-[16px] sm:left-[24px] w-[40px] h-[40px] rounded-full bg-white border border-[var(--line)] flex items-center justify-center cursor-pointer text-[var(--ink)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] md:hidden" onClick={() => navigate(-1)} type="button" aria-label="Go back">
                <ChevronLeft size={24} />
              </button>
              <Link to="/" className="inline-block no-underline">
                <div className="flex justify-center items-center gap-[8px] mb-[20px]">
                  <img src="/PanenMartLogo.svg" alt="PanenMart Logo" className="w-[32px] h-[32px]" />
                  <span className="text-[1.4rem] font-[family-name:var(--font-display)] font-semibold text-[var(--ink)] tracking-[-0.02em]">PanenMart</span>
                </div>
              </Link>
              <h1 className="m-0 text-[1.6rem] font-bold text-[#111] mb-[8px] tracking-normal">Verifikasi Akun</h1>
              <p className="m-0 text-[1rem] text-[var(--ink-soft)] leading-[1.5]">Buat password untuk mengaktifkan akun Anda</p>
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
                  <form onSubmit={handleVerify} className="flex flex-col gap-[20px] mb-[32px]">
                    <div className="flex flex-col gap-[8px]">
                      <label htmlFor="password" className="text-[0.95rem] font-semibold text-[var(--ink)]">Password Baru</label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                          }}
                          className={`w-full rounded-[14px] border ${formErrors.password ? 'border-[#dc2626]' : 'border-[var(--line)]'} p-[14px_48px_14px_18px] bg-white text-[1rem] transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]`}
                          placeholder="Minimal 6 karakter"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-[16px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[var(--ink-soft)] flex items-center justify-center p-0 hover:text-[var(--ink)]"
                          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {formErrors.password && <span className="text-[#dc2626] text-[0.8rem]">{formErrors.password}</span>}
                    </div>

                    <div className="flex flex-col gap-[8px]">
                      <label htmlFor="confirmPassword" className="text-[0.95rem] font-semibold text-[var(--ink)]">Konfirmasi Password</label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
                          }}
                          className={`w-full rounded-[14px] border ${formErrors.confirmPassword ? 'border-[#dc2626]' : 'border-[var(--line)]'} p-[14px_48px_14px_18px] bg-white text-[1rem] transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]`}
                          placeholder="Ulangi password baru"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-[16px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[var(--ink-soft)] flex items-center justify-center p-0 hover:text-[var(--ink)]"
                          aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {formErrors.confirmPassword && <span className="text-[#dc2626] text-[0.8rem]">{formErrors.confirmPassword}</span>}
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full mt-[12px] p-[14px] text-[1.05rem] rounded-[14px] font-semibold bg-[var(--accent)] text-white hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
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
                        className="w-full mt-[12px] p-[14px] text-[1.05rem] rounded-[14px] font-semibold bg-[var(--accent)] text-white hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
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
