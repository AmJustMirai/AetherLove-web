// Byte-for-byte port of Services/Crypto/CryptoService.cs. Existing accounts, wrapped private keys,
// and stored ciphertext were produced by the C# implementation, so every primitive here must
// reproduce the exact byte layout. The C# side composes unmodified standard primitives, so the port
// is pinned in tests/crypto-interop.test.ts against the published known-answer vectors for those
// exact algorithms (RFC 7748, the Argon2 reference KAT, NIST GCM, RFC 5869) plus the AetherLove
// layout details. Do not "tidy" anything (nonce/tag ordering, salt truncation, label) without
// re-checking those tests.
//
// C#                              → web
//   BouncyCastle X25519           → @noble/curves x25519
//   BouncyCastle Argon2id (v1.3)  → @noble/hashes argon2id
//   System.Security AES-GCM       → WebCrypto AES-GCM
//   System.Security HKDF-SHA256   → @noble/hashes hkdf
//   System.Security SHA-256       → @noble/hashes sha256

import {x25519} from '@noble/curves/ed25519';
import {argon2id} from '@noble/hashes/argon2';
import {hkdf} from '@noble/hashes/hkdf';
import {sha256} from '@noble/hashes/sha256';

export const X25519_KEY_LENGTH = 32;
export const AES_GCM_KEY_LENGTH = 32;
export const AES_GCM_NONCE_LENGTH = 12;
export const KDF_SALT_LENGTH = 16;
export const AES_GCM_TAG_LENGTH = 16;

/** HKDF domain label. Mirrors MessageKeyInfo in CryptoService.cs. */
const MESSAGE_KEY_INFO = new TextEncoder().encode('AetherLove-chat-msg-key-v1');

const subtle = (): SubtleCrypto => {
    const c = globalThis.crypto?.subtle;
    if (!c) throw new Error('WebCrypto SubtleCrypto is unavailable in this environment.');
    return c;
};

const randomBytes = (n: number): Uint8Array => {
    const b = new Uint8Array(n);
    globalThis.crypto.getRandomValues(b);
    return b;
};

// WebCrypto's BufferSource is pinned to ArrayBuffer-backed views in current lib types; the @noble
// helpers return Uint8Array<ArrayBufferLike>. The bytes are identical, so adapt at the call site.
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

export interface IdentityKeyPair {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
}

export interface WrappedPrivateKey {
    /** ciphertext || tag (WebCrypto appends the 16-byte tag). Mirrors EncryptedPrivateKey. */
    encryptedPrivateKey: Uint8Array;
    wrapNonce: Uint8Array;
}

export interface EncryptResult {
    /** ciphertext || tag. Mirrors the C# Encrypt "combined" output. */
    ciphertext: Uint8Array;
    nonce: Uint8Array;
}

/** Argon2id parameters; read from the stored KeyBundleDto, never hardcoded. */
export interface KdfParams {
    salt: Uint8Array;
    memoryKb: number;
    iterations: number;
    parallelism: number;
}

async function importAesKey(raw: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
    return subtle().importKey('raw', bs(raw), {name: 'AES-GCM'}, false, [usage]);
}

/** X25519 identity keypair (32B public / 32B private). */
export function generateIdentityKeyPair(): IdentityKeyPair {
    const privateKey = randomBytes(X25519_KEY_LENGTH);
    const publicKey = x25519.getPublicKey(privateKey);
    return {publicKey, privateKey};
}

/** Passphrase → 32B KEK via Argon2id v1.3 using the bundle's stored params. */
export function deriveKek(passphrase: string, params: KdfParams): Uint8Array {
    return argon2id(new TextEncoder().encode(passphrase), params.salt, {
        t: params.iterations,
        m: params.memoryKb,
        p: params.parallelism,
        dkLen: AES_GCM_KEY_LENGTH,
        version: 0x13,
    });
}

