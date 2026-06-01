import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { ChevronLeft } from 'lucide-react';

type Step = 'referral-input' | 'referral-code' | 'loading';

export default function SocialOnboardingPage() {
  const [step, setStep] = useState<Step>('referral-input');
  const [referralInput, setReferralInput] = useState('');
  const [myReferralCode, setMyReferralCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherEarned, setVoucherEarned] = useState(false);
  const [copied, setCopied] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/complete-onboarding', {
        referralCode: referralInput.trim() || undefined
      });
      setMyReferralCode(res.data.referralCode);
      setVoucherEarned(res.data.referralCodeUsed === true);
      setStep('referral-code');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/auth/complete-onboarding', {});
      setMyReferralCode(res.data.referralCode);
      setVoucherEarned(false);
      setStep('referral-code');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(myReferralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="page">
      <main className="page-main">
        <div
          className="shell auth-shell"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100svh',
            padding: 'clamp(24px, 5vw, 40px) clamp(16px, 5vw, 40px)'
          }}
        >
          <div
            className="hero-card auth-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: 'clamp(28px, 5vw, 48px) clamp(20px, 5vw, 36px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative orb */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232, 107, 79, 0.15), transparent 70%)',
                pointerEvents: 'none'
              }}
            />

            {/* Logo */}
            <div className="auth-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
              <button className="mobile-back-btn" onClick={() => navigate(-1)} type="button" aria-label="Go back">
                <ChevronLeft size={24} />
              </button>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '16px' }}>
                  <span className="logo-mark" />
                  <span style={{ fontSize: '1.4rem' }}>PanenMart</span>
                </div>
              </Link>

              {/* Step indicators */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '4px',
                      borderRadius: '999px',
                      background: i === (step === 'referral-input' ? 0 : 1) ? 'var(--accent)' : 'var(--line)',
                      transition: 'all 0.4s ease',
                      width: i === (step === 'referral-input' ? 0 : 1) ? '32px' : '16px'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Referral Input */}
            {step === 'referral-input' && (
              <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div
                    style={{
                      fontSize: '3rem',
                      marginBottom: '12px',
                      display: 'inline-block',
                      animation: 'float 3s ease-in-out infinite'
                    }}
                  >
                    🎉
                  </div>
                  <h1
                    className="hero-card-title"
                    style={{ fontSize: '1.6rem', marginBottom: '8px' }}
                  >
                    Selamat Datang, {user?.name?.split(' ')[0]}!
                  </h1>
                  <p className="hero-card-sub" style={{ lineHeight: '1.5' }}>
                    Akun kamu sudah siap. Punya kode referral dari teman?
                    Masukkan sekarang untuk dapat voucher Rp&nbsp;20.000!
                  </p>
                </div>

                {error && (
                  <div
                    style={{
                      marginBottom: '16px',
                      textAlign: 'center',
                      padding: '12px',
                      background: '#ffecec',
                      borderRadius: '12px',
                      border: '1px solid #ffcdcd',
                      color: '#a13a2f',
                      fontSize: '0.9rem'
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Voucher callout */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'var(--accent-soft)',
                    border: '1px dashed var(--accent)',
                    marginBottom: '24px'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🎟️</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-strong)' }}>
                      Bonus Referral
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                      Kamu & temanmu masing-masing dapat voucher Rp 20.000
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label
                      htmlFor="referral-code-input"
                      style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}
                    >
                      Kode Referral (Opsional)
                    </label>
                    <input
                      id="referral-code-input"
                      type="text"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: A1B2C3D4"
                      style={{
                        width: '100%',
                        borderRadius: '14px',
                        border: '1px solid var(--line)',
                        padding: '14px 18px',
                        background: '#fff',
                        fontSize: '1rem',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.1em',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <button
                    id="submit-referral-btn"
                    type="submit"
                    className="button primary"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '1.05rem',
                      borderRadius: '14px',
                      marginTop: '4px'
                    }}
                  >
                    {isSubmitting ? 'Memproses...' : referralInput.trim() ? 'Gunakan Kode & Lanjutkan' : 'Lanjutkan Tanpa Kode'}
                  </button>
                </form>

                <button
                  id="skip-onboarding-btn"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink-soft)',
                    fontSize: '0.9rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline',
                    borderRadius: '14px'
                  }}
                >
                  Lewati langkah ini
                </button>
              </div>
            )}

            {/* STEP 2: Show user's referral code */}
            {step === 'referral-code' && (
              <div style={{ animation: 'fadeUp 0.5s ease forwards', textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '3rem',
                    marginBottom: '12px',
                    display: 'inline-block',
                    animation: 'float 3s ease-in-out infinite'
                  }}
                >
                  ✨
                </div>
                <h1
                  className="hero-card-title"
                  style={{ fontSize: '1.6rem', marginBottom: '8px' }}
                >
                  {voucherEarned ? 'Voucher Kamu Sudah Aktif!' : 'Akun Siap Digunakan!'}
                </h1>
                <p className="hero-card-sub" style={{ lineHeight: '1.5', marginBottom: '28px' }}>
                  {voucherEarned
                    ? 'Kode referral berhasil digunakan. Kamu mendapat voucher Rp 20.000!'
                    : 'Bagikan kode referral kamu dan dapatkan voucher Rp 20.000 setiap ada teman yang mendaftar.'}
                </p>

                {voucherEarned && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'rgba(74, 124, 91, 0.1)',
                      border: '1px solid rgba(74, 124, 91, 0.3)',
                      marginBottom: '24px',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🎟️</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-cool)' }}>
                        Voucher Rp 20.000 aktif!
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                        Cek voucher kamu di halaman profil
                      </div>
                    </div>
                  </div>
                )}

                {/* Referral code card */}
                <div
                  style={{
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #e86b4f 0%, #f2c26b 100%)',
                    marginBottom: '28px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-30px',
                      left: '-10px',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)'
                    }}
                  />
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}
                  >
                    Kode Referral Kamu
                  </p>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '0.15em',
                      marginBottom: '4px'
                    }}
                  >
                    {myReferralCode}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.75)'
                    }}
                  >
                    Bagikan ke teman dan dapat Rp 20.000 bersama!
                  </p>
                </div>

                {/* Copy button */}
                <button
                  id="copy-referral-btn"
                  onClick={handleCopy}
                  className="button"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    fontSize: '1rem',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: copied ? 'rgba(74, 124, 91, 0.1)' : 'var(--surface-muted)',
                    border: copied ? '1px solid rgba(74, 124, 91, 0.4)' : '1px solid var(--line)',
                    color: copied ? 'var(--accent-cool)' : 'var(--ink)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span>{copied ? '✓' : '📋'}</span>
                  {copied ? 'Berhasil Disalin!' : 'Salin Kode Referral'}
                </button>

                <button
                  id="start-shopping-btn"
                  onClick={() => navigate('/')}
                  className="button primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    fontSize: '1.05rem'
                  }}
                >
                  Mulai Belanja →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
