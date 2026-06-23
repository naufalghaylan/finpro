import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email tidak boleh kosong').email('Format email tidak valid'),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="page">
      <main className="page-main">
        <div className="shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100svh' }}>
          <div className="hero-card" style={{ width: '100%', maxWidth: '420px', padding: 'clamp(24px, 5vw, 40px) clamp(16px, 5vw, 32px)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/PanenMartLogo.svg" alt="PanenMart Logo" style={{ width: '32px', height: '32px' }} />
                  <span style={{ fontSize: '1.4rem' }}>PanenMart</span>
                </div>
              </Link>
              <h1 className="hero-card-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Lupa Password</h1>
              <p className="hero-card-sub">Masukkan email Anda untuk menerima link reset password</p>
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
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="email" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Alamat Email</label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  style={{ width: '100%', borderRadius: '14px', border: emailError ? '1px solid #dc2626' : '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                  placeholder="Masukkan alamat email Anda"
                />
                {emailError && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{emailError}</span>}
              </div>
              
              <button 
                type="submit" 
                className="button primary" 
                style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '1.05rem', borderRadius: '14px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
            
            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>
              Ingat password Anda? <Link to="/login" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Masuk kembali</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
