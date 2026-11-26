import { mountPage } from '@/app/mountPage';
import { AdminShell } from '@/layouts';

function AdminProductEditorPlaceholderPage() {
  return (
    <AdminShell activeSection="products">
      <h1>Product editor</h1>
    </AdminShell>
  );
}

mountPage(AdminProductEditorPlaceholderPage);
