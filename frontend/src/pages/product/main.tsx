import { mountPage } from '@/app/mountPage';
import { refreshCartSummary } from '@/features/cart/summary';
import { ProductView } from '@/features/product';
import { SiteShell } from '@/layouts';

function ProductPage() {
  return (
    <SiteShell>
      <ProductView
        onCartUpdated={() => {
          void refreshCartSummary();
        }}
      />
    </SiteShell>
  );
}

mountPage(ProductPage);
