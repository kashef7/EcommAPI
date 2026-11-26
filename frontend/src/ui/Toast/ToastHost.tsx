import { Toast } from './Toast';
import { dismissToast, toastsSignal } from './toast-store';
import styles from './Toast.module.css';

export function ToastHost() {
  const items = toastsSignal.value;
  if (items.length === 0) {
    return null;
  }

  return (
    <div class={styles.host} aria-label="Notifications">
      {items.map((item) => (
        <Toast key={item.id} item={item} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
