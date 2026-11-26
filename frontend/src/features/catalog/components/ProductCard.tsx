import { formatMoney } from '@/core/format/money';
import { routes } from '@/core/navigation/routes';
import { Badge } from '@/ui/Badge/Badge';
import { ImageWithFallback } from '@/ui/ImageWithFallback/ImageWithFallback';
import { Price } from '@/ui/Price/Price';
import { CATALOG_COPY } from '../copy';
import styles from './ProductCard.module.css';

export interface ProductCardItem {
  readonly id: string;
  readonly name: string;
  readonly categoryName: string;
  readonly primaryImageUrl: string | null;
  readonly minPrice: number;
  readonly inStock: boolean;
  readonly tags: readonly string[];
}

export interface ProductCardProps {
  readonly product: ProductCardItem;
  readonly eagerImage?: boolean;
}

export function ProductCard({ product, eagerImage = false }: ProductCardProps) {
  const visibleTags = product.tags.slice(0, 2);

  return (
    <a href={routes.product(product.id)} class={styles.cardLink}>
      <div class={styles.mediaBox}>
        <ImageWithFallback
          src={product.primaryImageUrl}
          alt={product.name}
          aspectRatio="4/5"
          eager={eagerImage}
          fallbackText={CATALOG_COPY.card.noImageFallback}
          {...(styles.mediaImage ? { imgClass: styles.mediaImage } : {})}
        />
      </div>

      <div class={styles.body}>
        <p class="rm-eyebrow">{product.categoryName}</p>
        <h2 class={styles.title}>{product.name}</h2>

        <div class={styles.priceRow}>
          <Price
            prefix={CATALOG_COPY.card.fromPricePrefix}
            formatted={formatMoney(product.minPrice)}
            size="sm"
          />
          {!product.inStock ? (
            <Badge variant="danger">{CATALOG_COPY.card.soldOutBadge}</Badge>
          ) : null}
        </div>

        {visibleTags.length > 0 ? (
          <div class={styles.tagList}>
            {visibleTags.map((tag) => (
              <span key={tag} class={styles.tagPill}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </a>
  );
}
