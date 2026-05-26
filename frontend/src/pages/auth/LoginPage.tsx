import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ emailOrUsername: identifier, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <main className="page-main">
        <div className="shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100svh' }}>
          <div className="hero-card" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                  <span className="logo-mark"></span>
                  <span style={{ fontSize: '1.4rem' }}>PanenMart</span>
                </div>
              </Link>
              <h1 className="hero-card-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Selamat Datang Kembali</h1>
              <p className="hero-card-sub">Masuk untuk melanjutkan belanja</p>
            </div>
            
            {error && (
              <div className="location-error" style={{ marginBottom: '20px', textAlign: 'center', padding: '12px', background: '#ffecec', borderRadius: '12px', border: '1px solid #ffcdcd' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="identifier" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Email atau Username</label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                  placeholder="Masukkan email atau username"
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="password" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                  placeholder="Masukkan password"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="button primary" 
                style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '1.05rem', borderRadius: '14px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
            
            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                Belum punya akun? <Link to="/register" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Daftar sekarang</Link>
              </div>
              <div>
                Belum verifikasi email? <Link to="/verify" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Kirim ulang verifikasi</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
