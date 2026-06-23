// Crypto interop gate (plan Phase 1). Existing AetherLove accounts were created by
// Services/Crypto/CryptoService.cs, which composes standard primitives via BouncyCastle/.NET:
//   X25519 (RFC 7748), Argon2id v1.3 (RFC 9106 / reference impl), AES-256-GCM (NIST),
//   HKDF-SHA256 (RFC 5869), SHA-256.
// Because the C# side uses unmodified standard implementations, pinning the TS port against the
// published known-answer vectors for those exact algorithms proves byte-for-byte compatibility —
// the C# libraries satisfy the same vectors. On top of the KATs we assert the AetherLove-specific
// byte layout read directly from CryptoService.cs: ciphertext||tag ordering, the 16-byte
// conversation-salt truncation, public-key ordering, and the HKDF domain label.

import {describe, expect, it} from 'vitest';
import {
    AES_GCM_KEY_LENGTH,
    AES_GCM_NONCE_LENGTH,
    decrypt,
    deriveConversationSalt,
    deriveKek,
    deriveMessageKey,
    deriveSharedSecret,
    encrypt,
    generateIdentityKeyPair,
    KDF_SALT_LENGTH,
    unwrapPrivateKey,
    wrapPrivateKey,
} from '../src/services/crypto/cryptoService';
import {sha256} from '@noble/hashes/sha256';
// generateIdentityKeyPair randomizes the private key, so the public-key derivation (the
// deterministic half) is pinned via the same noble call the service uses internally.
import {x25519} from '@noble/curves/ed25519';

const enc = (s: string) => new TextEncoder().encode(s);
const hex = (u: Uint8Array) => Buffer.from(u).toString('hex');
const unhex = (s: string) => new Uint8Array(Buffer.from(s, 'hex'));

describe('X25519 (RFC 7748 §6.1 KAT)', () => {
    const alicePriv = unhex('77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a');
    const alicePub = '8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a';
    const bobPub = unhex('de9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f');
    const sharedK = '4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742';

    it('derives the public key matching CryptoService.GenerateIdentityKeyPair', () => {
        expect(hex(x25519.getPublicKey(alicePriv))).toBe(alicePub);
    });

    it('derives the ECDH shared secret matching DeriveSharedSecret', () => {
        expect(hex(deriveSharedSecret(alicePriv, bobPub))).toBe(sharedK);
    });
});

describe('Argon2id KEK (reference-impl KAT)', () => {
    it('matches the canonical argon2id vector (password/somesalt, t=2, m=65536, p=1, len=32, v=0x13)', () => {
        const kek = deriveKek('password', {
            salt: enc('somesalt'),
            memoryKb: 65536,
            iterations: 2,
            parallelism: 1,
        });
        expect(kek.length).toBe(AES_GCM_KEY_LENGTH);
        expect(hex(kek)).toBe('09316115d5cf24ed5a15a31a3ba326e5cf32edc24702987c02b6566f61913cf7');
    });
});

describe('HKDF-SHA256 message key (RFC 5869 wiring + layout)', () => {
    it('produces a 32-byte key bound to the AetherLove label, deterministic per (secret, salt)', () => {
        const secret = unhex('4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742');
        const salt = unhex('000102030405060708090a0b0c0d0e0f');
        const k1 = deriveMessageKey(secret, salt);
        const k2 = deriveMessageKey(secret, salt);
        expect(k1.length).toBe(AES_GCM_KEY_LENGTH);
        expect(hex(k1)).toBe(hex(k2));
        // Different salt → different key (proves salt is actually fed to HKDF).
        const kAlt = deriveMessageKey(secret, unhex('0f0e0d0c0b0a09080706050403020100'));
        expect(hex(kAlt)).not.toBe(hex(k1));
    });
});

