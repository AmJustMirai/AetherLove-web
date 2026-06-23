// Helpers for the WebP byte arrays the hub returns (avatars, portraits, photos). The plugin decoded
// these through Dalamud's texture provider; on the web we wrap them in object URLs. Browsers decode
// WebP natively (the connection already advertises acceptsWebp=true).

const MIME_WEBP = 'image/webp';

/** Wraps WebP bytes in a blob object URL. Returns null for empty input. Caller revokes via revoke(). */
export function webpUrl(bytes: Uint8Array | null | undefined, mime = MIME_WEBP): string | null {
  if (!bytes || bytes.length === 0) return null;
  // Copy into a fresh, plain ArrayBuffer: avoids leaking extra bytes from a sub-array view and sidesteps
  // the SharedArrayBuffer-vs-ArrayBuffer typing on Uint8Array as a BlobPart.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return URL.createObjectURL(new Blob([ab], { type: mime }));
}

export function revokeUrl(url: string | null | undefined): void {
  if (url) URL.revokeObjectURL(url);
}
