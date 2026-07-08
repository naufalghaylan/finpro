import React, { useState } from 'react';
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
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(token ? '' : 'Token reset password tidak ditemukan. Silakan request reset password kembali.');
  const [formErrors, setFormErrors] = useState<ResetErrors>({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              <h1 className="m-0 text-[1.6rem] font-bold text-[#111] mb-[8px] tracking-normal">Buat Password Baru</h1>
              <p className="m-0 text-[1rem] text-[var(--ink-soft)] leading-[1.5]">Silakan masukkan password baru untuk akun Anda</p>
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
            
            <div className="mt-[32px] text-center text-[0.95rem] text-[var(--ink-soft)]">
              Ingat password Anda? <Link to="/login" className="font-semibold no-underline hover:underline" style={{ color: 'var(--accent-strong)' }}>Kembali ke Login</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
