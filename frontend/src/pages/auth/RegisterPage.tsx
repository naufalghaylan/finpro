import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { ChevronLeft } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter').regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh mengandung huruf, angka, dan underscore'),
  email: z.string().min(1, 'Email tidak boleh kosong').email('Format email tidak valid'),
});

type RegisterErrors = Partial<Record<keyof z.infer<typeof registerSchema>, string>>;

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormErrors({});

    const result = registerSchema.safeParse({ name, username, email });
    if (!result.success) {
      const errors: RegisterErrors = {};
      result.error.issues.forEach((issue: z.ZodIssue) => {
        if (issue.path[0]) errors[issue.path[0] as keyof RegisterErrors] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, username, email, role: 'CUSTOMER', referralCode: referralCode || undefined });
      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registrasi gagal. Silakan periksa kembali data Anda.');
    } finally {
      setIsSubmitting(false);
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
              <h1 className="hero-card-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Buat Akun Baru</h1>
              <p className="hero-card-sub">Daftar untuk mulai berbelanja di PanenMart</p>
            </div>
            
            {error && (
              <div className="location-error" style={{ marginBottom: '20px', textAlign: 'center', padding: '12px', background: '#ffecec', borderRadius: '12px', border: '1px solid #ffcdcd' }}>
                {error}
              </div>
            )}
            
            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✉️</div>
                <h2 style={{ color: 'var(--ink)', marginBottom: '12px' }}>Pendaftaran Berhasil!</h2>
                <p style={{ color: 'var(--ink-soft)', lineHeight: '1.5', marginBottom: '24px' }}>
                  Kami telah mengirimkan email verifikasi ke <strong>{email}</strong>. 
                  Silakan periksa kotak masuk (atau folder spam) Anda untuk memverifikasi akun dan membuat password.
                </p>
                <div style={{ marginBottom: '24px', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>
                  Tidak menerima email? <Link to="/verify" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Kirim ulang verifikasi</Link>
                </div>
                <Link to="/login" className="button primary" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '14px', textDecoration: 'none' }}>
                  Kembali ke Halaman Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="name" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Nama Lengkap</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    style={{ width: '100%', borderRadius: '14px', border: formErrors.name ? '1px solid #dc2626' : '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                    placeholder="Masukkan nama lengkap"
                  />
                  {formErrors.name && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{formErrors.name}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="username" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (formErrors.username) setFormErrors(prev => ({ ...prev, username: '' }));
                    }}
                    style={{ width: '100%', borderRadius: '14px', border: formErrors.username ? '1px solid #dc2626' : '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                    placeholder="Minimal 3 karakter, tanpa spasi"
                  />
                  {formErrors.username && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{formErrors.username}</span>}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="email" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Email</label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                    }}
                    style={{ width: '100%', borderRadius: '14px', border: formErrors.email ? '1px solid #dc2626' : '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                    placeholder="Masukkan alamat email"
                  />
                  {formErrors.email && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{formErrors.email}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="referralCode" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Kode Referral (Opsional)</label>
                  <input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                    placeholder="Masukkan kode referral teman Anda"
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Dapatkan voucher diskon Rp 20.000 jika menggunakan kode valid!</span>
                </div>
                
                <button 
                  type="submit" 
                  className="button primary" 
                  style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '1.05rem', borderRadius: '14px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
                </button>
              </form>
            )}
            
            {!isSuccess && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--line)' }}></div>
                  <span style={{ padding: '0 12px', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>atau daftar dengan</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--line)' }}></div>
                </div>

                <GoogleLoginButton onError={setError} />

                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>
                  Sudah punya akun? <Link to="/login" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Masuk di sini</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
