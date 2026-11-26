import { routes } from '@/core/navigation/routes';
import { isValidGuid } from '@/core/validation/validators';
import { buttonClassNames } from '@/ui/Button/Button';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { ADMIN_PRODUCT_EDITOR_COPY } from '../editor-copy';
import { AdminProductCreateView } from './AdminProductCreateView';
import { AdminProductEditView } from './AdminProductEditView';

function readProductIdFromLocation():
  | { readonly mode: 'create' }
  | { readonly mode: 'invalid' }
  | { readonly mode: 'edit'; readonly id: string } {
  if (typeof window === 'undefined') {
    return { mode: 'create' };
  }
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('id');
  if (rawId === null || rawId.trim() === '') {
    return { mode: 'create' };
  }
  const trimmed = rawId.trim();
  if (!isValidGuid(trimmed)) {
    return { mode: 'invalid' };
  }
  return { mode: 'edit', id: trimmed };
}

export function AdminProductEditorView() {
  const target = readProductIdFromLocation();

  if (target.mode === 'invalid') {
    return (
      <EmptyState
        heading={ADMIN_PRODUCT_EDITOR_COPY.notFound.heading}
        message={ADMIN_PRODUCT_EDITOR_COPY.notFound.message}
        action={
          <a href={routes.adminProducts()} class={buttonClassNames({ variant: 'secondary' })}>
            {ADMIN_PRODUCT_EDITOR_COPY.notFound.actionLabel}
          </a>
        }
      />
    );
  }

  if (target.mode === 'edit') {
    return <AdminProductEditView productId={target.id} />;
  }

  return <AdminProductCreateView />;
}
