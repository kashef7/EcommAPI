import type { ComponentType } from 'preact';
import type { LucideProps } from 'lucide-preact';

export type IconSize = 16 | 20 | 24;

export interface IconProps {
  readonly icon: ComponentType<LucideProps>;
  readonly size?: IconSize;
  readonly label?: string | undefined;
  readonly class?: string | undefined;
}

export function Icon({ icon: IconComponent, size = 20, label, class: className }: IconProps) {
  const isDecorative = !label;
  return (
    <IconComponent
      size={size}
      strokeWidth={1.75}
      class={className}
      aria-hidden={isDecorative ? 'true' : undefined}
      aria-label={label}
      role={isDecorative ? undefined : 'img'}
    />
  );
}