/** AES-256-GCM wrap of the private key under the KEK. Output is ciphertext||tag, random 12B nonce. */
export async function wrapPrivateKey(
    privateKey: Uint8Array,
    kek: Uint8Array
): Promise<WrappedPrivateKey> {
    const wrapNonce = randomBytes(AES_GCM_NONCE_LENGTH);
    const key = await importAesKey(kek, 'encrypt');
    const combined = new Uint8Array(
        await subtle().encrypt(
            {name: 'AES-GCM', iv: bs(wrapNonce), tagLength: AES_GCM_TAG_LENGTH * 8},
            key,
            bs(privateKey)
        )
    );
    return {encryptedPrivateKey: combined, wrapNonce};
}

/** Reverses wrapPrivateKey. Returns null on auth-tag mismatch (wrong passphrase). */
export async function unwrapPrivateKey(
    encryptedPrivateKey: Uint8Array,
    wrapNonce: Uint8Array,
    kek: Uint8Array
): Promise<Uint8Array | null> {
    if (encryptedPrivateKey.length < AES_GCM_TAG_LENGTH) return null;
    try {
        const key = await importAesKey(kek, 'decrypt');
        const plain = await subtle().decrypt(
            {name: 'AES-GCM', iv: bs(wrapNonce), tagLength: AES_GCM_TAG_LENGTH * 8},
            key,
            bs(encryptedPrivateKey)
        );
        return new Uint8Array(plain);
    } catch {
        return null;
    }
}

/** Raw X25519 ECDH shared secret (32B). */
export function deriveSharedSecret(
    myPrivateKey: Uint8Array,
    peerPublicKey: Uint8Array
): Uint8Array {
    return x25519.getSharedSecret(myPrivateKey, peerPublicKey);
}

/** HKDF-SHA256(sharedSecret, salt, "AetherLove-chat-msg-key-v1") → 32B message key. */
export function deriveMessageKey(sharedSecret: Uint8Array, salt: Uint8Array): Uint8Array {
    return hkdf(sha256, sharedSecret, salt, MESSAGE_KEY_INFO, AES_GCM_KEY_LENGTH);
}

/** AES-256-GCM encrypt. Output is ciphertext||tag, random 12B nonce. */
export async function encrypt(
    messageKey: Uint8Array,
    plaintext: Uint8Array
): Promise<EncryptResult> {
    const nonce = randomBytes(AES_GCM_NONCE_LENGTH);
    const key = await importAesKey(messageKey, 'encrypt');
    const combined = new Uint8Array(
        await subtle().encrypt(
            {name: 'AES-GCM', iv: bs(nonce), tagLength: AES_GCM_TAG_LENGTH * 8},
            key,
            bs(plaintext)
        )
    );
    return {ciphertext: combined, nonce};
}

/** AES-256-GCM decrypt of a ciphertext||tag blob. Throws on tag mismatch. */
export async function decrypt(
    messageKey: Uint8Array,
    nonce: Uint8Array,
    ciphertextAndTag: Uint8Array
): Promise<Uint8Array> {
    if (ciphertextAndTag.length < AES_GCM_TAG_LENGTH) {
        throw new Error('Ciphertext shorter than auth tag.');
    }
    const key = await importAesKey(messageKey, 'decrypt');
    const plain = await subtle().decrypt(
        {name: 'AES-GCM', iv: bs(nonce), tagLength: AES_GCM_TAG_LENGTH * 8},
        key,
        bs(ciphertextAndTag)
    );
    return new Uint8Array(plain);
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
        if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    }
    return a.length - b.length;
}

/**
 * Deterministic per-pair salt: SHA-256 of the two public keys ordered by raw bytes (so both peers
 * derive the same value), truncated to 16 bytes. Mirrors DeriveConversationSalt.
 */
export function deriveConversationSalt(publicKeyA: Uint8Array, publicKeyB: Uint8Array): Uint8Array {
    const aFirst = compareBytes(publicKeyA, publicKeyB) <= 0;
    const first = aFirst ? publicKeyA : publicKeyB;
    const second = aFirst ? publicKeyB : publicKeyA;
    const buf = new Uint8Array(first.length + second.length);
    buf.set(first, 0);
    buf.set(second, first.length);
    return sha256(buf).slice(0, KDF_SALT_LENGTH);
}
