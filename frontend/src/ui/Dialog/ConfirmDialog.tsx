import { useRef } from 'preact/hooks';
import { Button } from '../Button/Button';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly confirmVariant?: 'danger' | 'primary';
  readonly loading?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <Dialog
      open={open}
      title={title}
      size="sm"
      initialFocusRef={cancelButtonRef}
      onClose={() => {
        if (!loading) {
          onCancel();
        }
      }}
      footer={
        <>
          <Button
            buttonRef={cancelButtonRef}
            variant="secondary"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p class={styles.description}>{message}</p>
    </Dialog>
  );
}