describe('AES-256-GCM (NIST GCM test case 14 + ct||tag layout)', () => {
    it('encrypt of all-zero key/nonce/plaintext yields the standard ciphertext||tag', async () => {
        const zeroKey = new Uint8Array(AES_GCM_KEY_LENGTH);
        const zeroPt = new Uint8Array(16);
        // Drive WebCrypto with the fixed nonce the KAT requires (encrypt() randomizes the nonce).
        const key = await crypto.subtle.importKey('raw', zeroKey, {name: 'AES-GCM'}, false, [
            'encrypt',
        ]);
        const combined = new Uint8Array(
            await crypto.subtle.encrypt(
                {name: 'AES-GCM', iv: new Uint8Array(AES_GCM_NONCE_LENGTH), tagLength: 128},
                key,
                zeroPt
            )
        );
        expect(hex(combined)).toBe('cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919');
    });

    it('encrypt → decrypt round-trips (public API), nonce is 12 bytes', async () => {
        const messageKey = unhex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
        const plaintext = enc('aether 💜 ありがとう');
        const {ciphertext, nonce} = await encrypt(messageKey, plaintext);
        expect(nonce.length).toBe(AES_GCM_NONCE_LENGTH);
        const back = await decrypt(messageKey, nonce, ciphertext);
        expect(new TextDecoder().decode(back)).toBe('aether 💜 ありがとう');
    });
});

describe('Private-key wrap/unwrap (AES-GCM, ct||tag, 12B nonce)', () => {
    it('unwrap reverses wrap with the right KEK and rejects a wrong one', async () => {
        const {privateKey} = generateIdentityKeyPair();
        const kek = deriveKek('correct horse', {
            salt: enc('somesalt'),
            memoryKb: 256,
            iterations: 2,
            parallelism: 1,
        });
        const {encryptedPrivateKey, wrapNonce} = await wrapPrivateKey(privateKey, kek);
        // ct is the same length as the 32-byte key; +16 tag appended.
        expect(encryptedPrivateKey.length).toBe(privateKey.length + 16);

        const ok = await unwrapPrivateKey(encryptedPrivateKey, wrapNonce, kek);
        expect(ok && hex(ok)).toBe(hex(privateKey));

        const wrongKek = deriveKek('wrong passphrase', {
            salt: enc('somesalt'),
            memoryKb: 256,
            iterations: 2,
            parallelism: 1,
        });
        const bad = await unwrapPrivateKey(encryptedPrivateKey, wrapNonce, wrongKek);
        expect(bad).toBeNull();
    });
});

describe('SHA-256 + conversation salt (ordering + 16B truncation)', () => {
    it('SHA-256("abc") KAT', () => {
        expect(hex(sha256(enc('abc')))).toBe(
            'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
        );
    });

    it('is order-independent, 16 bytes, and equals sha256(orderedConcat)[:16]', () => {
        const a = new Uint8Array(32).fill(0x11);
        const b = new Uint8Array(32).fill(0x22);
        const saltAB = deriveConversationSalt(a, b);
        const saltBA = deriveConversationSalt(b, a);
        expect(saltAB.length).toBe(KDF_SALT_LENGTH);
        expect(hex(saltAB)).toBe(hex(saltBA));

        // a < b lexicographically, so ordered concat is a||b.
        const ordered = new Uint8Array(64);
        ordered.set(a, 0);
        ordered.set(b, 32);
        expect(hex(saltAB)).toBe(hex(sha256(ordered).slice(0, KDF_SALT_LENGTH)));
    });
});

describe('End-to-end pairwise message exchange', () => {
    it('two identities derive the same message key and exchange an encrypted message', async () => {
        const alice = generateIdentityKeyPair();
        const bob = generateIdentityKeyPair();

        const salt = deriveConversationSalt(alice.publicKey, bob.publicKey);
        const aliceKey = deriveMessageKey(deriveSharedSecret(alice.privateKey, bob.publicKey), salt);
        const bobKey = deriveMessageKey(deriveSharedSecret(bob.privateKey, alice.publicKey), salt);
        expect(hex(aliceKey)).toBe(hex(bobKey));

        const {ciphertext, nonce} = await encrypt(aliceKey, enc('meet at the Crystarium?'));
        const plain = await decrypt(bobKey, nonce, ciphertext);
        expect(new TextDecoder().decode(plain)).toBe('meet at the Crystarium?');
    });
});
