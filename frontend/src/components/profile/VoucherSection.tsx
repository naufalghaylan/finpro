import { useProfileStore } from '../../store/profileStore'

export const VoucherSection = () => {
  const { profile } = useProfileStore()

  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      {profile.referralCode && (
        <div className="p-[24px] bg-white/85 border border-[var(--line)] rounded-[20px] shadow-[var(--shadow-soft)]">
          <h3 className="m-0 text-[#111] font-[family-name:var(--font-display)] font-normal tracking-normal text-[1.3rem] mb-1">Kode Referral Anda</h3>
          <p className="m-0 text-[0.95rem] text-[var(--ink-soft)] leading-[1.6] mb-4">
            Bagikan kode ini kepada teman Anda. Jika mereka mendaftar dengan kode ini, Anda berdua akan mendapatkan voucher diskon Rp 20.000!
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="bg-white px-4 py-2.5 rounded-lg border border-dashed border-[#cbd5e1] text-[1.2rem] font-bold text-[var(--accent-strong)]">
              {profile.referralCode.code}
            </code>
            <button 
              className="px-4 py-2 rounded-lg bg-transparent border border-[var(--line)] text-[var(--ink)] font-semibold cursor-pointer hover:bg-[var(--surface-muted)] transition-colors"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(profile.referralCode?.code || '');
                  alert('Kode referral berhasil disalin!');
                } catch (err) {
                  console.error('Failed to copy code', err);
                  alert('Gagal menyalin kode. Silakan salin secara manual.');
                }
              }}
            >
              Salin Kode
            </button>
          </div>
        </div>
      )}

      <div className="p-[24px] bg-white/85 border border-[var(--line)] rounded-[20px] shadow-[var(--shadow-soft)]">
        <h3 className="m-0 text-[#111] font-[family-name:var(--font-display)] font-normal tracking-normal text-[1.3rem] mb-4">Voucher Saya</h3>
        {(!profile.vouchers || profile.vouchers.length === 0) ? (
          <div className="p-6 text-center bg-[#f8f9fa] rounded-xl text-[var(--ink-soft)]">
            Anda belum memiliki voucher saat ini.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {profile.vouchers.map((voucher) => (
              <div key={voucher.id} className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl bg-white">
                <div>
                  <h5 className="m-0 mb-1 text-[1rem] text-[var(--ink)]">{voucher.name}</h5>
                  <div className="text-[0.85rem] text-[var(--ink-soft)]">
                    Kode: <strong className="text-[var(--ink)]">{voucher.code}</strong> | {voucher.discountType === 'NOMINAL' ? `Potongan Rp ${voucher.discountValue.toLocaleString('id-ID')}` : `Diskon ${voucher.discountValue}%`}
                  </div>
                  <div className="text-[0.8rem] text-[#ef4444] mt-1 font-medium">
                    Berlaku s/d {new Date(voucher.expiredAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
