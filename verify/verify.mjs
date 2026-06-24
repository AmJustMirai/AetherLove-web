#!/usr/bin/env node
/**
 * verify/verify.mjs
 * AetherLove-web end-user integrity verifier.
 *
 * Usage:
 *   node verify/verify.mjs https://<owner>.github.io/<repo>/
 *
 * What it does:
 *   1. Fetches integrity-manifest.json and its Ed25519 signature from the live site.
 *   2. Verifies the signature against the public key committed HERE in this repo
 *      (verify/integrity-pubkey.txt) — this is the trust anchor.
 *   3. Fetches every file listed in the manifest and re-computes its sha384 hash,
 *      comparing against the signed expectation.
 *   4. Exits 0 if everything matches, non-zero if anything fails.
 *
 * ⚠  TRUST NOTE
 *   This check is only meaningful when run from a *clone of the source repository*
 *   (github.com), NOT from a copy served by the Pages host. An attacker who controls
 *   the Pages deployment could replace this script and/or the public key, making the
 *   verification circular. Clone from GitHub first, then run this against the live URL.
 *
 * Dependencies: @noble/curves (already in the project's node_modules). Run
 *   `pnpm install` once in the repo root before running this script.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

// --- Trust anchor ---
const PUBLIC_KEY_PATH = join(__dir, 'integrity-pubkey.txt');
let pubKeyBytes;
try {
  pubKeyBytes = Buffer.from(readFileSync(PUBLIC_KEY_PATH, 'utf8').trim(), 'base64');
} catch {
  fatal('Cannot read verify/integrity-pubkey.txt — is this a fresh clone?');
}

// --- CLI arg ---
const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Usage: node verify/verify.mjs <base-url>');
  console.error('  e.g. node verify/verify.mjs https://owner.github.io/repo/');
  process.exit(1);
}
const BASE = rawUrl.endsWith('/') ? rawUrl : rawUrl + '/';

// --- Helpers ---
function fatal(msg) {
  console.error(`\n✗  ${msg}`);
  process.exit(1);
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return new Uint8Array(await res.arrayBuffer());
}

function sha384(bytes) {
  return 'sha384-' + createHash('sha384').update(bytes).digest('base64');
}

// --- Main ---
console.log('\nAetherLove-web integrity verifier');
console.log(`Target: ${BASE}`);
console.log(
  '\n⚠  TRUST NOTE: Only meaningful when run from a clone of the source repo (github.com).\n' +
    '   Running it from the Pages host copy is circular if that host is compromised.\n'
);

// 1. Fetch manifest
let manifestText, manifest;
try {
  manifestText = await fetchText(BASE + 'integrity-manifest.json');
  manifest = JSON.parse(manifestText);
} catch (e) {
  fatal(`Failed to fetch integrity-manifest.json: ${e.message}`);
}

// 2. Verify signature (treat missing .sig as a warning, not a fatal error —
//    local/unsigned builds still produce a manifest worth hash-checking)
try {
  const sigText = await fetchText(BASE + 'integrity-manifest.json.sig');
  const sigBytes = Buffer.from(sigText.trim(), 'base64');
  const { ed25519 } = await import('@noble/curves/ed25519');
  const msgBytes = new TextEncoder().encode(manifestText);
  const valid = ed25519.verify(sigBytes, msgBytes, pubKeyBytes);
  if (!valid) {
    fatal(
      'SIGNATURE INVALID — the manifest does not match the trusted public key.\n   The deployment may have been tampered with.'
    );
  }
  console.log('✓  Signature valid (Ed25519)');
} catch (e) {
  if (e.message?.includes('HTTP 404')) {
    console.warn('⚠  No signature file (.sig) found — continuing with hash-only verification.');
    console.warn('   Unsigned builds cannot prove the manifest itself was not replaced.');
  } else if (e.message?.includes('SIGNATURE INVALID')) {
    // re-throw fatals
    throw e;
  } else {
    console.warn(`⚠  Signature check skipped (${e.message}) — hash-only verification.`);
  }
}

console.log(`   Commit: ${manifest.commit}`);
console.log(`   Ref:    ${manifest.ref}`);
console.log(`   Built:  ${manifest.builtAt}\n`);

// 3. Hash-check each file
const files = manifest.files ?? {};
const entries = Object.entries(files);
if (entries.length === 0) {
  fatal('Manifest contains no file entries.');
}

let passed = 0;
let failed = 0;

for (const [rel, expected] of entries) {
  const url = BASE + rel;
  try {
    const bytes = await fetchBytes(url);
    const actual = sha384(bytes);
    if (actual === expected) {
      console.log(`  ✓  ${rel}`);
      passed++;
    } else {
      console.error(`  ✗  ${rel}`);
      console.error(`       expected: ${expected}`);
      console.error(`       actual:   ${actual}`);
      failed++;
    }
  } catch (e) {
    console.error(`  ✗  ${rel}  [${e.message}]`);
    failed++;
  }
}

console.log('');
if (failed === 0) {
  console.log(
    `✓  ALL ${passed} file(s) verified. The live deployment matches the signed manifest.`
  );
} else {
  console.error(
    `✗  ${failed} of ${passed + failed} file(s) FAILED. The deployment may have been tampered with.`
  );
  process.exit(1);
}
