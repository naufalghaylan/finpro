import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email tidak boleh kosong').email('Format email tidak valid'),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setSuccess('');

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message || 'Email tidak valid');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message || 'Jika email terdaftar, link reset password telah dikirim ke email Anda.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Terjadi kesalahan saat memproses permintaan Anda.');
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
              <h1 className="m-0 text-[1.6rem] font-bold text-[#111] mb-[8px] tracking-normal">Lupa Password</h1>
              <p className="m-0 text-[1rem] text-[var(--ink-soft)] leading-[1.5]">Masukkan email Anda untuk menerima link reset password</p>
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
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
              <div className="flex flex-col gap-[8px]">
                <label htmlFor="email" className="text-[0.95rem] font-semibold text-[var(--ink)]">Alamat Email</label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  className={`w-full rounded-[14px] border ${emailError ? 'border-[#dc2626]' : 'border-[var(--line)]'} p-[14px_18px] bg-white text-[1rem] transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]`}
                  placeholder="Masukkan alamat email Anda"
                />
                {emailError && <span className="text-[#dc2626] text-[0.8rem]">{emailError}</span>}
              </div>
              
              <button 
                type="submit" 
                className="w-full mt-[12px] p-[14px] text-[1.05rem] rounded-[14px] font-semibold bg-[var(--accent)] text-white hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
            
            <div className="mt-[32px] text-center text-[0.95rem] text-[var(--ink-soft)]">
              Ingat password Anda? <Link to="/login" className="font-semibold no-underline hover:underline" style={{ color: 'var(--accent-strong)' }}>Kembali ke Login</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
