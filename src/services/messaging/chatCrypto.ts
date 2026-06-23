// E2E chat helpers binding the crypto primitives to the hub message DTOs. Mirrors how the plugin
// derives a per-conversation key (CryptoService.DeriveConversationSalt + DeriveSharedSecret +
// DeriveMessageKey) and wraps/unwraps messages on the wire (Ciphertext = ct||tag, Nonce separate).

import {
  decrypt,
  deriveConversationSalt,
  deriveKek,
  deriveMessageKey,
  deriveSharedSecret,
  encrypt,
  generateIdentityKeyPair,
  type IdentityKeyPair,
  unwrapPrivateKey,
  wrapPrivateKey,
} from '../crypto/cryptoService';
import type { EncryptedMessageDto, KeyBundleDto, SendMessageRequest } from '../../shared/dtos';
import type { Guid } from '../../shared/wire';

// Default Argon2id parameters for newly created identities. Existing accounts MUST use the params
// stored in their KeyBundleDto (read them, don't assume these).
export const DEFAULT_KDF = { memoryKb: 65536, iterations: 3, parallelism: 1 } as const;

/** Derives the conversation message key for an unlocked identity ↔ a peer public key. */
export function deriveConversationFor(
  identity: IdentityKeyPair,
  peerPublicKey: Uint8Array
): Uint8Array {
  const salt = deriveConversationSalt(identity.publicKey, peerPublicKey);
  const shared = deriveSharedSecret(identity.privateKey, peerPublicKey);
  return deriveMessageKey(shared, salt);
}

/** Encrypts plaintext for a peer, producing the SendMessageRequest wire shape. */
export async function encryptForPeer(
  identity: IdentityKeyPair,
  peerProfileId: Guid,
  peerPublicKey: Uint8Array,
  plaintext: string
): Promise<SendMessageRequest> {
  const key = deriveConversationFor(identity, peerPublicKey);
  const { ciphertext, nonce } = await encrypt(key, new TextEncoder().encode(plaintext));
  return { PeerProfileId: peerProfileId, Ciphertext: ciphertext, Nonce: nonce };
}

/** Decrypts a stored/received message from a peer back to plaintext. */
export async function decryptFromPeer(
  identity: IdentityKeyPair,
  peerPublicKey: Uint8Array,
  msg: Pick<EncryptedMessageDto, 'Ciphertext' | 'Nonce'>
): Promise<string> {
  const key = deriveConversationFor(identity, peerPublicKey);
  const plain = await decrypt(key, msg.Nonce, msg.Ciphertext);
  return new TextDecoder().decode(plain);
}

/** Creates a fresh identity and the KeyBundleDto to upload, wrapping the private key under a passphrase. */
export async function createIdentityBundle(
  passphrase: string
): Promise<{ identity: IdentityKeyPair; bundle: KeyBundleDto }> {
  const identity = generateIdentityKeyPair();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kek = deriveKek(passphrase, { salt, ...DEFAULT_KDF });
  const { encryptedPrivateKey, wrapNonce } = await wrapPrivateKey(identity.privateKey, kek);
  const bundle: KeyBundleDto = {
    PublicKey: identity.publicKey,
    EncryptedPrivateKey: encryptedPrivateKey,
    KdfSalt: salt,
    KdfMemoryKb: DEFAULT_KDF.memoryKb,
    KdfIterations: DEFAULT_KDF.iterations,
    KdfParallelism: DEFAULT_KDF.parallelism,
    WrapNonce: wrapNonce,
  };
  return { identity, bundle };
}

/** Unlocks an identity from a stored KeyBundleDto using the passphrase. Returns null on wrong passphrase. */
export async function unlockIdentity(
  bundle: KeyBundleDto,
  passphrase: string
): Promise<IdentityKeyPair | null> {
  const kek = deriveKek(passphrase, {
    salt: bundle.KdfSalt,
    memoryKb: bundle.KdfMemoryKb,
    iterations: bundle.KdfIterations,
    parallelism: bundle.KdfParallelism,
  });
  const privateKey = await unwrapPrivateKey(bundle.EncryptedPrivateKey, bundle.WrapNonce, kek);
  if (!privateKey) return null;
  return { publicKey: bundle.PublicKey, privateKey };
}
