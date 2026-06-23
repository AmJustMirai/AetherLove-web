// Circular avatar from WebP bytes (deck cards, chat list, match overlay). Shows a neutral fallback
// fill while decoding / when absent (UiColors.AvatarFallback) with the soft containing ring
// (UiColors.AvatarRing).

import { useEffect, useState } from 'react';
import { revokeUrl, webpUrl } from '../image';
import { cn } from '../cn';

interface AvatarProps {
  bytes?: Uint8Array | null;
  /** Pre-made object URL (when the caller already created one). Takes precedence over bytes. */
  src?: string | null;
  size: number;
  className?: string;
  ring?: boolean;
}

export function Avatar({ bytes, src, size, className, ring = true }: AvatarProps) {
  const [url, setUrl] = useState<string | null>(src ?? null);

  useEffect(() => {
    if (src !== undefined) {
      setUrl(src ?? null);
      return;
    }
    const made = webpUrl(bytes);
    setUrl(made);
    return () => revokeUrl(made);
  }, [bytes, src]);

  return (
    <span
      className={cn(
        'inline-block overflow-hidden rounded-full bg-[#555]',
        ring && 'ring-1 ring-line/40',
        className
      )}
      style={{ width: size, height: size }}
    >
      {url && <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />}
    </span>
  );
}
