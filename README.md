# AetherLove - Web Client

A standalone browser-based port of the AetherLove FFXIV matchmaking plugin.

This project is not an original creation. It is a port of the existing plugin, rewritten for the browser.

The client is hosted on GitHub Pages and can be accessed at:
**https://amjustmirai.github.io/AetherLove-web/**

---

## Support & Maintenance

This project is provided as-is. There are no plans for active support, ongoing maintenance, or feature parity updates with the original plugin.

---

## Security & Trust

**Public-hosted instances should be treated with suspicion.**
If you are using a version of this client hosted by someone else, you have no way to verify that the source has not been
tampered with. This applies equally to any Dalamud plugin, Aetherlove included.

There is an integrity check on public keys received through the client. Should a man-in-the-middle attempt occur, the site will surface a notification. But this is a mitigation, not a guarantee of safety.

### Verifying the official deployment

The official deployment at `amjustmirai.github.io/AetherLove-web/` has two independent tamper-detection mechanisms:

**1. SLSA build provenance** — every CI build is cryptographically attested via GitHub's OIDC/Sigstore integration,
binding the deployed files to the exact source commit and workflow run. Verify any downloaded asset with:

```sh
gh attestation verify <asset-file> --repo amjustmirai/AetherLove-web
```

**2. Signed integrity manifest** — the deployment includes `integrity-manifest.json`, a sha384 hash of every deployed
file, signed with an Ed25519 key whose private half lives only as a GitHub repo secret. To verify the live site matches
the signed build, clone the source repo and run the verifier from there (running it from the Pages host would be
circular):

```sh
git clone https://github.com/amjustmirai/AetherLove-web.git
cd AetherLove-web
pnpm install
node verify/verify.mjs https://amjustmirai.github.io/AetherLove-web/
```

The public key used to verify the signature is committed at `verify/integrity-pubkey.txt`. See `verify/README.md` for
full details, browser-based verification, and key rotation instructions.

---

## Open Source

The full source is available for review. Anyone is welcome to audit the code, explore its behavior, and assess any concerns around what the original plugin developer has described as "untrusted behaviour." Draw your own conclusions.

---

## Disclaimer

This project is not affiliated with, endorsed by, or associated with the AetherLove plugin, its developers, or any related parties. It is an independent, unofficial port with no formal relationship to the original project.
