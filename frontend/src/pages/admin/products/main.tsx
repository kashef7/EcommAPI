import { mountPage } from '@/app/mountPage';
import { AdminShell } from '@/layouts';

function AdminProductsPlaceholderPage() {
  return (
    <AdminShell activeSection="products">
      <h1>Products</h1>
    </AdminShell>
  );
}

mountPage(AdminProductsPlaceholderPage);
