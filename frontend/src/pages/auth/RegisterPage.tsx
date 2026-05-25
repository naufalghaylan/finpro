import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [role, setRole] = useState('CUSTOMER');
  
  const { register } = useAuthStore();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register({ name, username, email, role });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrasi gagal. Silakan periksa kembali data Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <main className="page-main">
        <div className="shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100svh', padding: '40px 0' }}>
          <div className="hero-card" style={{ width: '100%', maxWidth: '460px', padding: '40px 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                  <span className="logo-mark"></span>
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
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="username" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                    placeholder="Minimal 3 karakter"
                    required
                    minLength={3}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="email" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                    placeholder="Masukkan alamat email"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="role" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>Daftar Sebagai</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', borderRadius: '14px', border: '1px solid var(--line)', padding: '14px 18px', background: '#fff', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none', cursor: 'pointer', appearance: 'auto' }}
                  >
                    <option value="CUSTOMER">Pembeli (Customer)</option>
                    <option value="STORE_ADMIN">Pengelola Toko (Store Admin)</option>
                  </select>
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
              <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--ink-soft)' }}>
                Sudah punya akun? <Link to="/login" style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>Masuk di sini</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
