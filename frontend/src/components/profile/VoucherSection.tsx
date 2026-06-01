import { useProfileStore } from '../../store/profileStore'

export const VoucherSection = () => {
  const { profile } = useProfileStore()

  if (!profile) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {profile.referralCode && (
        <div className="hero-card" style={{ padding: '24px', background: '#f8f9fa', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--ink)', fontSize: '1.1rem' }}>Kode Referral Anda</h4>
          <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
            Bagikan kode ini kepada teman Anda. Jika mereka mendaftar dengan kode ini, Anda berdua akan mendapatkan voucher diskon Rp 20.000!
          </p>
          <div className="referral-row">
            <code style={{ background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-strong)' }}>
              {profile.referralCode.code}
            </code>
            <button 
              className="button secondary"
              style={{ padding: '8px 16px', borderRadius: '8px' }}
              onClick={() => {
                navigator.clipboard.writeText(profile.referralCode?.code || '');
                alert('Kode referral berhasil disalin!');
              }}
            >
              Salin Kode
            </button>
          </div>
        </div>
      )}

      <div className="hero-card" style={{ padding: '24px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 16px', color: 'var(--ink)', fontSize: '1.1rem' }}>Voucher Saya</h4>
        {(!profile.vouchers || profile.vouchers.length === 0) ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#f8f9fa', borderRadius: '12px', color: 'var(--ink-soft)' }}>
            Anda belum memiliki voucher saat ini.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profile.vouchers.map(voucher => (
              <div key={voucher.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--ink)' }}>{voucher.name}</h5>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                    Kode: <strong>{voucher.code}</strong> | {voucher.discountType === 'NOMINAL' ? `Potongan Rp ${voucher.discountValue.toLocaleString('id-ID')}` : `Diskon ${voucher.discountValue}%`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
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
