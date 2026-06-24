# AetherLove-web — Integrity Verification

This directory contains the trust anchor and verifier tools for confirming that the live
GitHub Pages deployment of AetherLove-web matches an authentic signed build from source.

## Why this exists

AetherLove-web is an E2E-crypto app. The threat that matters is someone tampering with the
deployed JS/CSS to exfiltrate private keys or messages. GitHub Pages cannot serve real HTTP
response headers (only the meta-tag CSP in `vite.config.ts`), and any runtime self-check inside
the app is bypassable by the same attacker. Integrity verification must be anchored elsewhere.

**Two independent mechanisms:**

| Mechanism                      | What it proves                                                                                       | How to use                                                 |
|--------------------------------|------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| **SLSA build provenance**      | Deployed `dist` was produced by the exact source commit + CI workflow, not by an out-of-band process | `gh attestation verify <asset-file> --repo <owner>/<repo>` |
| **Signed manifest** (this dir) | Every file currently served on Pages matches the sha384 hashes from the signed build                 | `node verify/verify.mjs <pages-url>`                       |

## ⚠ Critical trust note

**Always run the verifier from a clone of the source repository, not from the Pages host.**

If you download `verify/verify.mjs` or `verify/integrity-pubkey.txt` from the live Pages
deployment, an attacker controlling that host could have replaced them, making verification
circular. Clone from `github.com`, then run from that clone:

```sh
git clone https://github.com/<owner>/<repo>.git
cd <repo>
pnpm install
node verify/verify.mjs https://<owner>.github.io/<repo>/
```

## Files

| File                   | Purpose                                            |
|------------------------|----------------------------------------------------|
| `integrity-pubkey.txt` | Ed25519 **public key** (base64) — the trust anchor |
| `verify.mjs`           | Node CLI verifier (signature + hash check)         |
| `index.html`           | Browser verifier (open locally, see note below)    |

## Running the CLI verifier

```sh
# From the repo root, after pnpm install:
node verify/verify.mjs https://<owner>.github.io/<repo>/
```

Exits 0 on full pass, non-zero if any file hash or the signature fails.

## Running the browser verifier

Open `verify/index.html` directly from your local clone (e.g. drag into Chrome, or `open verify/index.html`). Enter the
Pages URL and click Verify.

> **Only meaningful when opened locally.** A copy served from the Pages host is as trustworthy
> as the host itself. The browser verifier also loads `@noble/curves` from esm.sh — if you need
> fully offline verification, use the CLI verifier instead (it uses `node_modules`).

## How it works

1. `pnpm run build` chains `scripts/gen-integrity-manifest.mjs` as a post-build step.
2. That script walks `dist/`, computes sha384 for each file, and writes
   `dist/integrity-manifest.json`. In CI, it also Ed25519-signs the canonical manifest JSON
   (private key from `INTEGRITY_SIGNING_KEY` repo secret) and writes `dist/integrity-manifest.json.sig`.
3. Both files are deployed alongside the app on Pages.
4. The verifier fetches them, checks the signature against the public key in this directory,
   then re-fetches and re-hashes every file listed in the manifest.

## CI / key setup (maintainer reference)

The signing keypair was generated with `@noble/curves/ed25519`. To rotate or set up for a fork:

```js
// keygen (run once):
import {ed25519} from '@noble/curves/ed25519';

const priv = ed25519.utils.randomPrivateKey();
const pub = ed25519.getPublicKey(priv);
console.log('private (→ GitHub secret):', Buffer.from(priv).toString('base64'));
console.log('public  (→ verify/integrity-pubkey.txt):', Buffer.from(pub).toString('base64'));
```

1. Add the private key as a GitHub repo secret named **`INTEGRITY_SIGNING_KEY`**.
2. Replace the content of `verify/integrity-pubkey.txt` with the new public key.
3. Commit `verify/integrity-pubkey.txt`.

The workflow (`deploy-pages.yml`) already passes `INTEGRITY_SIGNING_KEY` to the build step and
runs `actions/attest-build-provenance` for a second independent binding.

## Composing with SLSA provenance

After CI deploys, verify at the SLSA layer too:

```sh
# Download any deployed asset, then:
gh attestation verify <asset-file> --repo <owner>/<repo>
```

This confirms the file was produced by the repo's Actions workflow (Sigstore/OIDC; no separate secret needed). Together
with the manifest signature, you have two independent trust paths:

- **SLSA**: source commit → GitHub Actions → deployed artifact (verified by Sigstore/GitHub)
- **Manifest**: deployed files → sha384 → Ed25519 manifest → public key in source repo
