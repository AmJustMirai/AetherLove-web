// Wire-primitive aliases shared by the ported DTOs.
//
// These types describe the JS shapes produced/consumed by @microsoft/signalr-protocol-msgpack
// against the server's MessagePack ContractlessStandardResolver (keyAsPropertyName), so every DTO
// field name below is PascalCase to match the C# property names on the wire.

/** C# Guid. Serialized by the contractless resolver as its 36-char string form. */
export type Guid = string;

/** C# byte[]. MessagePack bin → JS Uint8Array on decode; pass Uint8Array on encode. */
export type Bytes = Uint8Array;

/**
 * C# DateTimeOffset. The contractless/standard resolver writes it as the MessagePack timestamp
 * extension, which the JS msgpack codec decodes to a `Date`. We normalize to an ISO string at the
 * hub boundary (see signal/codec.ts) so app code sees a stable, comparable value.
 */
export type DateTimeOffset = string;
