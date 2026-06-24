#!/usr/bin/env node
/**
 * scripts/gen-integrity-manifest.mjs
 *
 * Post-build step that generates dist/integrity-manifest.json — a sha384 hash of every
 * file in dist/ — and, when INTEGRITY_SIGNING_KEY is set, an Ed25519 detached signature
 * at dist/integrity-manifest.json.sig.
 *
 * Chained into the build script so it runs automatically in CI:
 *   "build": "tsc -b && vite build && node scripts/gen-integrity-manifest.mjs"
 *
 * The hash format (sha384-<base64>) matches the W3C SRI encoding, making each entry
 * reusable as a <script integrity="…"> attribute if SRI is added later.
 *
 * Trust model: the manifest is *committed as a build artifact*, served from the same
 * Pages host as the app itself. Its integrity is anchored by the Ed25519 signature whose
 * public key lives in the source repo (verify/integrity-pubkey.txt). An attacker who can
 * modify Pages files cannot forge a valid signature without the private key (held only as
 * a GitHub repo secret).
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const DIST = new URL('../dist/', import.meta.url).pathname;
const MANIFEST_FILENAME = 'integrity-manifest.json';
const SIG_FILENAME = 'integrity-manifest.json.sig';
const MANIFEST_PATH = join(DIST, MANIFEST_FILENAME);
const SIG_PATH = join(DIST, SIG_FILENAME);

/** Recursively walk a directory; return paths relative to base, sorted. */
function walk(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full, base));
    } else {
      files.push(relative(base, full));
    }
  }
  return files.sort();
}

function sha384(filePath) {
  const data = readFileSync(filePath);
  return 'sha384-' + createHash('sha384').update(data).digest('base64');
}

function gitExec(cmd, fallback) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

// --- Collect hashes (skip the manifest and signature themselves) ---
const SKIP = new Set([MANIFEST_FILENAME, SIG_FILENAME]);
const allFiles = walk(DIST).filter((f) => !SKIP.has(f));

const files = /** @type {Record<string, string>} */ ({});
for (const rel of allFiles) {
  files[rel] = sha384(join(DIST, rel));
}

// --- Assemble manifest ---
const manifest = {
  version: 1,
  algorithm: 'sha384',
  commit: process.env.GITHUB_SHA ?? gitExec('git rev-parse HEAD', 'unknown'),
  ref: process.env.GITHUB_REF_NAME ?? gitExec('git rev-parse --abbrev-ref HEAD', 'unknown'),
  builtAt: new Date().toISOString(),
  files,
};

// Canonical serialisation: top-level keys sorted alphabetically, 2-space indent.
// `files` keys are already sorted by walk(). The signature covers exactly this text.
// NOTE: do NOT pass an array replacer to JSON.stringify — it filters recursively, wiping the
// `files` sub-object keys. Instead build a new object with sorted top-level keys.
const sortedManifest = /** @type {typeof manifest} */ ({});
for (const k of Object.keys(manifest).sort()) {
  sortedManifest[/** @type {keyof typeof manifest} */ (k)] =
    manifest[/** @type {keyof typeof manifest} */ (k)];
}
const canonicalJson = JSON.stringify(sortedManifest, null, 2);
const canonicalBytes = new TextEncoder().encode(canonicalJson + '\n');

writeFileSync(MANIFEST_PATH, canonicalBytes);
console.log(`✓  integrity-manifest.json  (${allFiles.length} files)`);

// --- Sign ---
const privKeyEnv = process.env.INTEGRITY_SIGNING_KEY;
if (privKeyEnv) {
  // @noble/curves/ed25519 is a runtime dependency; dynamic import so the script degrades
  // gracefully in exotic environments where the package isn't resolvable.
  const { ed25519 } = await import('@noble/curves/ed25519');
  const privKeyBytes = Buffer.from(privKeyEnv.trim(), 'base64');
  const sig = ed25519.sign(canonicalBytes, privKeyBytes);
  writeFileSync(SIG_PATH, Buffer.from(sig).toString('base64') + '\n', 'utf8');
  console.log('✓  integrity-manifest.json.sig');
} else {
  console.warn(
    '⚠   INTEGRITY_SIGNING_KEY not set — manifest written unsigned.\n' +
      '    Set the env var (base64 Ed25519 private key) in CI for signed builds.\n' +
      '    See verify/README.md for key generation instructions.'
  );
}
