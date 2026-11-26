import { mountPage } from '@/app/mountPage';
import { AdminShell } from '@/layouts';

function AdminCategoriesPlaceholderPage() {
  return (
    <AdminShell activeSection="categories">
      <h1>Categories</h1>
    </AdminShell>
  );
}

mountPage(AdminCategoriesPlaceholderPage);
