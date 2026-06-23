// Port of Widgets/LoadingSpinner.cs — a small spinning arc. CSS-driven so it respects
// prefers-reduced-motion via the global rule in index.css.

import { cn } from '../cn';

export function LoadingSpinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-2 border-current', className)}
      style={{
        width: size,
        height: size,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
      }}
      role="status"
      aria-label="Loading"
    />
  );
}
