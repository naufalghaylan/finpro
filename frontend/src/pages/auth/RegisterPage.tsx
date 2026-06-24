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
              <h1 className="m-0 text-[1.6rem] font-bold text-[#111] mb-[8px] tracking-normal">Buat Akun Baru</h1>
              <p className="m-0 text-[1rem] text-[var(--ink-soft)] leading-[1.5]">Daftar untuk mulai berbelanja di PanenMart</p>
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
                <div className="flex flex-col gap-[8px]">
                  <label htmlFor="name" className="text-[0.95rem] font-semibold text-[var(--ink)]">Nama Lengkap</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full rounded-[14px] border ${formErrors.name ? 'border-[#dc2626]' : 'border-[var(--line)]'} p-[14px_18px] bg-white text-[1rem] transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {formErrors.name && <span className="text-[#dc2626] text-[0.8rem]">{formErrors.name}</span>}
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label htmlFor="username" className="text-[0.95rem] font-semibold text-[var(--ink)]">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (formErrors.username) setFormErrors(prev => ({ ...prev, username: '' }));
                    }}
                    className={`w-full rounded-[14px] border ${formErrors.username ? 'border-[#dc2626]' : 'border-[var(--line)]'} p-[14px_18px] bg-white text-[1rem] transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]`}
                    placeholder="Minimal 3 karakter, tanpa spasi"
                  />
                  {formErrors.username && <span className="text-[#dc2626] text-[0.8rem]">{formErrors.username}</span>}
                </div>
                
                <div className="flex flex-col gap-[8px]">
                  <label htmlFor="email" className="text-[0.95rem] font-semibold text-[var(--ink)]">Email</label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`w-full rounded-[14px] border ${formErrors.email ? 'border-[#dc2626]' : 'border-[var(--line)]'} p-[14px_18px] bg-white text-[1rem] transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]`}
                    placeholder="Masukkan alamat email"
                  />
                  {formErrors.email && <span className="text-[#dc2626] text-[0.8rem]">{formErrors.email}</span>}
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label htmlFor="referralCode" className="text-[0.95rem] font-semibold text-[var(--ink)]">Kode Referral (Opsional)</label>
                  <input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full rounded-[14px] border border-[var(--line)] p-[14px_18px] bg-white text-[1rem] transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]"
                    placeholder="Masukkan kode referral teman Anda"
                  />
                  <span className="text-[0.8rem] text-[var(--ink-soft)] leading-[1.5]">Dapatkan voucher diskon Rp 20.000 jika menggunakan kode valid!</span>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full mt-[12px] p-[14px] text-[1.05rem] rounded-[14px] font-semibold bg-[var(--accent)] text-white hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
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

                <div className="mt-[32px] text-center text-[0.95rem] text-[var(--ink-soft)] flex flex-col gap-[8px]">
                  <div>
                    Sudah punya akun? <Link to="/login" className="font-semibold no-underline hover:underline" style={{ color: 'var(--accent-strong)' }}>Masuk di sini</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
