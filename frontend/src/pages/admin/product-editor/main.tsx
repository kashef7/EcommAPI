import { mountPage } from '@/app/mountPage';
import { AdminProductEditorView } from '@/features/admin/product-editor';
import { AdminShell } from '@/layouts';

function AdminProductEditorPage() {
  return (
    <AdminShell activeSection="products">
      <AdminProductEditorView />
    </AdminShell>
  );
}

mountPage(AdminProductEditorPage);
