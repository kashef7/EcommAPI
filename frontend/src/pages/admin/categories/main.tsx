import { mountPage } from '@/app/mountPage';
import { AdminCategoriesView } from '@/features/admin/categories';
import { AdminShell } from '@/layouts';

function AdminCategoriesPage() {
  return (
    <AdminShell activeSection="categories">
      <AdminCategoriesView />
    </AdminShell>
  );
}

mountPage(AdminCategoriesPage);
