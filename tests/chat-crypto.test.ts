// Exercises the chat-layer glue (chatCrypto.ts) end to end: identity creation + passphrase
// wrap/unwrap, and a full encrypt→wire→decrypt exchange between two identities.

import {describe, expect, it} from 'vitest';
import {
    createIdentityBundle,
    decryptFromPeer,
    encryptForPeer,
    unlockIdentity,
} from '../src/services/messaging/chatCrypto';

describe('createIdentityBundle / unlockIdentity', () => {
    it('round-trips the private key through a passphrase and rejects the wrong one', async () => {
        const {identity, bundle} = await createIdentityBundle('correct horse battery staple');
        expect(bundle.PublicKey).toEqual(identity.publicKey);

        const unlocked = await unlockIdentity(bundle, 'correct horse battery staple');
        expect(unlocked).not.toBeNull();
        expect(Buffer.from(unlocked!.privateKey).toString('hex')).toBe(
            Buffer.from(identity.privateKey).toString('hex'),
        );

        expect(await unlockIdentity(bundle, 'wrong')).toBeNull();
    });
});

describe('encryptForPeer / decryptFromPeer', () => {
    it('two parties exchange an encrypted message over the wire shape', async () => {
        const alice = (await createIdentityBundle('alice-pass')).identity;
        const bob = (await createIdentityBundle('bob-pass')).identity;

        const req = await encryptForPeer(alice, 'bob-profile-id', bob.publicKey, 'see you in Limsa 🌊');
        expect(req.PeerProfileId).toBe('bob-profile-id');
        expect(req.Nonce.length).toBe(12);

        // Bob decrypts using Alice's public key + the wire ciphertext/nonce.
        const plain = await decryptFromPeer(bob, alice.publicKey, {
            Ciphertext: req.Ciphertext,
            Nonce: req.Nonce,
        });
        expect(plain).toBe('see you in Limsa 🌊');
    });
});
