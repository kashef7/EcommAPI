import { mountPage } from '@/app/mountPage';
import { CatalogView } from '@/features/catalog';
import { SiteShell } from '@/layouts';

function HomePage() {
  return (
    <SiteShell activeNav="shop">
      <CatalogView />
    </SiteShell>
  );
}

mountPage(HomePage);
