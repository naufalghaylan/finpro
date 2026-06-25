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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Terjadi kesalahan.');
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
    <div className="min-h-[100svh] flex flex-col bg-[var(--bg)]">
      <main className="flex-1 flex flex-col">
        <div className="flex justify-center items-center min-h-[100svh] p-[clamp(16px,5vw,40px)] w-full">
          <div className="w-full max-w-[460px] bg-white rounded-[24px] p-[clamp(24px,5vw,40px)_clamp(16px,5vw,32px)] shadow-[var(--shadow-soft)] border border-[var(--line)] relative overflow-hidden">
            {/* Decorative orb */}
            <div className="absolute -top-10 -right-10 w-[180px] h-[180px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(232, 107, 79, 0.15), transparent 70%)' }} />

            {/* Logo */}
            <div className="text-center mb-[32px] relative z-10">
              <button className="absolute top-[0px] left-[0px] w-[40px] h-[40px] rounded-full bg-white border border-[var(--line)] flex items-center justify-center cursor-pointer text-[var(--ink)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] md:hidden" onClick={() => navigate(-1)} type="button" aria-label="Go back">
                <ChevronLeft size={24} />
              </button>
              <Link to="/" className="inline-block no-underline">
                <div className="flex justify-center items-center gap-[8px] mb-[20px]">
                  <img src="/PanenMartLogo.svg" alt="PanenMart Logo" className="w-[32px] h-[32px]" />
                  <span className="text-[1.4rem] font-[family-name:var(--font-display)] font-semibold text-[var(--ink)] tracking-[-0.02em]">PanenMart</span>
                </div>
              </Link>

              {/* Step indicators */}
              <div className="flex justify-center gap-[8px] mb-[24px]">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`h-[4px] rounded-full transition-all duration-400 ${i === (step === 'referral-input' ? 0 : 1) ? 'bg-[var(--accent)] w-[32px]' : 'bg-[var(--line)] w-[16px]'}`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Referral Input */}
            {step === 'referral-input' && (
              <div className="animate-[fadeUp_0.5s_ease_forwards]">
                <div className="text-center mb-[28px]">
                  <div className="text-[3rem] mb-3 inline-block animate-[float_3s_ease-in-out_infinite]">
                    🎉
                  </div>
                  <h1 className="m-0 text-[1.6rem] font-bold text-[#111] mb-[8px] tracking-normal">
                    Selamat Datang, {user?.name?.split(' ')[0]}!
                  </h1>
                  <p className="m-0 text-[1rem] text-[var(--ink-soft)] leading-[1.5]">
                    Akun kamu sudah siap. Punya kode referral dari teman?
                    Masukkan sekarang untuk dapat voucher Rp&nbsp;20.000!
                  </p>
                </div>

                {error && (
                  <div className="mb-[16px] text-center p-[12px] bg-[#ffecec] rounded-[12px] border border-[#ffcdcd] text-[#a13a2f] text-[0.9rem]">
                    {error}
                  </div>
                )}

                {/* Voucher callout */}
                <div className="flex items-center gap-[12px] p-[14px_16px] rounded-[14px] bg-[var(--accent-soft)] border border-dashed border-[var(--accent)] mb-[24px]">
                  <span className="text-[1.5rem]">🎟️</span>
                  <div>
                    <div className="font-semibold text-[0.9rem] text-[var(--accent-strong)]">
                      Bonus Referral
                    </div>
                    <div className="text-[0.85rem] text-[var(--ink-soft)]">
                      Kamu & temanmu masing-masing dapat voucher Rp 20.000
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
                  <div className="flex flex-col gap-[8px]">
                    <label
                      htmlFor="referral-code-input"
                      className="text-[0.95rem] font-semibold text-[var(--ink)]"
                    >
                      Kode Referral (Opsional)
                    </label>
                    <input
                      id="referral-code-input"
                      type="text"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: A1B2C3D4"
                      className="w-full rounded-[14px] border border-[var(--line)] p-[14px_18px] bg-white text-[1rem] font-mono tracking-widest transition-all duration-200 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)] uppercase"
                    />
                  </div>

                  <button
                    id="submit-referral-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-[12px] p-[14px] text-[1.05rem] rounded-[14px] font-semibold bg-[var(--accent)] text-white hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
                  >
                    {isSubmitting ? 'Memproses...' : referralInput.trim() ? 'Gunakan Kode & Lanjutkan' : 'Lanjutkan Tanpa Kode'}
                  </button>
                </form>

                <button
                  id="skip-onboarding-btn"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="w-full mt-[12px] p-[12px] bg-transparent border-none text-[var(--ink-soft)] text-[0.9rem] underline rounded-[14px] cursor-pointer disabled:cursor-not-allowed"
                >
                  Lewati langkah ini
                </button>
              </div>
            )}

            {/* STEP 2: Show user's referral code */}
            {step === 'referral-code' && (
              <div className="animate-[fadeUp_0.5s_ease_forwards] text-center">
                <div className="text-[3rem] mb-[12px] inline-block animate-[float_3s_ease-in-out_infinite]">
                  ✨
                </div>
                <h1 className="m-0 text-[1.6rem] font-bold text-[#111] mb-[8px] tracking-normal">
                  {voucherEarned ? 'Voucher Kamu Sudah Aktif!' : 'Akun Siap Digunakan!'}
                </h1>
                <p className="m-0 text-[1rem] text-[var(--ink-soft)] leading-[1.5] mb-7">
                  {voucherEarned
                    ? 'Kode referral berhasil digunakan. Kamu mendapat voucher Rp 20.000!'
                    : 'Bagikan kode referral kamu dan dapatkan voucher Rp 20.000 setiap ada teman yang mendaftar.'}
                </p>

                {voucherEarned && (
                  <div className="flex items-center gap-[12px] p-[14px_16px] rounded-[14px] bg-[rgba(74,124,91,0.1)] border border-[rgba(74,124,91,0.3)] mb-[24px] text-left">
                    <span className="text-[1.5rem]">🎟️</span>
                    <div>
                      <div className="font-semibold text-[0.9rem] text-[var(--accent-cool)]">
                        Voucher Rp 20.000 aktif!
                      </div>
                      <div className="text-[0.85rem] text-[var(--ink-soft)]">
                        Cek voucher kamu di halaman profil
                      </div>
                    </div>
                  </div>
                )}

                {/* Referral code card */}
                <div className="p-[24px] rounded-[20px] bg-gradient-to-br from-[#e86b4f] to-[#f2c26b] mb-[28px] relative overflow-hidden">
                  <div className="absolute -top-[20px] -right-[20px] w-[100px] h-[100px] rounded-full bg-[rgba(255,255,255,0.1)]" />
                  <div className="absolute -bottom-[30px] -left-[10px] w-[80px] h-[80px] rounded-full bg-[rgba(255,255,255,0.08)]" />
                  <p className="m-[0_0_8px] text-[0.8rem] font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-[0.1em]">
                    Kode Referral Kamu
                  </p>
                  <div className="text-[2rem] font-[var(--font-mono)] font-bold text-[#fff] tracking-[0.15em] mb-[4px]">
                    {myReferralCode}
                  </div>
                  <p className="m-0 text-[0.8rem] text-[rgba(255,255,255,0.75)]">
                    Bagikan ke teman dan dapat Rp 20.000 bersama!
                  </p>
                </div>

                {/* Copy button */}
                <button
                  id="copy-referral-btn"
                  onClick={handleCopy}
                  className={`w-full p-[14px] rounded-[14px] text-[1rem] mb-[12px] flex items-center justify-center gap-[8px] transition-all duration-300 ${copied ? 'bg-[rgba(74,124,91,0.1)] border border-[rgba(74,124,91,0.4)] text-[var(--accent-cool)]' : 'bg-[var(--surface-muted)] border border-[var(--line)] text-[var(--ink)]'}`}
                >
                  <span>{copied ? '✓' : '📋'}</span>
                  {copied ? 'Berhasil Disalin!' : 'Salin Kode Referral'}
                </button>

                <button
                  id="start-shopping-btn"
                  onClick={() => navigate('/')}
                  className="w-full mt-[12px] p-[14px] text-[1.05rem] rounded-[14px] font-semibold bg-[var(--accent)] text-white hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
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
