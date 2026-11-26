import type { ComponentChildren, RefObject } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import { IconButton } from '../Button/IconButton';
import { Icon } from '../Icon/Icon';
import { X } from '../Icon/icons';
import styles from './Dialog.module.css';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly size?: DialogSize;
  readonly onClose: () => void;
  readonly initialFocusRef?: RefObject<HTMLElement>;
  readonly closeLabel?: string;
  readonly footer?: ComponentChildren;
  readonly children: ComponentChildren;
}

export function Dialog({
  open,
  title,
  size = 'md',
  onClose,
  initialFocusRef,
  closeLabel = 'Close dialog',
  footer,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const supportsShowModal = typeof dialogEl.showModal === 'function';

    if (open && !wasOpenRef.current) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (supportsShowModal) {
        if (!dialogEl.open) {
          dialogEl.showModal();
        }
      } else {
        dialogEl.setAttribute('open', '');
      }

      const target = initialFocusRef?.current ?? closeButtonRef.current ?? dialogEl;
      target.focus();
      wasOpenRef.current = true;
    } else if (!open && wasOpenRef.current) {
      if (supportsShowModal) {
        if (dialogEl.open) {
          dialogEl.close();
        }
      } else {
        dialogEl.removeAttribute('open');
      }

      const opener = openerRef.current;
      openerRef.current = null;
      wasOpenRef.current = false;
      if (opener && opener.isConnected) {
        opener.focus();
      }
    }
  }, [open, initialFocusRef]);

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl || !open) return;

    function handleCancel(event: Event) {
      event.preventDefault();
      onCloseRef.current();
    }

    function handleClick(event: MouseEvent) {
      if (event.target === dialogEl) {
        onCloseRef.current();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    }

    dialogEl.addEventListener('cancel', handleCancel);
    dialogEl.addEventListener('click', handleClick);
    dialogEl.addEventListener('keydown', handleKeyDown);
    return () => {
      dialogEl.removeEventListener('cancel', handleCancel);
      dialogEl.removeEventListener('click', handleClick);
      dialogEl.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      class={`${styles.dialog} ${styles[size]}`}
    >
      {open ? (
        <div class={styles.surface}>
          <div class={styles.header}>
            <h2 id={titleId} class={styles.title}>
              {title}
            </h2>
            <IconButton
              buttonRef={closeButtonRef}
              label={closeLabel}
              variant="quiet"
              class={styles.closeBtn}
              onClick={onClose}
            >
              <Icon icon={X} size={20} />
            </IconButton>
          </div>
          <div class={styles.body}>{children}</div>
          {footer ? <div class={styles.footer}>{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
