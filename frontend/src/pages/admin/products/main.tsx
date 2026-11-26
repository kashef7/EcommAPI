import { mountPage } from '@/app/mountPage';
import { AdminProductsView } from '@/features/admin/products';
import { AdminShell } from '@/layouts';

function AdminProductsPage() {
  return (
    <AdminShell activeSection="products">
      <AdminProductsView />
    </AdminShell>
  );
}

mountPage(AdminProductsPage);
