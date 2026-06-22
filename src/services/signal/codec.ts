// Wire-shape helpers for the MessagePack hub boundary.
//
// The server uses MessagePack's ContractlessStandardResolver. Two shapes need care on the JS side:
//
//  • byte[]  → @msgpack/msgpack decodes MessagePack bin to Uint8Array, and encodes Uint8Array to
//              bin, so the DTO `Bytes` fields map straight through. No conversion needed.
//
//  • DateTimeOffset → the standard resolver serializes it via its built-in formatter as a 2-element
//              array [DateTime, offsetMinutes]; the DateTime is the MessagePack timestamp extension
//              (ext -1), which the codec decodes to a JS `Date`. Older/other server paths may emit a
//              bare timestamp (→ Date) or an ISO string. `toIsoString` accepts all three so app code
//              gets a stable, comparable ISO-8601 string regardless of the encoder path.

/** Normalizes any wire form of a C# DateTimeOffset to an ISO-8601 UTC string. */
export function toIsoString(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    // [DateTime, offsetMinutes] — the offset only shifts the labeled zone; the instant is the Date.
    if (Array.isArray(value) && value.length >= 1) {
        const [instant] = value;
        if (instant instanceof Date) return instant.toISOString();
        if (typeof instant === 'string') return instant;
        if (typeof instant === 'number') return new Date(instant).toISOString();
    }
    if (typeof value === 'number') return new Date(value).toISOString();
    return '';
}

/** Nullable variant: passes null/undefined through as null. */
export function toIsoStringOrNull(value: unknown): string | null {
    if (value == null) return null;
    const s = toIsoString(value);
    return s === '' ? null : s;
}
