import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email atau username tidak boleh kosong'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
});

type LoginErrors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>;

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const from = location.state?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormErrors({});

    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      const errors: LoginErrors = {};
      result.error.issues.forEach((issue: z.ZodIssue) => {
        if (issue.path[0]) errors[issue.path[0] as keyof LoginErrors] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ emailOrUsername: identifier, password, rememberMe });
      
      const user = useAuthStore.getState().user;
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN') {
        // Redirect to admin dashboard
        navigate('/admin/stores');
      } else {
        navigate(from);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number, data?: { message?: string } } };
      if (error.response?.status === 403 && error.response?.data?.message === 'Account not verified') {
        showToast('Akun belum diverifikasi. Silakan verifikasi ulang.', 'warning');
        navigate('/verify', { state: { email: identifier } });
      } else {
        setError(error.response?.data?.message || 'Login gagal. Periksa kembali email/username dan password Anda.');
      }
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
              <h1 className="m-0 text-[1.6rem] font-bold text-[#111] mb-[8px] tracking-normal">Selamat Datang Kembali</h1>
              <p className="m-0 text-[1rem] text-[var(--ink-soft)] leading-[1.5]">Masuk untuk melanjutkan belanja</p>
            </div>
            
            {error && (
              <div className="location-error" style={{ marginBottom: '20px', textAlign: 'center', padding: '12px', background: '#ffecec', borderRadius: '12px', border: '1px solid #ffcdcd' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
              <div className="flex flex-col gap-[8px]">
                <label htmlFor="identifier" className="text-[0.95rem] font-semibold text-[var(--ink)]">Email atau Username</label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (formErrors.identifier) setFormErrors(prev => ({ ...prev, identifier: '' }));
                  }}
                  className={`w-full rounded-[14px] border ${formErrors.identifier ? 'border-[#dc2626]' : 'border-[var(--line)]'} p-[14px_18px] bg-white text-[1rem] transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]`}
                  placeholder="Masukkan email atau username"
                />
                {formErrors.identifier && <span className="text-[#dc2626] text-[0.8rem]">{formErrors.identifier}</span>}
              </div>
              <div className="flex flex-col gap-[8px]">
                <label htmlFor="password" className="text-[0.95rem] font-semibold text-[var(--ink)]">Password</label>
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
                    placeholder="Masukkan password"
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
                <div className="flex justify-between items-center mt-[4px]">
                  <label className="flex items-center gap-[8px] cursor-pointer text-[0.9rem] text-[var(--ink)]">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[var(--accent-strong)] w-[16px] h-[16px] cursor-pointer"
                    />
                    Ingat Saya
                  </label>
                  <Link to="/forgot-password" className="text-[0.9rem] font-semibold no-underline hover:underline" style={{ color: 'var(--accent-strong)' }}>
                    Lupa Password?
                  </Link>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full mt-[12px] p-[14px] text-[1.05rem] rounded-[14px] font-semibold bg-[var(--accent)] text-white hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
            
            <div className="flex items-center my-[24px]">
              <div className="flex-1 h-[1px] bg-[var(--line)]"></div>
              <span className="px-[12px] text-[0.9rem] text-[var(--ink-soft)]">atau masuk dengan</span>
              <div className="flex-1 h-[1px] bg-[var(--line)]"></div>
            </div>

            <GoogleLoginButton onError={setError} />
            
            <div className="mt-[32px] text-center text-[0.95rem] text-[var(--ink-soft)] flex flex-col gap-[8px]">
              <div>
                Belum punya akun? <Link to="/register" className="font-semibold no-underline hover:underline" style={{ color: 'var(--accent-strong)' }}>Daftar sekarang</Link>
              </div>
              <div>
                Belum verifikasi email? <Link to="/verify" className="font-semibold no-underline hover:underline" style={{ color: 'var(--accent-strong)' }}>Kirim ulang verifikasi</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
