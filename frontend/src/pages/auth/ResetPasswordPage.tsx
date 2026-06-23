import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password minimal harus 6 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password tidak boleh kosong'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Password baru dan konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

type ResetErrors = Partial<Record<'newPassword' | 'confirmPassword', string>>;

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<ResetErrors>({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Token reset password tidak ditemukan. Silakan request reset password kembali.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormErrors({});

    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errors: ResetErrors = {};
      result.error.issues.forEach((issue: z.ZodIssue) => {
        if (issue.path[0]) errors[issue.path[0] as keyof ResetErrors] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    if (!token) {
      setError('Token reset password tidak valid.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess('Password berhasil direset! Anda akan dialihkan ke halaman login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Gagal mereset password. Token mungkin sudah kadaluarsa.');
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
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/PanenMartLogo.svg" alt="PanenMart Logo" style={{ width: '32px', height: '32px' }} />
                  <span style={{ fontSize: '1.4rem' }}>PanenMart</span>
                </div>
              </Link>
              <h1 className="hero-card-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Buat Password Baru</h1>
              <p className="hero-card-sub">Silakan masukkan password baru untuk akun Anda</p>
            </div>
            
            {error && (
              <div className="location-error" style={{ marginBottom: '20px', textAlign: 'center', padding: '12px', background: '#ffecec', color: '#d32f2f', borderRadius: '12px', border: '1px solid #ffcdcd' }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{ marginBottom: '20px', textAlign: 'center', padding: '12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
                {success}
              </div>
            )}
            
            {!success && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="newPassword" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Password Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (formErrors.newPassword) setFormErrors(prev => ({ ...prev, newPassword: '' }));
                      }}
                      style={{ width: '100%', borderRadius: '14px', border: formErrors.newPassword ? '1px solid #dc2626' : '1px solid var(--line)', padding: '14px 48px 14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                      placeholder="Minimal 6 karakter"
                      disabled={!token}
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
                  {formErrors.newPassword && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{formErrors.newPassword}</span>}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="confirmPassword" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Konfirmasi Password Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      style={{ width: '100%', borderRadius: '14px', border: formErrors.confirmPassword ? '1px solid #dc2626' : '1px solid var(--line)', padding: '14px 48px 14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                      placeholder="Masukkan ulang password baru"
                      disabled={!token}
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
                  {formErrors.confirmPassword && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{formErrors.confirmPassword}</span>}
                </div>
                
                <button 
                  type="submit" 
                  className="button primary" 
                  style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '1.05rem', borderRadius: '14px' }}
                  disabled={isSubmitting || !token}
                >
                  {isSubmitting ? 'Memproses...' : 'Simpan Password Baru'}
                </button>
              </form>
            )}
            
            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>
              Kembali ke <Link to="/login" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Halaman Login</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
