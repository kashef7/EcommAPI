import type { ComponentChildren } from 'preact';

export interface VisuallyHiddenProps {
  readonly children: ComponentChildren;
  readonly as?: 'span' | 'div';
}

export function VisuallyHidden({ children, as = 'span' }: VisuallyHiddenProps) {
  if (as === 'div') {
    return <div class="rm-sr-only">{children}</div>;
  }
  return <span class="rm-sr-only">{children}</span>;
}
