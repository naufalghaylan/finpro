import { Modal, ModalBody, ModalFooter, ModalHeader } from 'flowbite-react';
import { DynamicIcon } from 'lucide-react/dynamic';

type IconName = React.ComponentProps<typeof DynamicIcon>['name'];

type Props = {
  /** Kontrol tampil/sembunyi modal dari parent. */
  open: boolean;
  title?: string;
  message?: string;
  iconName?: IconName;
  iconSize?: number;
  /** Gaya merah untuk aksi destruktif (hapus). Default: true */
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Loading state saat proses konfirmasi berjalan. */
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export default function ConfirmationModal({
  open,
  title = 'Konfirmasi',
  message = 'Tindakan ini tidak bisa dibatalkan.',
  iconName = 'triangle-alert' as IconName,
  iconSize = 48,
  danger = true,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      show={open}
      size="md"
      onClose={onCancel}
      dismissible
      className="font-[family-name:var(--font-admin)] backdrop-blur-sm"
    >
      {/* Header: judul + tombol close (close bawaan flowbite) */}
      <ModalHeader className="bg-admin-surface border-b border-admin-line-soft [&>h3]:text-admin-ink [&>h3]:font-bold">
        {title}
      </ModalHeader>

      {/* Body: ikon + pesan */}
      <ModalBody className="bg-admin-surface">
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <span
            className={`flex items-center justify-center w-14 h-14 rounded-full ${
              danger ? 'bg-admin-red-soft text-admin-red' : 'bg-admin-accent-soft text-admin-accent'
            }`}
          >
            <DynamicIcon name={iconName} size={iconSize} />
          </span>
          <p className="leading-relaxed text-admin-ink-soft m-0">{message}</p>
        </div>
      </ModalBody>

      {/* Footer: tombol batal + konfirmasi */}
      <ModalFooter className="bg-admin-surface border-t border-admin-line-soft justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface
                     border border-admin-line hover:bg-admin-line-soft hover:text-admin-ink transition-all
                     cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer
                      shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        danger ? 'bg-admin-red hover:brightness-95' : 'bg-admin-accent hover:bg-admin-accent-strong'
                      }`}
        >
          {loading ? 'Memproses...' : confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}
