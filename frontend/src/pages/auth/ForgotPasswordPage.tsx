import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                  <span className="logo-mark"></span>
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                  placeholder="Masukkan alamat email Anda"
                  required
                />
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
