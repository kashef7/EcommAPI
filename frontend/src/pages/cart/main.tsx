import { mountPage } from '@/app/mountPage';
import { CartView } from '@/features/cart';
import { SiteShell } from '@/layouts';

function CartPage() {
  return (
    <SiteShell activeNav="cart">
      <CartView />
    </SiteShell>
  );
}

mountPage(CartPage);
