import { useEffect, useState } from 'preact/hooks';
import { ImageWithFallback } from '@/ui/ImageWithFallback/ImageWithFallback';
import { PRODUCT_COPY } from '../copy';
import type { ProductImageLike } from '../model/variant-selection';
import styles from './ProductGallery.module.css';

export interface ProductGalleryProps {
  readonly productName: string;
  readonly images: readonly ProductImageLike[];
}

export function ProductGallery({ productName, images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

  const activeImage = images[selectedIndex] ?? images[0];

  return (
    <div class={styles.gallery}>
      <div class={styles.mainFrame}>
        <ImageWithFallback
          src={activeImage?.url ?? null}
          alt={productName}
          aspectRatio="4/5"
          eager
          fetchPriority="high"
          fallbackText={PRODUCT_COPY.gallery.noImageFallback}
        />
      </div>

      {images.length > 1 ? (
        <div class={styles.thumbs}>
          {images.map((image, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={`${image.url}-${image.sortOrder}-${index}`}
                type="button"
                class={`${styles.thumbButton}${isSelected ? ` ${styles.thumbActive}` : ''}`}
                aria-label={PRODUCT_COPY.gallery.thumbnailLabel(index + 1, images.length)}
                aria-pressed={isSelected ? 'true' : 'false'}
                onClick={() => setSelectedIndex(index)}
              >
                <ImageWithFallback src={image.url} alt="" aspectRatio="4/5" eager={index < 4} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
