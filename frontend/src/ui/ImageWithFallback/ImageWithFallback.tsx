import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../Icon/Icon';
import { ImageOff } from '../Icon/icons';
import styles from './ImageWithFallback.module.css';

export type ImageAspectRatio = '4/5' | '1/1' | '16/9';

export interface ImageWithFallbackProps {
  readonly src: string | null | undefined;
  readonly alt: string;
  readonly aspectRatio?: ImageAspectRatio;
  readonly eager?: boolean;
  readonly fetchPriority?: 'high' | 'low' | 'auto';
  readonly fallbackText?: string;
  readonly class?: string;
  readonly imgClass?: string;
}

export function isAllowedImageUrl(url: string | null | undefined): url is string {
  if (!url) {
    return false;
  }
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function ratioClass(ratio: ImageAspectRatio): string {
  if (ratio === '1/1') return styles['ratio-1-1'] ?? '';
  if (ratio === '16/9') return styles['ratio-16-9'] ?? '';
  return styles['ratio-4-5'] ?? '';
}

export function ImageWithFallback({
  src,
  alt,
  aspectRatio = '4/5',
  eager = false,
  fetchPriority,
  fallbackText,
  class: className,
  imgClass,
}: ImageWithFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  const validUrl = isAllowedImageUrl(src) ? src.trim() : null;
  const shouldShowFallback = !validUrl || failedSrc === validUrl;

  return (
    <div class={`${styles.frame} ${ratioClass(aspectRatio)}${className ? ` ${className}` : ''}`}>
      {shouldShowFallback ? (
        <div class={styles.fallback}>
          <Icon icon={ImageOff} size={24} />
          {fallbackText ? <span class={styles.fallbackLabel}>{fallbackText}</span> : null}
        </div>
      ) : (
        <img
          src={validUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={fetchPriority}
          decoding="async"
          class={`${styles.img}${imgClass ? ` ${imgClass}` : ''}`}
          onError={() => {
            setFailedSrc(validUrl);
          }}
        />
      )}
    </div>
  );
}
